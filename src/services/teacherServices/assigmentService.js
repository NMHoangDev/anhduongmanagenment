import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase.js";

/**
 * Assignment service for teacher UI.
 * - Collection: "assignments"
 * - Each assignment doc:
 *   { title, content, subject, deadline (Timestamp), createdAt (Timestamp),
 *     createdBy (teacherId), classId, status, type, difficulty, attachments: [], totalStudents, submitted, graded }
 *
 * Permission rule (checked in helpers):
 * - teacher can manage/assign only if they are homeRoomTeacher of the class OR appear in class.teachingAssignments
 */

/* helpers */

async function getClassDoc(classId) {
  if (!classId) return null;
  const ref = doc(db, "classes", classId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Check whether teacherId is allowed to manage assignments for classId
 * Updated: require BOTH being homeroom teacher AND listed in teachingAssignments
 */
// helper: normalize various shapes to a string id (or null)
function normalizeTeacherValue(v) {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    // common shapes
    if (v.id) return String(v.id);
    if (v._id) return String(v._id);
    if (v.teacherId) return String(v.teacherId);
    if (v.teacher && typeof v.teacher === "string") return String(v.teacher);
    if (v.teacher && typeof v.teacher === "object") {
      return String(v.teacher.id || v.teacher._id || v.teacher.teacherId || "");
    }
    // fallback: try JSON stringify minimal
    try {
      return String(
        v.toString && v.toString() ? v.toString() : JSON.stringify(v)
      );
    } catch (e) {
      return null;
    }
  }
  return null;
}

function fieldMatchesTeacher(field, teacherId) {
  if (!field || !teacherId) return false;
  const a = normalizeTeacherValue(field);
  const b = String(teacherId);
  const match = a === b;
  console.debug("fieldMatchesTeacher check", {
    field,
    normalizedField: a,
    teacherId: b,
    match,
  });
  return match;
}

export async function canManageClass(teacherId, classId) {
  console.debug("canManageClass called", { teacherId, classId });
  if (!teacherId || !classId) {
    console.debug("canManageClass -> missing param", { teacherId, classId });
    return false;
  }
  const cls = await getClassDoc(classId);
  if (!cls) {
    console.debug("canManageClass -> class not found", { classId });
    return false;
  }
  console.debug("canManageClass -> class doc", { id: cls.id, name: cls.name });

  // homeroom may be stored with several keys
  const homeroomMatch =
    fieldMatchesTeacher(cls.homeRoomTeacher, teacherId) ||
    fieldMatchesTeacher(cls.homeRoomTeacherId, teacherId) ||
    fieldMatchesTeacher(cls.homeroomTeacher, teacherId) ||
    fieldMatchesTeacher(cls.teacher, teacherId) ||
    fieldMatchesTeacher(cls.teacherId, teacherId);

  const ta = cls.teachingAssignments || [];
  const teachingMatch =
    Array.isArray(ta) &&
    ta.some((entry) => {
      if (!entry) return false;
      if (typeof entry === "string") return entry === teacherId;
      if (fieldMatchesTeacher(entry.teacher, teacherId)) return true;
      if (entry.teacherId === teacherId) return true;
      if (
        entry.teacherId &&
        typeof entry.teacherId === "string" &&
        entry.teacherId === teacherId
      )
        return true;
      if (
        entry.teacher &&
        (entry.teacher === teacherId ||
          (typeof entry.teacher === "object" &&
            (entry.teacher.id === teacherId ||
              entry.teacher._id === teacherId)))
      )
        return true;
      return false;
    });

  console.debug("canManageClass matches", { homeroomMatch, teachingMatch });
  // allow when teacher is homeroom OR teaching assignment
  return Boolean(homeroomMatch || teachingMatch);
}

export async function getClassesForTeacher(teacherId) {
  console.debug("getClassesForTeacher (simplified) called", { teacherId });
  if (!teacherId) return [];
  const tid = String(teacherId);

  const ref = collection(db, "classes");
  const snap = await getDocs(ref);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.debug("getClassesForTeacher fetched:", rows.length);

  const matched = rows.filter((cls) => {
    // 1. Match trực tiếp các field teacher / homeroom
    const directMatch =
      fieldMatchesTeacher(cls.teacher, tid) ||
      fieldMatchesTeacher(cls.teacherId, tid) ||
      fieldMatchesTeacher(cls.homeRoomTeacherId, tid) ||
      fieldMatchesTeacher(cls.homeRoomTeacher, tid);

    // 2. Match trong teachingAssignments
    const ta = Array.isArray(cls.teachingAssignments)
      ? cls.teachingAssignments
      : [];
    const teachingMatch = ta.some((entry) => {
      if (!entry) return false;
      if (typeof entry === "string") return entry === tid;
      if (typeof entry === "object") {
        if (fieldMatchesTeacher(entry.teacherId, tid)) return true;
        if (fieldMatchesTeacher(entry.teacher, tid)) return true;
        if (fieldMatchesTeacher(entry.id, tid)) return true;
      }
      return false;
    });

    const ok = directMatch || teachingMatch;

    console.debug("classCheck", {
      classId: cls.id,
      name: cls.name,
      directMatch,
      teachingMatch,
      teacherField: cls.teacher,
      teacherIdField: cls.teacherId,
      homeRoomTeacherId: cls.homeRoomTeacherId,
      teachingAssignmentsLen: ta.length,
      matched: ok,
    });

    return ok;
  });

  const result = matched.map((c) => ({
    id: c.id,
    name: c.name || c.id,
    studentCount:
      c.studentCount || (Array.isArray(c.students) ? c.students.length : 0),
    raw: c,
  }));

  console.debug(
    "getClassesForTeacher matched:",
    result.length,
    result.map((r) => r.id)
  );
  return result;
}

// Nếu bạn vẫn gọi getClassesForTeacherV2 ở frontend, cho V2 dùng lại logic trên để tránh lệch
export async function getClassesForTeacherV2(teacherId) {
  // chỉ wrap lại để tương thích
  return getClassesForTeacher(teacherId);
}

/* assignments API */

/**
 * Get assignments for a specific class (only if teacher can manage that class)
 * teacherId optional — if provided, permission is checked
 */
export async function getAssignmentsByClass(classId, teacherId = null) {
  if (!classId) return [];
  if (teacherId) {
    const ok = await canManageClass(teacherId, classId);
    if (!ok) throw new Error("Không có quyền xem lớp này");
  }
  const ref = collection(db, "assignments");
  const q = query(
    ref,
    where("classId", "==", classId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      // convert Timestamp to ISO for UI convenience
      deadline: data.deadline
        ? data.deadline.toDate
          ? data.deadline.toDate().toISOString()
          : data.deadline
        : null,
      createdAt: data.createdAt
        ? data.createdAt.toDate
          ? data.createdAt.toDate().toISOString()
          : data.createdAt
        : null,
    };
  });
}

/**
 * Get assignments that teacher created or for classes teacher manages
 */
export async function getAssignmentsForTeacher(teacherId) {
  if (!teacherId) return [];
  // fetch assignments createdBy teacher
  const ref = collection(db, "assignments");
  const q1 = query(
    ref,
    where("createdBy", "==", teacherId),
    orderBy("createdAt", "desc")
  );
  const snap1 = await getDocs(q1);
  const bySelf = snap1.docs.map((d) => ({ id: d.id, ...d.data() }));

  // fetch classes teacher manages and get assignments for them
  const classes = await getClassesForTeacher(teacherId);
  const classIds = classes.map((c) => c.id);
  let byClasses = [];
  if (classIds.length) {
    // Firestore 'in' supports up to 10 elements; fall back to multiple queries if more
    const chunkSize = 10;
    for (let i = 0; i < classIds.length; i += chunkSize) {
      const chunk = classIds.slice(i, i + chunkSize);
      const q = query(
        ref,
        where("classId", "in", chunk),
        orderBy("createdAt", "desc")
      );
      const s = await getDocs(q);
      byClasses = byClasses.concat(
        s.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    }
  }

  // merge unique by id
  const map = new Map();
  [...bySelf, ...byClasses].forEach((a) => map.set(a.id, a));
  return Array.from(map.values()).map((data) => ({
    ...data,
    deadline: data.deadline
      ? data.deadline.toDate
        ? data.deadline.toDate().toISOString()
        : data.deadline
      : null,
    createdAt: data.createdAt
      ? data.createdAt.toDate
        ? data.createdAt.toDate().toISOString()
        : data.createdAt
      : null,
  }));
}

/**
 * Create new assignment — teacherId must be allowed to assign to data.classId
 * data.deadline may be ISO string / Date / dayjs — converted to Timestamp
 */
export async function createAssignment(teacherId, data) {
  if (!teacherId) throw new Error("teacherId required");
  if (!data || !data.classId) throw new Error("classId required");
  const ok = await canManageClass(teacherId, data.classId);
  if (!ok) throw new Error("Không có quyền phân công cho lớp này");

  const ref = collection(db, "assignments");

  const payload = {
    title: data.title || "",
    content: data.content || "",
    subject: data.subject || "",
    classId: data.classId,
    status: data.status || "active",
    type: data.type || "homework",
    difficulty: data.difficulty || "medium",
    attachments: data.attachments || [],
    totalStudents:
      typeof data.totalStudents === "number"
        ? data.totalStudents
        : data.totalStudents || 0,
    submitted: 0,
    graded: 0,
    createdBy: teacherId,
    createdAt: serverTimestamp(),
    deadline: data.deadline
      ? data.deadline instanceof Date
        ? Timestamp.fromDate(data.deadline)
        : data.deadline.toDate
        ? data.deadline
        : Timestamp.fromDate(new Date(data.deadline))
      : null,
  };

  // add doc
  const docRef = await addDoc(ref, payload);

  // optional: push assignment id into class.assignments array
  try {
    const classRef = doc(db, "classes", data.classId);
    await updateDoc(classRef, {
      assignments: arrayUnion(docRef.id),
      lastUpdated: serverTimestamp(),
    });
  } catch (err) {
    // ignore if class update fails
    console.warn(
      "Warning: failed to update class.assignments",
      err.message || err
    );
  }

  return { id: docRef.id, ...payload };
}

/**
 * Update assignment — teacher must be creator OR be allowed on the class
 * data.deadline handled same as create
 */
export async function updateAssignment(teacherId, assignmentId, data) {
  if (!teacherId) throw new Error("teacherId required");
  if (!assignmentId) throw new Error("assignmentId required");

  const ref = doc(db, "assignments", assignmentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Assignment not found");
  const existing = { id: snap.id, ...snap.data() };

  const isCreator = existing.createdBy === teacherId;
  const ok = isCreator || (await canManageClass(teacherId, existing.classId));
  if (!ok) throw new Error("Không có quyền chỉnh sửa bài tập này");

  const payload = { ...data };
  if (data.deadline) {
    payload.deadline =
      data.deadline instanceof Date
        ? Timestamp.fromDate(data.deadline)
        : data.deadline.toDate
        ? data.deadline
        : Timestamp.fromDate(new Date(data.deadline));
  }

  payload.lastUpdated = serverTimestamp();

  await updateDoc(ref, payload);
  return true;
}

/**
 * Delete assignment — permission same as update. Also remove id from class.assignments if present.
 */
export async function deleteAssignment(teacherId, assignmentId) {
  if (!teacherId || !assignmentId) throw new Error("missing params");

  const ref = doc(db, "assignments", assignmentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Assignment not found");
  const existing = { id: snap.id, ...snap.data() };

  const isCreator = existing.createdBy === teacherId;
  const ok = isCreator || (await canManageClass(teacherId, existing.classId));
  if (!ok) throw new Error("Không có quyền xóa bài tập này");

  // delete doc
  await deleteDoc(ref);

  // remove from class assignments array (best-effort)
  try {
    const classRef = doc(db, "classes", existing.classId);
    await updateDoc(classRef, {
      assignments: arrayRemove(assignmentId),
      lastUpdated: serverTimestamp(),
    });
  } catch (err) {
    console.warn(
      "Warning: failed to remove assignment id from class",
      err.message || err
    );
  }

  return true;
}

/**
 * Lấy các lớp mà teacherId là chủ nhiệm (nếu có trường teachers/{id}.homeRoomClasses)
 * Hoặc fallback: scan classes và match các trường homeroom.
 */
export async function getHomeRoomClasses(teacherId) {
  console.debug("getHomeRoomClasses called", { teacherId });
  if (!teacherId) return [];

  const resultByTeacherDoc = [];
  try {
    const teacherRef = doc(db, "teachers", teacherId);
    const teacherSnap = await getDoc(teacherRef);
    if (teacherSnap.exists()) {
      const data = teacherSnap.data();
      const homeRoomIds = Array.isArray(data.homeRoomClasses)
        ? data.homeRoomClasses
        : [];
      console.debug("teacher doc homeRoomClasses:", homeRoomIds);
      for (const cid of homeRoomIds) {
        const cls = await getClassDoc(cid);
        if (cls) {
          resultByTeacherDoc.push({
            id: cls.id,
            ...cls,
            totalStudents: (cls.students || cls.studentCount || []).length || 0,
          });
        }
      }
      if (resultByTeacherDoc.length) {
        console.debug(
          "getHomeRoomClasses -> from teacher doc count",
          resultByTeacherDoc.length
        );
        return resultByTeacherDoc;
      }
    }
  } catch (err) {
    console.warn("getHomeRoomClasses -> teacher doc read failed", err);
  }

  // fallback: scan classes collection and match homeroom fields
  const ref = collection(db, "classes");
  const snap = await getDocs(ref);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const matched = rows.filter((cls) => {
    const homeroomMatch =
      fieldMatchesTeacher(cls.homeRoomTeacher, teacherId) ||
      fieldMatchesTeacher(cls.homeRoomTeacherId, teacherId) ||
      fieldMatchesTeacher(cls.homeroomTeacher, teacherId) ||
      fieldMatchesTeacher(cls.teacher, teacherId) ||
      fieldMatchesTeacher(cls.teacherId, teacherId);

    console.debug("getHomeRoomClasses.classCheck", {
      id: cls.id,
      name: cls.name,
      homeroomMatch,
      homeRoomTeacher: cls.homeRoomTeacher,
      teacherField: cls.teacher || cls.teacherId,
    });

    return Boolean(homeroomMatch);
  });

  const mapped = matched.map((c) => ({
    id: c.id,
    ...c,
    totalStudents: (c.students || c.studentCount || []).length || 0,
  }));
  console.debug("getHomeRoomClasses -> matched count", mapped.length);
  return mapped;
}

/**
 * Lấy các lớp mà teacherId xuất hiện trong teachingAssignments
 * (scan classes và filter; có log chi tiết)
 */
export async function getTeachingClasses(teacherId) {
  console.debug("getTeachingClasses called", { teacherId });
  if (!teacherId) return [];

  const ref = collection(db, "classes");
  const snap = await getDocs(ref);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const matched = rows.filter((cls) => {
    const ta = cls.teachingAssignments || [];
    const teachingMatch =
      Array.isArray(ta) &&
      ta.some((entry) => {
        if (!entry) return false;
        if (typeof entry === "string") return entry === teacherId;
        if (entry.teacherId === teacherId) return true;
        if (fieldMatchesTeacher(entry.teacher, teacherId)) return true;
        // support nested shapes
        if (entry.id === teacherId || entry._id === teacherId) return true;
        return false;
      });

    console.debug("getTeachingClasses.classCheck", {
      id: cls.id,
      name: cls.name,
      teachingMatch,
      teachingAssignments: cls.teachingAssignments,
    });

    return Boolean(teachingMatch);
  });

  const mapped = matched.map((c) => ({
    id: c.id,
    ...c,
    totalStudents: (c.students || c.studentCount || []).length || 0,
  }));
  console.debug("getTeachingClasses -> matched count", mapped.length);
  return mapped;
}

/**
 * Tổng hợp: trả về các lớp mà giáo viên là chủ nhiệm HOẶC đang giảng dạy (unique)
 */
export async function getClassesForTeacherV2(teacherId) {
  console.debug("getClassesForTeacherV2 called", { teacherId });
  if (!teacherId) return [];

  const [homeRoom, teaching] = await Promise.all([
    getHomeRoomClasses(teacherId),
    getTeachingClasses(teacherId),
  ]);

  const map = new Map();
  [...homeRoom, ...teaching].forEach((c) => {
    if (!map.has(c.id)) {
      map.set(c.id, {
        id: c.id,
        name: c.name || c.id,
        studentCount:
          c.totalStudents || c.studentCount || (c.students || []).length || 0,
        raw: c,
      });
    }
  });

  const result = Array.from(map.values());
  console.debug(
    "getClassesForTeacherV2 -> total matched",
    result.length,
    "ids:",
    result.map((r) => r.id)
  );
  return result;
}
