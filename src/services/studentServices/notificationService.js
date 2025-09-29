import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  onSnapshot,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const normalizeId = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  if (!str) return "";
  const pieces = str.split("/").filter(Boolean);
  return pieces.length ? pieces[pieces.length - 1] : str;
};

const buildClassCandidates = (classId) => {
  const cid = normalizeId(classId);
  if (!cid) return [];
  const candidates = new Set([
    cid,
    `/classes/${cid}`,
    `classes/${cid}`,
    `Class/${cid}`,
  ]);
  return Array.from(candidates);
};

/**
 * Lấy classId của học sinh
 * Ưu tiên doc students/{studentId}, fallback tìm lớp chứa học sinh trong mảng students
 */
export const getStudentClassId = async (studentId) => {
  if (!studentId) return null;

  // 1) đọc trực tiếp từ students
  try {
    const sSnap = await getDoc(doc(db, "students", studentId));
    if (sSnap.exists()) {
      const s = sSnap.data() || {};
      const byField =
        s.classId ||
        s.classID ||
        s.class_id ||
        s.class?.id ||
        s.class?.classId ||
        null;
      if (byField) return normalizeId(byField);
    }
  } catch (err) {
    console.error("getStudentClassId: error reading student doc", err);
  }

  // 2) fallback: tìm lớp có chứa học sinh trong mảng students
  try {
    const clsQ = query(
      collection(db, "classes"),
      where("students", "array-contains", studentId)
    );
    const clsSnap = await getDocs(clsQ);
    if (!clsSnap.empty) return normalizeId(clsSnap.docs[0].id);
  } catch (err) {
    console.error("getStudentClassId: error querying classes", err);
  }

  return null;
};

// lấy full class object cho studentId (id + data, attach homeRoomTeacher minimal nếu có)
export const getStudentClass = async (studentId) => {
  if (!studentId) return null;
  try {
    const classId = await getStudentClassId(studentId);
    if (!classId) return null;

    const cSnap = await getDoc(doc(db, "classes", classId));
    if (!cSnap.exists()) return null;
    const classData = { id: cSnap.id, ...(cSnap.data() || {}) };

    const homeTeacherIdRaw =
      classData.homeRoomTeacherId || classData.teacher || classData.teacherId;
    if (homeTeacherIdRaw) {
      const teacherId = normalizeId(homeTeacherIdRaw);
      try {
        const tSnap = await getDoc(doc(db, "teachers", teacherId));
        if (tSnap.exists()) {
          classData.homeRoomTeacher = { id: tSnap.id, ...(tSnap.data() || {}) };
        }
      } catch (err) {
        console.error("getStudentClass - teacher fetch:", err);
      }
    }

    return classData;
  } catch (err) {
    console.error("getStudentClass:", err);
    return null;
  }
};

// kiểm tra notification có dành cho lớp hiện tại của student hay không
export const isNotificationForStudent = async (
  notificationOrClassId,
  studentId
) => {
  if (!studentId || !notificationOrClassId) return false;

  const notifClassIdRaw =
    typeof notificationOrClassId === "string"
      ? notificationOrClassId
      : notificationOrClassId.classId || notificationOrClassId.class || null;
  if (!notifClassIdRaw) return false;

  const notifCandidates = buildClassCandidates(notifClassIdRaw);
  if (!notifCandidates.length) return false;

  const studentClassId = await getStudentClassId(studentId);
  if (!studentClassId) return false;

  return notifCandidates.some(
    (candidate) => normalizeId(candidate) === normalizeId(studentClassId)
  );
};

/**
 * Lấy danh sách thông báo theo classId (mới nhất trước)
 * options:
 *  - limit: số lượng tối đa (mặc định 50)
 *  - onlyUnreadFor: studentId để lọc chưa đọc (lọc phía client)
 */
export const getNotificationsByClassId = async (
  classId,
  options = { limit: 50, onlyUnreadFor: null }
) => {
  if (!classId) return [];
  const lim = Number(options?.limit || 50);
  const candidates = buildClassCandidates(classId);
  if (!candidates.length) return [];

  const results = new Map();

  for (const candidate of candidates) {
    try {
      const qx = query(
        collection(db, "notifications"),
        where("classId", "==", candidate),
        orderBy("createdAt", "desc"),
        fsLimit(lim)
      );
      const snap = await getDocs(qx);
      snap.forEach((d) => {
        const data = d.data() || {};
        results.set(d.id, {
          id: d.id,
          ...data,
          createdAt: data.createdAt || null,
          readBy: Array.isArray(data.readBy) ? data.readBy : [],
        });
      });
    } catch (err) {
      console.error("getNotificationsByClassId query error:", candidate, err);
    }
  }

  let items = Array.from(results.values());

  items.sort((a, b) => {
    const ta =
      a.createdAt?.toMillis?.() ?? new Date(a.createdAt || 0).getTime() ?? 0;
    const tb =
      b.createdAt?.toMillis?.() ?? new Date(b.createdAt || 0).getTime() ?? 0;
    return tb - ta;
  });

  const onlyUnreadFor = options?.onlyUnreadFor;
  if (onlyUnreadFor) {
    items = items.filter((n) => !n.readBy?.includes(String(onlyUnreadFor)));
  }

  return items.slice(0, lim);
};

/**
 * Lấy danh sách thông báo cho học sinh:
 * 1. Xác định lớp hiện tại của student.
 * 2. Truy vấn notifications có classId khớp (kể cả id/path).
 * 3. Trả về danh sách đã sắp xếp.
 */
export const getNotificationsForStudent = async (
  studentId,
  options = { limit: 50, onlyUnread: false }
) => {
  if (!studentId) return [];
  const classId = await getStudentClassId(studentId);
  if (!classId) return [];

  return await getNotificationsByClassId(classId, {
    limit: options.limit || 50,
    onlyUnreadFor: options.onlyUnread ? studentId : null,
  });
};

// realtime subscription giữ nguyên hành vi (theo id chuẩn)
export const subscribeClassNotifications = (
  classId,
  callback,
  options = { limit: 50, onlyUnreadFor: null }
) => {
  const cid = normalizeId(classId);
  if (!cid || typeof callback !== "function") return () => {};

  const lim = Number(options?.limit || 50);
  const qx = query(
    collection(db, "notifications"),
    where("classId", "==", cid),
    orderBy("createdAt", "desc"),
    fsLimit(lim)
  );

  return onSnapshot(
    qx,
    (snap) => {
      let items = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt || null,
          readBy: Array.isArray(data.readBy) ? data.readBy : [],
        };
      });

      const onlyUnreadFor = options?.onlyUnreadFor;
      if (onlyUnreadFor) {
        items = items.filter((n) => !n.readBy?.includes(String(onlyUnreadFor)));
      }

      callback(items);
    },
    (err) => {
      console.error("subscribeClassNotifications error:", err);
      callback([]);
    }
  );
};

/**
 * Đánh dấu đã đọc thông báo cho học sinh
 */
export const markNotificationRead = async (notificationId, studentId) => {
  if (!notificationId || !studentId) return false;
  try {
    const ref = doc(db, "notifications", notificationId);
    await updateDoc(ref, {
      readBy: arrayUnion(String(studentId)),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return false;
  }
};

/**
 * Tạo thông báo cho 1 lớp (dùng cho giáo viên/quản trị)
 */
export const createClassNotification = async ({
  classId,
  title,
  content,
  senderId,
  type = "normal",
  extra = {},
}) => {
  if (!classId || !title || !content) {
    throw new Error("classId, title, content là bắt buộc");
  }
  const cid = normalizeId(classId);
  const docRef = await addDoc(collection(db, "notifications"), {
    classId: cid,
    title,
    content,
    type,
    senderId: senderId || null,
    className: extra.className || null,
    recipients: extra.recipients || null,
    readBy: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

const senderNameCache = new Map();

export const getNotificationSenderName = async (senderId) => {
  if (!senderId) return "";
  const key = String(senderId);
  if (senderNameCache.has(key)) return senderNameCache.get(key);

  const collections = ["teachers", "users", "staffs", "admins"];
  for (const col of collections) {
    try {
      const snap = await getDoc(doc(db, col, key));
      if (snap.exists()) {
        const data = snap.data() || {};
        const name =
          data.name ||
          data.fullName ||
          (data.firstName && data.lastName
            ? `${data.firstName} ${data.lastName}`
            : null) ||
          data.displayName ||
          key;
        senderNameCache.set(key, name);
        return name;
      }
    } catch (err) {
      console.error(`getNotificationSenderName: ${col}`, err);
    }
  }

  senderNameCache.set(key, key);
  return key;
};
