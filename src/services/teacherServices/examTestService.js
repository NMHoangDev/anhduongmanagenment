import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
// Import các hàm thông báo
import {
  sendClassNotification,
  sendClassReminder,
} from "../teacherServices/classManagementService";

const normalizeId = (value) => {
  if (!value) return "";
  const str = String(value).trim();
  const parts = str.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : str;
};

// Format hạn nộp hiển thị tiếng Việt
const _formatDeadlineVi = (deadline) => {
  if (!deadline) return "Không có hạn";
  const d = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(d.getTime())) return "Không có hạn";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Kiểm tra quyền tạo bài test cho lớp
export const checkTeacherPermissionForClass = async (
  teacherId,
  classId,
  subjectId = null
) => {
  const classRef = doc(db, "classes", classId);
  const classSnap = await getDoc(classRef);

  if (!classSnap.exists()) {
    throw new Error("Không tìm thấy lớp học");
  }

  const classData = classSnap.data();

  // Nếu là GVCN thì được tạo bài cho bất kỳ môn nào
  if (classData.homeRoomTeacherId === teacherId) {
    return {
      isAllowed: true,
      role: "homeroom",
      className: classData.name,
    };
  }

  // Nếu là GV bộ môn, kiểm tra có được phân công dạy môn này trong lớp không
  if (subjectId) {
    const assignmentsRef = collection(db, "class_assignments");
    const q = query(
      assignmentsRef,
      where("classId", "==", classId),
      where("teacherId", "==", teacherId),
      where("subjectId", "==", subjectId)
    );
    const assignSnap = await getDocs(q);

    if (!assignSnap.empty) {
      return {
        isAllowed: true,
        role: "subject",
        className: classData.name,
      };
    }
  }

  return {
    isAllowed: false,
    role: null,
    className: classData.name,
  };
};

// Lấy danh sách lớp mà giáo viên có thể tạo bài test
export const getClassesForExamCreation = async (teacherId) => {
  const classes = [];

  // 1. Lấy lớp chủ nhiệm
  const homeroomQuery = query(
    collection(db, "classes"),
    where("homeRoomTeacherId", "==", teacherId)
  );
  const homeroomSnap = await getDocs(homeroomQuery);
  homeroomSnap.forEach((doc) => {
    classes.push({
      id: doc.id,
      ...doc.data(),
      role: "homeroom",
    });
  });

  // 2. Lấy lớp được phân công dạy
  const assignmentsQuery = query(
    collection(db, "class_assignments"),
    where("teacherId", "==", teacherId)
  );
  const assignSnap = await getDocs(assignmentsQuery);

  const assignedClassIds = new Set();
  assignSnap.forEach((doc) => {
    const data = doc.data();
    assignedClassIds.add(data.classId);
  });

  // Lấy thông tin chi tiết các lớp được phân công
  for (const classId of assignedClassIds) {
    if (!classes.find((c) => c.id === classId)) {
      // Tránh trùng với lớp chủ nhiệm
      const classDoc = await getDoc(doc(db, "classes", classId));
      if (classDoc.exists()) {
        classes.push({
          id: classDoc.id,
          ...classDoc.data(),
          role: "subject",
        });
      }
    }
  }

  return classes;
};

// Lấy môn học mà giáo viên được phân công dạy trong lớp
export const getSubjectsForTeacherInClass = async (teacherId, classId) => {
  const assignmentsQuery = query(
    collection(db, "class_assignments"),
    where("teacherId", "==", teacherId),
    where("classId", "==", classId)
  );
  const snap = await getDocs(assignmentsQuery);

  const subjectIds = [];
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.subjectId && !subjectIds.includes(data.subjectId)) {
      subjectIds.push(data.subjectId);
    }
  });

  // Lấy thông tin chi tiết môn học
  const subjects = [];
  for (const subjectId of subjectIds) {
    const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
    if (subjectDoc.exists()) {
      subjects.push({
        subjectId: subjectDoc.id,
        ...subjectDoc.data(),
      });
    }
  }

  return subjects;
};

/**
 * Tạo bài kiểm tra trắc nghiệm mới
 */
export const createExamTest = async ({
  title,
  description = "",
  classId,
  subjectId,
  createdBy,
  deadline,
  durationMinutes = null,
  questions = [],
  visibility = "class",
}) => {
  if (!title) throw new Error("Tiêu đề bắt buộc.");
  if (!classId) throw new Error("Thiếu classId.");
  if (!createdBy) throw new Error("Thiếu createdBy.");
  if (!Array.isArray(questions) || !questions.length) {
    throw new Error("Bài test phải có ít nhất 1 câu hỏi.");
  }

  // Kiểm tra quyền
  const permission = await checkTeacherPermissionForClass(
    createdBy,
    classId,
    subjectId
  );
  if (!permission.isAllowed) {
    throw new Error("Bạn không có quyền tạo bài test cho lớp này");
  }

  const payload = {
    title,
    description,
    classId: normalizeId(classId),
    subjectId: subjectId ? normalizeId(subjectId) : null,
    createdBy: normalizeId(createdBy),
    deadline: deadline ? new Date(deadline) : null,
    durationMinutes: durationMinutes || null,
    questions: questions.map((q, idx) => ({
      id: q.id || `q_${idx + 1}`,
      question: q.question || "",
      options: Array.isArray(q.options) ? q.options : [],
      correctIndexes: Array.isArray(q.correctIndexes) ? q.correctIndexes : [],
      explanation: q.explanation || "",
      points:
        typeof q.points === "number" && !Number.isNaN(q.points) ? q.points : 1,
    })),
    totalPoints: questions.reduce((sum, q) => {
      const pts =
        typeof q.points === "number" && !Number.isNaN(q.points) ? q.points : 1;
      return sum + pts;
    }, 0),
    visibility,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    status: "published", // Mặc định publish luôn
    studentSubmissions: [], // Mảng chứa bài nộp của học sinh
  };

  const docRef = await addDoc(collection(db, "examTests"), payload);

  // Tạo thông báo sau khi tạo bài
  try {
    const titleText = `Làm bài trắc nghiệm: ${title}`;
    const deadlineText = _formatDeadlineVi(payload.deadline);
    const content = `Hạn: ${deadlineText}. Vui lòng vào mục Bài kiểm tra để làm.`;

    if (permission.role === "homeroom") {
      // GVCN có thể gửi thông báo trực tiếp
      await sendClassNotification(payload.createdBy, payload.classId, {
        title: titleText,
        content,
        senderId: payload.createdBy,
        type: "exam",
        recipients: [],
        relatedType: "examTest",
        relatedId: docRef.id,
        subjectId: payload.subjectId || null,
        deadline: payload.deadline || null,
      });
    } else {
      // GV bộ môn gửi reminder
      await sendClassReminder(payload.classId, {
        title: titleText,
        content,
        senderId: payload.createdBy,
        dueDate: payload.deadline || null,
        relatedType: "examTest",
        relatedId: docRef.id,
        subjectId: payload.subjectId || null,
      });
    }
  } catch (err) {
    console.warn("Tạo thông báo cho bài test thất bại:", err?.message || err);
  }

  return docRef.id;
};

export const updateExamTest = async (examId, updates) => {
  if (!examId) throw new Error("Thiếu examId.");
  const ref = doc(db, "examTests", examId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Không tìm thấy bài kiểm tra.");

  const payload = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (payload.questions) {
    payload.questions = payload.questions.map((q, idx) => ({
      id: q.id || `q_${idx + 1}`,
      question: q.question || "",
      options: Array.isArray(q.options) ? q.options : [],
      correctIndexes: Array.isArray(q.correctIndexes) ? q.correctIndexes : [],
      explanation: q.explanation || "",
      points:
        typeof q.points === "number" && !Number.isNaN(q.points) ? q.points : 1,
    }));
    payload.totalPoints = payload.questions.reduce(
      (sum, q) => sum + (q.points || 0),
      0
    );
  }

  if (payload.deadline) {
    payload.deadline = new Date(payload.deadline);
  }

  await updateDoc(ref, payload);
  return true;
};

export const deleteExamTest = async (examId) => {
  if (!examId) throw new Error("Thiếu examId.");
  await deleteDoc(doc(db, "examTests", examId));
  return true;
};

export const getExamTestById = async (examId) => {
  if (!examId) return null;
  const snap = await getDoc(doc(db, "examTests", examId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() || {}) };
};

export const listExamTestsByClass = async ({
  classId,
  status,
  includeDraft = false,
  limit = 50,
}) => {
  const filters = [where("classId", "==", normalizeId(classId))];
  if (status) filters.push(where("status", "==", status));
  if (!includeDraft) {
    filters.push(where("status", "!=", "draft"));
  }

  const qx = query(
    collection(db, "examTests"),
    ...filters,
    orderBy("status"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(qx);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
};
