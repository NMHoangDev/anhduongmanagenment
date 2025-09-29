import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

const studentsCol = collection(db, "students");
const parentsCol = collection(db, "parents");
const classesCol = collection(db, "classes");
const teachersCol = collection(db, "teachers");

function sanitizeId(id = "") {
  return String(id).trim().replace(/\//g, "_");
}

// helper: try find parent document for a student id
async function findParentByStudentId(sid) {
  try {
    // 0) try doc named `${sid}_parent`
    const directId = `${sid}_parent`;
    const directSnap = await getDoc(doc(parentsCol, directId));
    if (directSnap.exists()) return { id: directSnap.id, ...directSnap.data() };

    // 1) query parents where studentId == `/students/${sid}` or == sid
    const candidatePaths = [`/students/${sid}`, sid];
    const q = query(parentsCol, where("studentId", "in", candidatePaths));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }

    // 2) fallback: equality check (some docs may store full path only)
    const q2 = query(parentsCol, where("studentId", "==", `/students/${sid}`));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const d = snap2.docs[0];
      return { id: d.id, ...d.data() };
    }
  } catch (err) {
    // swallow and return null; caller will handle
    console.error("findParentByStudentId:", err);
  }
  return null;
}

// Trả về profile của user hiện đang đăng nhập (hoặc uid truyền vào)
// includes related parent, class and homeRoomTeacher (minimal) info when available
export async function getMyProfile(uid) {
  try {
    const auth = getAuth();
    const currentUid = uid || (auth.currentUser && auth.currentUser.uid);
    if (!currentUid) throw new Error("No authenticated user or uid provided");

    const sid = sanitizeId(currentUid);
    const snap = await getDoc(doc(studentsCol, sid));
    if (!snap.exists()) return null;

    const student = { id: snap.id, ...snap.data() };

    // attach parent info
    let parent = null;
    if (
      student.parent &&
      typeof student.parent === "object" &&
      (student.parent.uid || student.parent.id || student.parent.name)
    ) {
      parent = {
        ...(student.parent.id ? { id: student.parent.id } : {}),
        ...student.parent,
      };
    } else if (student.parentId) {
      try {
        const pSnap = await getDoc(doc(parentsCol, student.parentId));
        if (pSnap.exists()) parent = { id: pSnap.id, ...pSnap.data() };
      } catch (e) {
        // ignore and fallback
      }
    }
    if (!parent) {
      parent = await findParentByStudentId(sid);
    }

    // attach class info and minimal homeRoomTeacher info
    let classInfo = null;
    const classIdRaw = student.classId;
    if (classIdRaw) {
      const classId = String(classIdRaw).includes("/")
        ? String(classIdRaw).split("/").pop()
        : String(classIdRaw);
      const cid = sanitizeId(classId);
      try {
        const cSnap = await getDoc(doc(classesCol, cid));
        if (cSnap.exists()) {
          classInfo = { id: cSnap.id, ...cSnap.data() };
          // try attach minimal teacher info if homeRoomTeacherId present
          const homeTeacherIdRaw =
            classInfo.homeRoomTeacherId ||
            classInfo.teacher ||
            classInfo.teacherId;
          if (homeTeacherIdRaw) {
            const teacherId = String(homeTeacherIdRaw).includes("/")
              ? String(homeTeacherIdRaw).split("/").pop()
              : String(homeTeacherIdRaw);
            try {
              const tSnap = await getDoc(
                doc(teachersCol, sanitizeId(teacherId))
              );
              if (tSnap.exists())
                classInfo.homeRoomTeacher = {
                  id: tSnap.id,
                  ...(tSnap.data() || {}),
                };
            } catch (err) {
              // ignore teacher fetch errors
            }
          }
        }
      } catch (err) {
        console.error("get class:", err);
      }
    }

    return { ...student, parent, class: classInfo };
  } catch (err) {
    console.error("getMyProfile:", err);
    throw err;
  }
}

// expose helpers if needed
export async function getMyParent(uid) {
  const profile = await getMyProfile(uid);
  return profile ? profile.parent : null;
}

export async function getMyClass(uid) {
  const profile = await getMyProfile(uid);
  return profile ? profile.class : null;
}

// Chỉ cho phép user chỉnh thông tin của chính họ.
// Không cho phép thay đổi các trường nhạy cảm như role, parentId, createdAt, studentId, classId, uid
export async function updateMyProfile(uid, updates = {}) {
  try {
    const auth = getAuth();
    const currentUid = uid || (auth.currentUser && auth.currentUser.uid);
    if (!currentUid) throw new Error("No authenticated user or uid provided");

    const sid = sanitizeId(currentUid);

    // blacklist các trường không cho phép cập nhật từ client
    const forbidden = [
      "role",
      "parentId",
      "studentId",
      "createdAt",
      "id",
      "classId",
      "uid",
      "authUid",
    ];
    const payload = Object.keys(updates || {}).reduce((acc, k) => {
      if (!forbidden.includes(k)) acc[k] = updates[k];
      return acc;
    }, {});

    if (Object.keys(payload).length === 0) {
      throw new Error("No allowed fields to update");
    }

    const ref = doc(studentsCol, sid);
    await updateDoc(ref, payload);
    // return latest minimal shape
    return { id: sid, ...payload };
  } catch (err) {
    console.error("updateMyProfile:", err);
    throw err;
  }
}

// Thay đổi mật khẩu cho user đang đăng nhập.
// Nếu currentPassword được truyền sẽ reauthenticate trước.
// Tránh tự reauthenticate nếu không có currentPassword.
export async function changePassword(newPassword, currentPassword = null) {
  if (!newPassword) throw new Error("newPassword is required");
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  try {
    if (currentPassword) {
      // reauthenticate then update
      const credential = EmailAuthProvider.credential(
        user.email || "",
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
    }
    await updatePassword(user, newPassword);
    return true;
  } catch (err) {
    console.error("changePassword:", err);
    // bubble up; caller can handle "auth/requires-recent-login"
    throw err;
  }
}

// Lấy attendance của chính user
export async function getMyAttendance(uid, dateString) {
  try {
    const auth = getAuth();
    const currentUid = uid || (auth.currentUser && auth.currentUser.uid);
    if (!currentUid || !dateString)
      throw new Error("uid and dateString required");

    const sid = sanitizeId(currentUid);
    const did = sanitizeId(dateString);
    const attendanceRef = doc(db, `students/${sid}/attendance/${did}`);
    const snap = await getDoc(attendanceRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("getMyAttendance:", err);
    throw err;
  }
}

// Lấy tuition của chính user
export async function getMyTuition(uid, academicYear) {
  try {
    const auth = getAuth();
    const currentUid = uid || (auth.currentUser && auth.currentUser.uid);
    if (!currentUid || !academicYear)
      throw new Error("uid and academicYear required");

    const sid = sanitizeId(currentUid);
    const yid = sanitizeId(academicYear);
    const tuitionRef = doc(db, `students/${sid}/tuition/${yid}`);
    const snap = await getDoc(tuitionRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("getMyTuition:", err);
    throw err;
  }
}

const profileService = {
  getMyProfile,
  getMyParent,
  getMyClass,
  updateMyProfile,
  changePassword,
  getMyAttendance,
  getMyTuition,
};

export default profileService;
