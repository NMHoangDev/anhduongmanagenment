import { db } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
export const getTeacherHomeRoomClasses = async (teacherId) => {
  try {
    const ref = collection(db, "classes");
    const q = query(ref, where("homeRoomTeacherId", "==", teacherId));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Lỗi lấy lớp chủ nhiệm:", error);
    throw error;
  }
};

/**
 * Gửi thông báo tới lớp học (chỉ GVCN của lớp được gửi)
 * @param {string} teacherId - ID giáo viên gửi thông báo (dùng để kiểm tra quyền)
 * @param {string} classId - ID lớp học
 * @param {object} notification - { title, content, senderId, [recipients], [type] }
 * @returns {Promise<string>} - ID của thông báo vừa tạo
 */
export const sendClassNotification = async (
  teacherId,
  classId,
  notification
) => {
  // Kiểm tra class tồn tại và teacherId là chủ nhiệm
  const classRef = doc(db, "classes", classId);
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) {
    throw new Error("Không tìm thấy lớp học");
  }

  const classData = classSnap.data();
  if (classData.homeRoomTeacherId !== teacherId) {
    throw new Error(
      "Chỉ giáo viên chủ nhiệm của lớp mới được gửi thông báo cho lớp này"
    );
  }

  const ref = collection(db, "notifications");
  const docRef = await addDoc(ref, {
    ...notification,
    classId,
    className: classData.name || null,
    createdAt: serverTimestamp(),
    type: notification.type || "class",
    recipients: notification.recipients || [],
    readBy: [],
    senderId: notification.senderId || teacherId,
  });
  return docRef.id;
};

/**
 * Gửi tin nhắn cho học sinh do giáo viên chủ nhiệm
 * @param {string} studentId - ID học sinh
 * @param {object} message - { content, senderId, [attachments] }
 * @returns {Promise<string>} - ID của tin nhắn vừa tạo
 */
export const sendMessageToStudent = async (studentId, message) => {
  const ref = collection(db, "students", studentId, "messages");
  const docRef = await addDoc(ref, {
    ...message,
    createdAt: serverTimestamp(),
    read: false,
  });
  return docRef.id;
};

/**
 * Gửi nhắc nhở tới lớp học
 * @param {string} classId - ID lớp học
 * @param {object} reminder - { title, content, senderId, [dueDate] }
 * @returns {Promise<string>} - ID của nhắc nhở vừa tạo
 */
export const sendClassReminder = async (classId, reminder) => {
  const ref = collection(db, "reminders");
  const docRef = await addDoc(ref, {
    ...reminder,
    classId,
    createdAt: serverTimestamp(),
    type: "reminder",
  });
  return docRef.id;
};

/**
 * Gửi khen thưởng cho học sinh
 * @param {string} studentId - ID học sinh
 * @param {object} reward - { title, content, senderId, [badgeId], [note] }
 * @returns {Promise<string>} - ID của khen thưởng vừa tạo
 */
export const sendStudentReward = async (studentId, reward) => {
  const ref = collection(db, "students", studentId, "rewards");
  const docRef = await addDoc(ref, {
    ...reward,
    createdAt: serverTimestamp(),
    type: "reward",
  });
  return docRef.id;
};

/**
 * Lấy danh sách thông báo của lớp
 * @param {string} classId
 * @returns {Promise<Array>}
 */
export const getClassNotifications = async (classId) => {
  const ref = collection(db, "notifications");
  const q = query(ref, where("classId", "==", classId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Lấy danh sách nhắc nhở của lớp
 * @param {string} classId
 * @returns {Promise<Array>}
 */
export const getClassReminders = async (classId) => {
  const ref = collection(db, "reminders");
  const q = query(ref, where("classId", "==", classId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Lấy danh sách khen thưởng của học sinh
 * @param {string} studentId
 * @returns {Promise<Array>}
 */
export const getStudentRewards = async (studentId) => {
  const ref = collection(db, "students", studentId, "rewards");
  const snap = await getDocs(ref);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
