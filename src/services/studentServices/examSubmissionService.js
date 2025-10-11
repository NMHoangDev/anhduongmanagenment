// src/services/studentServices/examSubmissionService.js
import { db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";

/** ===== Debug helpers ===== */
const DEBUG_EXAM = true; // đổi thành false nếu muốn tắt log

const logScope = (name, meta = {}) => {
  const scopeId = `[ExamSvc] ${name}`;
  if (!DEBUG_EXAM) {
    // no-op
    return {
      start: () => {},
      end: () => {},
      log: () => {},
      error: (...args) => console.error(scopeId, ...args),
    };
  }
  return {
    start: () => {
      console.groupCollapsed(scopeId, meta);
      console.time(scopeId);
    },
    end: () => {
      console.timeEnd(scopeId);
      console.groupEnd();
    },
    log: (...args) => console.log(scopeId, ...args),
    error: (...args) => console.error(scopeId, ...args),
  };
};

/** Helper: so sánh hai mảng số như set (bất kể thứ tự) */
const sameIndexSet = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  const sb = new Set(b);
  for (const v of sa) if (!sb.has(v)) return false;
  return true;
};

/** Lấy lớp học mà học sinh thuộc về (chỉ 1 lớp) */
export const getStudentClass = async (studentId) => {
  const lg = logScope("getStudentClass", { studentId });
  lg.start();
  try {
    if (!studentId) {
      throw new Error("studentId rỗng");
    }

    const classesRef = collection(db, "classes");
    const qy = query(
      classesRef,
      where("students", "array-contains", studentId)
    );
    const snap = await getDocs(qy);

    lg.log("classes matched:", snap.size);

    if (snap.empty) {
      lg.log("Học sinh không thuộc lớp nào");
      return null;
    }

    const classDoc = snap.docs[0];
    const data = { id: classDoc.id, ...classDoc.data() };
    lg.log("studentClass:", data);
    return data;
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/** Lấy các examTests dành cho học sinh theo lớp; kèm cờ hasSubmitted */
export const getExamTestsForStudent = async (
  studentId,
  { onlyPublished = true } = {}
) => {
  const lg = logScope("getExamTestsForStudent", { studentId, onlyPublished });
  lg.start();
  try {
    if (!studentId) throw new Error("Student ID không được để trống");

    // 1) lớp của học sinh
    const studentClass = await getStudentClass(studentId);
    if (!studentClass) {
      lg.log("No class -> return []");
      return [];
    }

    // 2) examTests theo classId
    const examTestsRef = collection(db, "examTests");
    const conditions = [where("classId", "==", studentClass.id)];
    if (onlyPublished) conditions.push(where("status", "==", "published"));

    const qTests = query(
      examTestsRef,
      ...conditions,
      orderBy("createdAt", "desc")
    );
    const testsSnap = await getDocs(qTests);
    lg.log("examTests found:", testsSnap.size);

    const results = [];
    for (const d of testsSnap.docs) {
      const data = { id: d.id, ...d.data() };

      // 3) check đã nộp? -> query examSubmissions (tách collection)
      const subsRef = collection(db, "examSubmissions");
      const qSub = query(
        subsRef,
        where("examId", "==", d.id),
        where("studentId", "==", studentId)
      );
      const subSnap = await getDocs(qSub);

      const row = {
        ...data,
        hasSubmitted: !subSnap.empty,
        className: studentClass.name,
      };
      lg.log("row:", { examId: d.id, hasSubmitted: row.hasSubmitted });
      results.push(row);
    }

    lg.log("return count:", results.length);
    return results;
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/** Lấy chi tiết 1 exam để làm bài; chặn nếu đã nộp hoặc hết hạn */
export const getExamTestForSubmission = async (examTestId, studentId) => {
  const lg = logScope("getExamTestForSubmission", { examTestId, studentId });
  lg.start();
  try {
    if (!examTestId || !studentId)
      throw new Error("Thiếu thông tin examTestId hoặc studentId");

    const examRef = doc(db, "examTests", examTestId);
    const examSnap = await getDoc(examRef);
    if (!examSnap.exists()) throw new Error("Không tìm thấy bài kiểm tra");

    const examData = examSnap.data();
    lg.log("examData.title:", examData?.title);

    // quyền truy cập theo class
    const studentClass = await getStudentClass(studentId);
    const hasAccess = studentClass && studentClass.id === examData.classId;
    lg.log("hasAccess:", hasAccess);
    if (!hasAccess)
      throw new Error("Bạn không có quyền truy cập bài kiểm tra này");

    // đã nộp?
    const subsRef = collection(db, "examSubmissions");
    const qSub = query(
      subsRef,
      where("examId", "==", examTestId),
      where("studentId", "==", studentId)
    );
    const subSnap = await getDocs(qSub);
    lg.log("alreadySubmitted:", !subSnap.empty);
    if (!subSnap.empty) throw new Error("Bạn đã nộp bài kiểm tra này rồi");

    // deadline
    if (examData.deadline) {
      const deadline = examData.deadline.toDate
        ? examData.deadline.toDate()
        : new Date(examData.deadline);
      lg.log("deadline:", deadline);
      if (new Date() > deadline) throw new Error("Đã hết hạn nộp bài");
    }

    const safe = {
      id: examSnap.id,
      ...examData,
      questions: (examData.questions || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        points: q.points,
      })),
    };
    lg.log("return questions:", safe.questions?.length || 0);
    return safe;
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/**
 * Submit bài kiểm tra -> tạo document mới trong collection examSubmissions
 * Signature giữ backward-compatible; `startTime` là optional để tính thời gian làm bài.
 */
export const submitExamTest = async (
  examTestId,
  studentId,
  answers,
  startTime /* optional */
) => {
  const lg = logScope("submitExamTest", {
    examTestId,
    studentId,
    answersCount: Array.isArray(answers) ? answers.length : "N/A",
    startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
  });
  lg.start();
  try {
    if (!examTestId || !studentId || !Array.isArray(answers))
      throw new Error("Dữ liệu không hợp lệ");

    // exam
    const examRef = doc(db, "examTests", examTestId);
    const examSnap = await getDoc(examRef);
    if (!examSnap.exists()) throw new Error("Không tìm thấy bài kiểm tra");
    const examData = examSnap.data();
    lg.log("exam.title:", examData?.title);

    // không cho nộp lần 2
    const subsRef = collection(db, "examSubmissions");
    const qDup = query(
      subsRef,
      where("examId", "==", examTestId),
      where("studentId", "==", studentId)
    );
    const dupSnap = await getDocs(qDup);
    lg.log("dup submissions:", dupSnap.size);
    if (!dupSnap.empty) throw new Error("Bạn đã nộp bài kiểm tra này rồi");

    // deadline
    if (examData.deadline) {
      const deadline = examData.deadline.toDate
        ? examData.deadline.toDate()
        : new Date(examData.deadline);
      lg.log("deadline:", deadline);
      if (new Date() > deadline) throw new Error("Đã hết hạn nộp bài");
    }

    // thông tin học sinh
    const studentRef = doc(db, "students", studentId);
    const studentSnap = await getDoc(studentRef);
    const studentData = studentSnap.exists() ? studentSnap.data() : {};
    lg.log("student:", {
      name: studentData?.name,
      code: studentData?.studentCode,
    });

    // chấm điểm
    let totalScore = 0;
    let correctCount = 0;
    const totalQuestions = (examData.questions || []).length;
    const results = [];

    (examData.questions || []).forEach((question, idx) => {
      const studentAnswer = answers.find(
        (ans) => ans.questionId === question.id
      );
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

      lg.log(`Q${idx + 1}`, {
        selectedIndexes,
        correctIndexes: question.correctIndexes || [],
        isCorrect,
        score,
      });
    });

    const percentage =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    // thời gian làm bài (optional)
    let timeSpentMinutes = 0;
    if (startTime instanceof Date && !Number.isNaN(startTime.getTime())) {
      const endTime = new Date();
      timeSpentMinutes = Math.round((endTime - startTime) / 1000 / 60);
    }
    lg.log("score summary:", {
      totalQuestions,
      correctCount,
      totalScore,
      maxScore: examData.totalPoints || 0,
      percentage,
      timeSpentMinutes,
    });

    const submission = {
      examId: examTestId,
      examTitle: examData.title,
      studentId,
      studentName: studentData.name || "Không rõ",
      studentCode: studentData.studentCode || studentData.id || "",
      submittedAt: serverTimestamp(),
      timeSpentMinutes,
      answers: results,
      totalScore,
      maxScore: examData.totalPoints || 0,
      correctCount,
      totalQuestions,
      percentage,
    };

    // lưu vào collection mới
    const docRef = await addDoc(collection(db, "examSubmissions"), submission);
    lg.log("created submission id:", docRef.id);

    return { id: docRef.id, ...submission };
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/** Lấy bài làm của 1 học sinh cho 1 exam (từ examSubmissions) */
export const getStudentSubmission = async (examTestId, studentId) => {
  const lg = logScope("getStudentSubmission", { examTestId, studentId });
  lg.start();
  try {
    if (!examTestId || !studentId)
      throw new Error("Thiếu thông tin examTestId hoặc studentId");

    const subsRef = collection(db, "examSubmissions");
    const qSub = query(
      subsRef,
      where("examId", "==", examTestId),
      where("studentId", "==", studentId)
    );
    const snap = await getDocs(qSub);
    lg.log("matched submissions:", snap.size);

    if (snap.empty) throw new Error("Không tìm thấy bài làm của học sinh");

    const d = snap.docs[0];
    const data = { id: d.id, ...d.data() };
    lg.log("return submission id:", data.id);
    return data;
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/** Lấy tất cả submissions của một exam (cho giáo viên) */
export const getExamTestSubmissions = async (examTestId) => {
  const lg = logScope("getExamTestSubmissions", { examTestId });
  lg.start();
  try {
    if (!examTestId) throw new Error("Thiếu examTestId");

    const subsRef = collection(db, "examSubmissions");
    const qSub = query(subsRef, where("examId", "==", examTestId));
    const snap = await getDocs(qSub);

    const submissions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    lg.log("count:", submissions.length);
    return {
      examId: examTestId,
      submissions,
      submissionCount: submissions.length,
    };
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};
