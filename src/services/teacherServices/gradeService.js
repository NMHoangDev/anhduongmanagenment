import {
  addDoc,
  arrayUnion,
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

const normalizeId = (value) => {
  if (!value) return "";
  const str = String(value).trim();
  const parts = str.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : str;
};

const subjectNameCache = new Map();

const fetchSubjectName = async (subjectId) => {
  const sid = normalizeId(subjectId);
  if (!sid) return null;
  if (subjectNameCache.has(sid)) return subjectNameCache.get(sid);

  try {
    const snap = await getDoc(doc(db, "subjects", sid));
    if (snap.exists()) {
      const data = snap.data() || {};
      const name =
        data.name ||
        data.subjectName ||
        data.title ||
        (data.code ? `${data.code}` : null) ||
        sid;
      subjectNameCache.set(sid, name);
      return name;
    }
  } catch (err) {
    console.error("fetchSubjectName error:", err);
  }

  subjectNameCache.set(sid, sid);
  return sid;
};

/**
 * Kiểm tra giáo viên có được nhập điểm cho môn/class hay không.
 * Điều kiện: giáo viên có phân công "teaching" tương ứng trong classAssignments.
 */
export const canTeacherGradeSubject = async (teacherId, classId, subjectId) => {
  const tId = normalizeId(teacherId);
  const cId = normalizeId(classId);
  const sId = normalizeId(subjectId);

  if (!tId || !cId || !sId) return false;

  // Đảm bảo lớp tồn tại (để báo lỗi rõ ràng)
  const classSnap = await getDoc(doc(db, "classes", cId));
  if (!classSnap.exists()) {
    throw new Error("Không tìm thấy lớp đã chọn.");
  }

  // Kiểm tra phân công giảng dạy
  const assignQuery = query(
    collection(db, "classAssignments"),
    where("classId", "==", cId),
    where("teacherId", "==", tId),
    where("type", "==", "teaching"),
    where("subjectId", "==", sId)
  );
  const assignSnap = await getDocs(assignQuery);

  return !assignSnap.empty;
};

/**
 * Lấy danh sách môn mà giáo viên (với vai trò GVCN) được phép nhập điểm trong lớp.
 */
export const getTeacherSubjectsForClass = async (teacherId, classId) => {
  const tId = normalizeId(teacherId);
  const cId = normalizeId(classId);
  if (!tId || !cId) return [];

  const classSnap = await getDoc(doc(db, "classes", cId));
  if (!classSnap.exists()) return [];

  const classData = classSnap.data() || {};
  if (normalizeId(classData.homeRoomTeacherId) !== tId) return [];

  const assignQuery = query(
    collection(db, "classAssignments"),
    where("classId", "==", cId),
    where("teacherId", "==", tId),
    where("type", "==", "teaching")
  );

  const assignSnap = await getDocs(assignQuery);

  const subjects = await Promise.all(
    assignSnap.docs.map(async (d) => {
      const data = d.data() || {};
      const sid = normalizeId(data.subjectId);
      const subjectName =
        data.subjectName || (sid ? await fetchSubjectName(sid) : null);

      return {
        id: d.id,
        classId: cId,
        subjectId: sid,
        subjectName: subjectName || sid,
        raw: data,
      };
    })
  );

  return subjects;
};

/**
 * Lấy danh sách điểm theo lớp + môn (dùng khi chuẩn bị nhập/chỉnh sửa).
 */
export const getGradesByClassAndSubject = async (classId, subjectId) => {
  const cId = normalizeId(classId);
  const sId = normalizeId(subjectId);
  if (!cId || !sId) return [];

  const qx = query(
    collection(db, "grades"),
    where("classId", "==", cId),
    where("subjectId", "==", sId),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(qx);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
};

/**
 * Tạo điểm mới cho học sinh.
 */
export const createGradeEntry = async ({
  teacherId,
  classId,
  subjectId,
  studentId,
  term,
  score,
  maxScore = 10,
  note = "",
  gradeType = "regular",
}) => {
  const allowed = await canTeacherGradeSubject(teacherId, classId, subjectId);
  if (!allowed) {
    throw new Error("Bạn không có quyền nhập điểm cho môn học này.");
  }

  if (typeof score !== "number" || Number.isNaN(score)) {
    throw new Error("Điểm phải là số.");
  }

  const payload = {
    teacherId: normalizeId(teacherId),
    classId: normalizeId(classId),
    subjectId: normalizeId(subjectId),
    studentId: normalizeId(studentId),
    term: term || "HK1",
    score,
    maxScore,
    gradeType,
    note,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "grades"), payload);
  return docRef.id;
};

/**
 * Cập nhật điểm đã có.
 */
export const updateGradeEntry = async (gradeId, teacherId, updates) => {
  const gId = normalizeId(gradeId);
  if (!gId) throw new Error("Thiếu gradeId.");

  const gradeRef = doc(db, "grades", gId);
  const gradeSnap = await getDoc(gradeRef);
  if (!gradeSnap.exists()) throw new Error("Không tìm thấy điểm cần sửa.");

  const gradeData = gradeSnap.data() || {};
  const allowed = await canTeacherGradeSubject(
    teacherId,
    gradeData.classId,
    gradeData.subjectId
  );
  if (!allowed) {
    throw new Error("Bạn không có quyền chỉnh sửa điểm này.");
  }

  const payload = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (payload.score !== undefined) {
    const parsed = Number(payload.score);
    if (Number.isNaN(parsed)) {
      throw new Error("Điểm phải là số.");
    }
    payload.score = parsed;
  }

  await updateDoc(gradeRef, payload);
  return true;
};

/**
 * Xóa điểm.
 */
export const deleteGradeEntry = async (gradeId, teacherId) => {
  const gId = normalizeId(gradeId);
  if (!gId) throw new Error("Thiếu gradeId.");

  const gradeRef = doc(db, "grades", gId);
  const gradeSnap = await getDoc(gradeRef);
  if (!gradeSnap.exists()) throw new Error("Không tìm thấy điểm cần xóa.");

  const gradeData = gradeSnap.data() || {};
  const allowed = await canTeacherGradeSubject(
    teacherId,
    gradeData.classId,
    gradeData.subjectId
  );
  if (!allowed) {
    throw new Error("Bạn không có quyền xóa điểm này.");
  }

  await deleteDoc(gradeRef);
  return true;
};

/**
 * Thêm lịch sử chỉnh sửa vào điểm (tuỳ chọn).
 */
export const appendGradeHistory = async (gradeId, teacherId, changeLog) => {
  const gId = normalizeId(gradeId);
  if (!gId) throw new Error("Thiếu gradeId.");

  const gradeRef = doc(db, "grades", gId);
  const gradeSnap = await getDoc(gradeRef);
  if (!gradeSnap.exists()) throw new Error("Không tìm thấy điểm.");

  const gradeData = gradeSnap.data() || {};
  const allowed = await canTeacherGradeSubject(
    teacherId,
    gradeData.classId,
    gradeData.subjectId
  );
  if (!allowed) throw new Error("Bạn không có quyền ghi lịch sử điểm này.");

  await updateDoc(gradeRef, {
    history: arrayUnion({
      by: normalizeId(teacherId),
      change: changeLog || "",
      at: serverTimestamp(),
    }),
    updatedAt: serverTimestamp(),
  });

  return true;
};
