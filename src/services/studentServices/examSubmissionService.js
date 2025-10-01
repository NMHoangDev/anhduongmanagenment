import { db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  query,
  where,
  orderBy,
  arrayUnion,
} from "firebase/firestore";

// Helper: tách mảng thành các nhóm tối đa n phần (cho truy vấn 'in')
const chunk = (arr, size = 10) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// Helper: so sánh hai mảng số (set bằng nhau)
const sameIndexSet = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const sa = new Set(a),
    sb = new Set(b);
  for (const v of sa) if (!sb.has(v)) return false;
  return true;
};

// Lấy các lớp học mà học sinh thuộc về (classes.students chứa studentId)
export const getStudentClasses = async (studentId) => {
  if (!studentId) return [];
  const ref = collection(db, "classes");
  const q = query(ref, where("students", "array-contains", studentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Lấy tất cả bài test (examTests) cho học sinh theo các lớp em thuộc về
export const getExamTestsForStudent = async (
  studentId,
  { onlyPublished = true } = {}
) => {
  const classes = await getStudentClasses(studentId);
  const classIds = classes.map((c) => c.id);
  if (!classIds.length) return [];

  const tests = [];
  const classChunks = chunk(classIds, 10);
  for (const ids of classChunks) {
    const ref = collection(db, "examTests");
    const qConds = [where("classId", "in", ids)];
    if (onlyPublished) {
      qConds.push(where("status", "==", "published"));
    }
    const q = query(ref, ...qConds, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const testData = { id: d.id, ...d.data() };
      // Kiểm tra học sinh đã nộp bài chưa
      const hasSubmitted = testData.studentSubmissions?.some(
        (sub) => sub.studentId === studentId
      );
      testData.hasSubmitted = hasSubmitted;
      tests.push(testData);
    });
  }
  return tests;
};

// Lấy bài test theo một lớp cụ thể
export const getExamTestsForClass = async (
  classId,
  { onlyPublished = true } = {}
) => {
  if (!classId) return [];
  const ref = collection(db, "examTests");
  const qConds = [where("classId", "==", classId)];
  if (onlyPublished) {
    qConds.push(where("status", "==", "published"));
  }
  const q = query(ref, ...qConds, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Lấy chi tiết một bài test (để làm bài)
export const getExamTestForSubmission = async (examTestId, studentId) => {
  const examRef = doc(db, "examTests", examTestId);
  const examSnap = await getDoc(examRef);

  if (!examSnap.exists()) {
    throw new Error("Không tìm thấy bài kiểm tra");
  }

  const examData = examSnap.data();

  // Kiểm tra học sinh có trong lớp không
  const classes = await getStudentClasses(studentId);
  const hasAccess = classes.some((cls) => cls.id === examData.classId);

  if (!hasAccess) {
    throw new Error("Bạn không có quyền truy cập bài kiểm tra này");
  }

  // Kiểm tra đã nộp bài chưa
  const hasSubmitted = examData.studentSubmissions?.some(
    (sub) => sub.studentId === studentId
  );

  if (hasSubmitted) {
    throw new Error("Bạn đã nộp bài kiểm tra này rồi");
  }

  // Kiểm tra hạn nộp
  if (examData.deadline && new Date() > examData.deadline.toDate()) {
    throw new Error("Đã hết hạn nộp bài");
  }

  return {
    id: examSnap.id,
    ...examData,
    // Không trả về đáp án đúng cho học sinh
    questions: examData.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      points: q.points,
      // Không include correctIndexes và explanation
    })),
  };
};

// Submit bài kiểm tra
export const submitExamTest = async (examTestId, studentId, answers) => {
  if (!examTestId || !studentId || !Array.isArray(answers)) {
    throw new Error("Dữ liệu không hợp lệ");
  }

  // Lấy thông tin bài test
  const examRef = doc(db, "examTests", examTestId);
  const examSnap = await getDoc(examRef);

  if (!examSnap.exists()) {
    throw new Error("Không tìm thấy bài kiểm tra");
  }

  const examData = examSnap.data();

  // Kiểm tra đã nộp bài chưa
  const hasSubmitted = examData.studentSubmissions?.some(
    (sub) => sub.studentId === studentId
  );
  if (hasSubmitted) {
    throw new Error("Bạn đã nộp bài kiểm tra này rồi");
  }

  // Kiểm tra hạn nộp
  if (examData.deadline && new Date() > examData.deadline.toDate()) {
    throw new Error("Đã hết hạn nộp bài");
  }

  // Lấy thông tin học sinh
  const studentRef = doc(db, "students", studentId);
  const studentSnap = await getDoc(studentRef);
  const studentData = studentSnap.exists() ? studentSnap.data() : {};

  // Chấm điểm
  const results = [];
  let totalScore = 0;
  let correctCount = 0;
  let totalQuestions = examData.questions.length;

  examData.questions.forEach((question, index) => {
    const studentAnswer = answers.find((ans) => ans.questionId === question.id);
    const selectedIndexes = studentAnswer
      ? studentAnswer.selectedIndexes || []
      : [];

    const isCorrect = sameIndexSet(
      selectedIndexes,
      question.correctIndexes || []
    );
    const score = isCorrect ? question.points || 1 : 0;

    if (isCorrect) correctCount++;
    totalScore += score;

    results.push({
      questionId: question.id,
      questionText: question.question,
      selectedIndexes,
      correctIndexes: question.correctIndexes || [],
      isCorrect,
      score,
      maxScore: question.points || 1,
    });
  });

  // Tạo submission object
  const submission = {
    studentId,
    studentName: studentData.name || "Không rõ",
    studentCode: studentData.studentCode || studentData.id || "",
    submittedAt: serverTimestamp(),
    answers: results,
    totalScore,
    maxScore: examData.totalPoints || 0,
    correctCount,
    totalQuestions,
    percentage:
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0,
  };

  // Cập nhật bài test với submission mới
  await updateDoc(examRef, {
    studentSubmissions: arrayUnion(submission),
  });

  return {
    submissionId: `${examTestId}_${studentId}`,
    ...submission,
    examTitle: examData.title,
    examId: examTestId,
  };
};

// Lấy kết quả bài làm của học sinh
export const getStudentSubmission = async (examTestId, studentId) => {
  const examRef = doc(db, "examTests", examTestId);
  const examSnap = await getDoc(examRef);

  if (!examSnap.exists()) {
    throw new Error("Không tìm thấy bài kiểm tra");
  }

  const examData = examSnap.data();
  const submission = examData.studentSubmissions?.find(
    (sub) => sub.studentId === studentId
  );

  if (!submission) {
    throw new Error("Không tìm thấy bài làm của học sinh");
  }

  return {
    ...submission,
    examTitle: examData.title,
    examId: examTestId,
  };
};

// Lấy tất cả submissions của một bài test (cho giáo viên)
export const getExamTestSubmissions = async (examTestId) => {
  const examRef = doc(db, "examTests", examTestId);
  const examSnap = await getDoc(examRef);

  if (!examSnap.exists()) {
    throw new Error("Không tìm thấy bài kiểm tra");
  }

  const examData = examSnap.data();
  return {
    examTitle: examData.title,
    examId: examTestId,
    totalPoints: examData.totalPoints || 0,
    submissions: examData.studentSubmissions || [],
    submissionCount: (examData.studentSubmissions || []).length,
  };
};
