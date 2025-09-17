import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Update teacher profile and keep users collection in sync.
 * Attempts to update the teacher document in `teachers/{teacherId}` and the
 * corresponding user document in `users/{uid}` (if uid available). This
 * function does best-effort: if one update fails it throws so caller can
 * handle rollback or retry.
 *
 * @param {string} teacherId - ID of the teacher document in `teachers`.
 * @param {object} profileData - Plain object with fields to update (name, email, phone, avatar, gradeLevel, subjects, qualifications, teachingExperience, gender, address, etc.)
 * @returns {Promise<void>}
 */
export const updateProfileForTeacher = async (teacherId, profileData) => {
  if (!teacherId) throw new Error("teacherId is required");

  const teacherRef = doc(db, "teachers", teacherId);

  // Prepare teacher update payload (only keys present)
  const teacherPayload = {};
  [
    "name",
    "avatar",
    "experience",
    "email",
    "phone",
    "gender",
    "facilityId",
    "subjectIds",
    "subjects",
    "gradeLevel",
    "teachingExperience",
    "qualifications",
    "address",
  ].forEach((key) => {
    if (profileData[key] !== undefined) teacherPayload[key] = profileData[key];
  });

  // Update teacher document
  await updateDoc(teacherRef, teacherPayload);

  // If profileData contains uid or we can read teacher document's uid, try to update users collection
  let uid = profileData.uid;
  if (!uid) {
    const teacherSnap = await getDoc(teacherRef);
    if (teacherSnap.exists()) {
      const t = teacherSnap.data();
      uid = t.uid || t.authUid || null;
    }
  }

  if (uid) {
    const userRef = doc(db, "users", uid);

    // Prepare users update payload mapping fields to your users document shape
    const userPayload = {};
    if (profileData.name !== undefined) userPayload.name = profileData.name;
    if (profileData.email !== undefined) userPayload.email = profileData.email;
    if (profileData.phone !== undefined) userPayload.phone = profileData.phone;
    if (profileData.avatar !== undefined)
      userPayload.avatar = profileData.avatar;
    if (profileData.gender !== undefined)
      userPayload.gender = profileData.gender;
    if (profileData.gradeLevel !== undefined)
      userPayload.gradeLevel = profileData.gradeLevel;
    if (profileData.qualifications !== undefined)
      userPayload.qualifications = profileData.qualifications;
    if (profileData.teachingExperience !== undefined)
      userPayload.teachingExperience = profileData.teachingExperience;

    // Only update if there is at least one key
    if (Object.keys(userPayload).length > 0) {
      await updateDoc(userRef, userPayload);
    }
  }
};

/**
 * Update avatar for a user (by auth UID). This will try to find the teacher
 * document that corresponds to the auth UID and update its `avatar` field.
 * It also updates the `users/{uid}` document. If the teacher document does
 * not exist, only the users doc will be updated.
 *
 * @param {string} uid - Firebase Auth UID of the user
 * @param {string} base64Avatar - Image encoded as base64 (data URL)
 */
export const updateAvatarForUid = async (uid, base64Avatar) => {
  if (!uid) throw new Error("uid required");

  // Update users document
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { avatar: base64Avatar });

  // Try to find teacher doc that has uid or authUid matching
  // Common patterns: teachers/{teacherId} has field `uid` or `authUid`.
  // We'll attempt to read teacher by using uid as doc id first, then read all teachers fallback.

  // 1) Try teacher doc with id == uid
  try {
    const teacherRefById = doc(db, "teachers", uid);
    const teacherSnapById = await getDoc(teacherRefById);
    if (teacherSnapById.exists()) {
      await updateDoc(teacherRefById, { avatar: base64Avatar });
      return;
    }
  } catch (err) {
    // ignore and continue
  }

  // 2) Scan teachers collection to find a doc with uid/authUid matching
  // continue to query by uid/authUid below

  // As a fallback, attempt a query by uid field
  try {
    // dynamic import to avoid adding new top imports at file top
    const { collection, query, where, getDocs } = await import(
      "firebase/firestore"
    );
    const teachersCollection = collection(db, "teachers");
    const q = query(teachersCollection, where("uid", "==", uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const teacherDoc = snap.docs[0];
      await updateDoc(teacherDoc.ref, { avatar: base64Avatar });
      return;
    }

    // try authUid
    const q2 = query(teachersCollection, where("authUid", "==", uid));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const teacherDoc = snap2.docs[0];
      await updateDoc(teacherDoc.ref, { avatar: base64Avatar });
      return;
    }
  } catch (err) {
    // ignore; update users doc already done
  }
};

/**
 * Update student profile and keep users collection in sync.
 * @param {string} studentId - ID of the student document in `students` collection
 * @param {object} profileData - fields to update (name, email, phone, classId, subjects, goalsWeekly, goalsMonthly, competency, avatar, address, etc.)
 */
export const updateProfileForStudent = async (studentId, profileData) => {
  if (!studentId) throw new Error("studentId is required");

  const studentRef = doc(db, "students", studentId);

  const payload = {};
  [
    "name",
    "email",
    "phone",
    "avatar",
    "classId",
    "subjects",
    "goalsWeekly",
    "goalsMonthly",
    "competency",
    "address",
  ].forEach((k) => {
    if (profileData[k] !== undefined) payload[k] = profileData[k];
  });

  await updateDoc(studentRef, payload);

  // find uid: prefer provided uid, otherwise read student doc
  let uid = profileData.uid;
  if (!uid) {
    const snap = await getDoc(studentRef);
    if (snap.exists()) {
      const s = snap.data();
      uid = s.uid || s.authUid || null;
    }
  }

  if (uid) {
    const userRef = doc(db, "users", uid);
    const userPayload = {};
    if (profileData.name !== undefined) userPayload.name = profileData.name;
    if (profileData.email !== undefined) userPayload.email = profileData.email;
    if (profileData.phone !== undefined) userPayload.phone = profileData.phone;
    if (profileData.avatar !== undefined)
      userPayload.avatar = profileData.avatar;
    if (profileData.classId !== undefined)
      userPayload.classId = profileData.classId;

    if (Object.keys(userPayload).length > 0) {
      await updateDoc(userRef, userPayload);
    }
  }
};

const profileTeacherService = {
  updateProfileForTeacher,
  updateAvatarForUid,
  updateProfileForStudent,
};

export default profileTeacherService;
