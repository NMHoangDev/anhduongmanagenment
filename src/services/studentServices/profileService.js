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
const usersCol = collection(db, "users");
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

// Trả về profile của user hiện đang đăng nhập (hoặc id truyền vào)
// includes related parent, class and homeRoomTeacher (minimal) info when available
export async function getMyProfile(id) {
  try {
    const auth = getAuth();
    const currentUid = id || (auth.currentUser && auth.currentUser.id);
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

// Cập nhật thông tin profile đồng bộ giữa users và students collection
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

    // Thêm timestamp cập nhật
    payload.lastUpdated = new Date();

    // Cập nhật students collection
    const studentsRef = doc(studentsCol, sid);
    await updateDoc(studentsRef, payload);

    // Chuẩn bị payload cho users collection (chỉ các trường chung)
    const usersPayload = {};
    const commonFields = [
      "name",
      "email",
      "gender",
      "dob",
      "contact",
      "avatar",
      "lastUpdated",
    ];

    Object.keys(payload).forEach((key) => {
      if (commonFields.includes(key)) {
        usersPayload[key] = payload[key];
      }
    });

    // Cập nhật users collection nếu có dữ liệu chung
    if (Object.keys(usersPayload).length > 0) {
      const usersRef = doc(usersCol, sid);
      try {
        await updateDoc(usersRef, usersPayload);
      } catch (err) {
        console.warn("Failed to update users collection:", err);
        // Không throw error vì students đã cập nhật thành công
      }
    }

    return { id: sid, ...payload };
  } catch (err) {
    console.error("updateMyProfile:", err);
    throw err;
  }
}

// Cập nhật thông tin cơ bản (tên, email, giới tính, ngày sinh, liên hệ)
export async function updateBasicInfo(uid, basicInfo = {}) {
  const allowedFields = ["name", "email", "gender", "dob", "contact"];
  const filteredInfo = Object.keys(basicInfo).reduce((acc, key) => {
    if (allowedFields.includes(key) && basicInfo[key] !== undefined) {
      acc[key] = basicInfo[key];
    }
    return acc;
  }, {});

  if (Object.keys(filteredInfo).length === 0) {
    throw new Error("No valid basic info fields to update");
  }

  return await updateMyProfile(uid, filteredInfo);
}

// Cập nhật avatar
export async function updateAvatar(uid, avatarUrl) {
  if (!avatarUrl) {
    throw new Error("Avatar URL is required");
  }

  return await updateMyProfile(uid, { avatar: avatarUrl });
}

// Cập nhật thông tin liên hệ
export async function updateContactInfo(uid, contactInfo = {}) {
  const allowedFields = ["contact"];
  const filteredInfo = Object.keys(contactInfo).reduce((acc, key) => {
    if (allowedFields.includes(key) && contactInfo[key] !== undefined) {
      acc[key] = contactInfo[key];
    }
    return acc;
  }, {});

  if (Object.keys(filteredInfo).length === 0) {
    throw new Error("No valid contact info fields to update");
  }

  return await updateMyProfile(uid, filteredInfo);
}

// Cập nhật trạng thái hoạt động
export async function updateActiveStatus(uid, isActive) {
  if (typeof isActive !== "boolean") {
    throw new Error("isActive must be a boolean value");
  }

  try {
    const auth = getAuth();
    const currentUid = uid || (auth.currentUser && auth.currentUser.uid);
    if (!currentUid) throw new Error("No authenticated user or uid provided");

    const sid = sanitizeId(currentUid);
    const timestamp = new Date();

    // Cập nhật students collection
    const studentsRef = doc(studentsCol, sid);
    await updateDoc(studentsRef, {
      isActive,
      lastUpdated: timestamp,
    });

    // Cập nhật users collection
    const usersRef = doc(usersCol, sid);
    try {
      await updateDoc(usersRef, {
        isActive,
        lastUpdated: timestamp,
      });
    } catch (err) {
      console.warn("Failed to update active status in users collection:", err);
    }

    return { isActive, lastUpdated: timestamp };
  } catch (err) {
    console.error("updateActiveStatus:", err);
    throw err;
  }
}

// Đồng bộ dữ liệu từ students sang users collection
export async function syncStudentToUser(uid) {
  try {
    const auth = getAuth();
    const currentUid = uid || (auth.currentUser && auth.currentUser.uid);
    if (!currentUid) throw new Error("No authenticated user or uid provided");

    const sid = sanitizeId(currentUid);

    // Lấy dữ liệu từ students collection
    const studentSnap = await getDoc(doc(studentsCol, sid));
    if (!studentSnap.exists()) {
      throw new Error("Student profile not found");
    }

    const studentData = studentSnap.data();

    // Chuẩn bị dữ liệu cho users collection
    const usersData = {
      uid: studentData.uid || studentData.authUid || sid,
      email: studentData.email,
      name: studentData.name,
      role: "student",
      isActive: studentData.isActive !== false,
      createdAt: studentData.createdAt || new Date(),
      lastUpdated: new Date(),
      sessionExpiry: studentData.sessionExpiry,
      sessionToken: studentData.sessionToken,
      password: studentData.password,
    };

    // Thêm các trường tùy chọn nếu có
    if (studentData.gender) usersData.gender = studentData.gender;
    if (studentData.dob) usersData.dob = studentData.dob;
    if (studentData.contact) usersData.contact = studentData.contact;
    if (studentData.avatar) usersData.avatar = studentData.avatar;

    // Cập nhật hoặc tạo mới trong users collection
    const usersRef = doc(usersCol, sid);
    await updateDoc(usersRef, usersData);

    return usersData;
  } catch (err) {
    console.error("syncStudentToUser:", err);
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

    // Cập nhật password trong cả 2 collection
    const uid = user.uid;
    const sid = sanitizeId(uid);
    const timestamp = new Date();

    try {
      // Cập nhật students collection
      await updateDoc(doc(studentsCol, sid), {
        password: newPassword,
        lastUpdated: timestamp,
      });

      // Cập nhật users collection
      await updateDoc(doc(usersCol, sid), {
        password: newPassword,
        lastUpdated: timestamp,
      });
    } catch (err) {
      console.warn("Failed to update password in Firestore:", err);
    }

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
  updateBasicInfo,
  updateAvatar,
  updateContactInfo,
  updateActiveStatus,
  syncStudentToUser,
  changePassword,
  getMyAttendance,
  getMyTuition,
};

export default profileService;
