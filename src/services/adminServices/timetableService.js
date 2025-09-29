import {
  doc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * TimetableService V2 - Cấu trúc mới tối ưu cho CRUD và truy xuất
 *
 * Cấu trúc Firestore mới:
 *
 * Collection: timetable_sessions
 * Document ID: auto-generated
 * {
 *   id: "auto-generated-id",
 *   classId: "class_001",
 *   weekId: "2024-W32",
 *   date: "2024-08-05", // YYYY-MM-DD format
 *   dayOfWeek: "monday", // monday, tuesday, etc.
 *   timeSlot: 1, // 1-10
 *   startTime: "07:00",
 *   endTime: "07:45",
 *   subject: "Toán",
 *   teacherId: "teacher_001",
 *   room: "A101",
 *   note: "",
 *   status: "active", // active, cancelled, completed
 *   createdAt: "2024-08-05T10:00:00.000Z",
 *   updatedAt: "2024-08-05T10:00:00.000Z"
 * }
 *
 * Ưu điểm:
 * 1. Dễ truy vấn theo teacherId, date để điểm danh
 * 2. Mỗi tiết học là 1 document riêng biệt - dễ CRUD
 * 3. Có thể query nhanh theo nhiều tiêu chí
 * 4. Không cần composite index phức tạp
 */

// Định nghĩa các tiết học trong ngày
const TIME_SLOTS = [
  { id: 1, label: "Tiết 1", startTime: "07:00", endTime: "07:45" },
  { id: 2, label: "Tiết 2", startTime: "07:45", endTime: "08:30" },
  { id: 3, label: "Tiết 3", startTime: "08:45", endTime: "09:30" },
  { id: 4, label: "Tiết 4", startTime: "09:30", endTime: "10:15" },
  { id: 5, label: "Tiết 5", startTime: "10:30", endTime: "11:15" },
  { id: 6, label: "Tiết 6", startTime: "11:15", endTime: "12:00" },
  { id: 7, label: "Tiết 7", startTime: "13:00", endTime: "13:45" },
  { id: 8, label: "Tiết 8", startTime: "13:45", endTime: "14:30" },
  { id: 9, label: "Tiết 9", startTime: "14:45", endTime: "15:30" },
  { id: 10, label: "Tiết 10", startTime: "15:30", endTime: "16:15" },
];

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// Helper functions
export const getTimeSlotById = (timeSlotId) => {
  return TIME_SLOTS.find((slot) => slot.id === timeSlotId);
};

export const getWeekId = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
  return `${year}-W${week.toString().padStart(2, "0")}`;
};

export const getDateFromWeekAndDay = (weekId, dayOfWeek) => {
  // Parse weekId (e.g., "2024-W32")
  const [year, weekNum] = weekId.split("-W");
  const week = parseInt(weekNum);

  // Get first day of year
  const firstDay = new Date(parseInt(year), 0, 1);

  // Calculate the date of Monday of the target week
  const daysToAdd = (week - 1) * 7 - firstDay.getDay() + 1;
  const mondayDate = new Date(
    firstDay.getTime() + daysToAdd * 24 * 60 * 60 * 1000
  );

  // Add days based on dayOfWeek
  const dayIndex = DAYS_OF_WEEK.indexOf(dayOfWeek);
  const targetDate = new Date(
    mondayDate.getTime() + dayIndex * 24 * 60 * 60 * 1000
  );

  return targetDate.toISOString().split("T")[0]; // Return YYYY-MM-DD format
};

export const getWeekDisplayString = (date) => {
  const d = new Date(date);
  const weekId = getWeekId(d);

  // Get Monday of this week
  const monday = new Date(d);
  monday.setDate(d.getDate() - d.getDay() + 1);

  // Get Sunday of this week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    weekId,
    display: `Tuần ${weekId.split("-W")[1]} (${formatDate(
      monday
    )} - ${formatDate(sunday)})`,
    startDate: monday.toISOString().split("T")[0],
    endDate: sunday.toISOString().split("T")[0],
  };
};

// Hàm tạo chuỗi ISO theo giờ Việt Nam (GMT+7)
const getVietnamISOString = () => {
  const now = new Date();
  now.setHours(now.getHours() + 7);
  return now.toISOString();
};

// Lấy ngày theo GMT+7, trả về "YYYY-MM-DD"
const getVietnamDateString = (dateString) => {
  const date = new Date(dateString + "T00:00:00+07:00");
  // Đảm bảo luôn lấy ngày theo múi giờ Việt Nam
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Tạo một tiết học mới
 */
export const createTimetableSession = async (sessionData) => {
  try {
    const timeSlot = getTimeSlotById(sessionData.timeSlot);
    // Lấy ngày chuẩn theo tuần và thứ
    // const rawDate = getDateFromWeekAndDay(
    //   sessionData.weekId,
    //   sessionData.dayOfWeek
    // );
    // Chuyển ngày về đúng GMT+7
    // const date = getVietnamDateString(rawDate);

    const newSession = {
      classId: sessionData.classId,
      weekId: sessionData.weekId,
      date: sessionData.date, // Đã chuẩn GMT+7
      dayOfWeek: sessionData.dayOfWeek,
      timeSlot: sessionData.timeSlot,
      startTime: timeSlot?.startTime || "",
      endTime: timeSlot?.endTime || "",
      subject: sessionData.subject || "",
      teacherId: sessionData.teacherId || "",
      room: sessionData.room || "",
      note: sessionData.note || "",
      status: "active",
      createdAt: getVietnamISOString(), // Sử dụng giờ Việt Nam
      updatedAt: getVietnamISOString(), // Sử dụng giờ Việt Nam
    };

    console.log("🔥 Creating new timetable session:", newSession);

    const docRef = await addDoc(
      collection(db, "timetable_sessions"),
      newSession
    );

    console.log("✅ Timetable session created with ID:", docRef.id);

    return {
      id: docRef.id,
      ...newSession,
    };
  } catch (error) {
    console.error("❌ Error creating timetable session:", error);
    throw error;
  }
};

/**
 * Cập nhật một tiết học
 */
export const updateTimetableSession = async (sessionId, sessionData) => {
  try {
    const timeSlot = getTimeSlotById(sessionData.timeSlot);
    const date = getDateFromWeekAndDay(
      sessionData.weekId,
      sessionData.dayOfWeek
    );

    const updatedSession = {
      classId: sessionData.classId,
      weekId: sessionData.weekId,
      date: date,
      dayOfWeek: sessionData.dayOfWeek,
      timeSlot: sessionData.timeSlot,
      startTime: timeSlot?.startTime || "",
      endTime: timeSlot?.endTime || "",
      subject: sessionData.subject || "",
      teacherId: sessionData.teacherId || "",
      room: sessionData.room || "",
      note: sessionData.note || "",
      status: sessionData.status || "active",
      updatedAt: getVietnamISOString(), // Sử dụng giờ Việt Nam
    };

    console.log("🔥 Updating timetable session:", sessionId, updatedSession);

    const sessionRef = doc(db, "timetable_sessions", sessionId);
    await updateDoc(sessionRef, updatedSession);

    console.log("✅ Timetable session updated:", sessionId);

    return {
      id: sessionId,
      ...updatedSession,
    };
  } catch (error) {
    console.error("❌ Error updating timetable session:", error);
    throw error;
  }
};

/**
 * Xóa một tiết học
 */
export const deleteTimetableSession = async (sessionId) => {
  try {
    console.log("🔥 Deleting timetable session:", sessionId);

    const sessionRef = doc(db, "timetable_sessions", sessionId);
    await deleteDoc(sessionRef);

    console.log("✅ Timetable session deleted:", sessionId);

    return true;
  } catch (error) {
    console.error("❌ Error deleting timetable session:", error);
    throw error;
  }
};

/**
 * Lấy thời khóa biểu của một lớp trong tuần
 */
export const getTimetableByClassAndWeek = async (classId, weekId) => {
  try {
    console.log("🔍 Getting timetable for class and week:", {
      classId,
      weekId,
    });

    const q = query(
      collection(db, "timetable_sessions"),
      where("classId", "==", classId),
      where("weekId", "==", weekId),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Organize sessions by day and sort by timeSlot
    const schedule = {};
    DAYS_OF_WEEK.forEach((day) => {
      schedule[day] = sessions
        .filter((session) => session.dayOfWeek === day)
        .sort((a, b) => a.timeSlot - b.timeSlot);
    });

    console.log("✅ Timetable retrieved:", {
      classId,
      weekId,
      sessionsCount: sessions.length,
    });

    return { schedule };
  } catch (error) {
    console.error("❌ Error getting timetable:", error);
    throw error;
  }
};

/**
 * Lấy tất cả thời khóa biểu của tuần
 */
export const getAllTimetablesByWeek = async (weekId) => {
  try {
    console.log("🔍 Getting all timetables for week:", weekId);

    const q = query(
      collection(db, "timetable_sessions"),
      where("weekId", "==", weekId),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Group by classId
    const timetables = {};
    sessions.forEach((session) => {
      if (!timetables[session.classId]) {
        timetables[session.classId] = {};
        DAYS_OF_WEEK.forEach((day) => {
          timetables[session.classId][day] = [];
        });
      }

      timetables[session.classId][session.dayOfWeek].push(session);
    });

    // Sort sessions within each day
    Object.keys(timetables).forEach((classId) => {
      DAYS_OF_WEEK.forEach((day) => {
        timetables[classId][day].sort((a, b) => a.timeSlot - b.timeSlot);
      });
    });

    console.log("✅ All timetables retrieved:", {
      weekId,
      classesCount: Object.keys(timetables).length,
    });

    return timetables;
  } catch (error) {
    console.error("❌ Error getting all timetables:", error);
    throw error;
  }
};

/**
 * Lấy lịch dạy của giáo viên trong ngày - Tối ưu cho điểm danh
 */
export const getTeacherScheduleByDate = async (teacherId, date) => {
  try {
    console.log("🔍 Getting teacher schedule by date:", { teacherId, date });

    // Thử query không có status filter trước
    const q = query(
      collection(db, "timetable_sessions"),
      where("teacherId", "==", teacherId),
      where("date", "==", date)
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Chỉ lấy sessions active hoặc không có status (tương thích với data cũ)
      if (!data.status || data.status === "active") {
        sessions.push({
          id: doc.id,
          ...data,
        });
      }
    });

    // Sort by timeSlot
    sessions.sort((a, b) => a.timeSlot - b.timeSlot);

    console.log("✅ Teacher schedule retrieved:", {
      teacherId,
      date,
      sessionsCount: sessions.length,
      sessions,
    });

    return sessions;
  } catch (error) {
    console.error("❌ Error getting teacher schedule:", error);
    throw error;
  }
};

/**
 * Lấy lịch dạy của giáo viên trong khoảng thời gian
 */
export const getTeacherScheduleByDateRange = async (
  teacherId,
  startDate,
  endDate
) => {
  try {
    console.log("🔍 Getting teacher schedule by date range:", {
      teacherId,
      startDate,
      endDate,
    });

    const q = query(
      collection(db, "timetable_sessions"),
      where("teacherId", "==", teacherId),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort by date and timeSlot
    sessions.sort((a, b) => {
      if (a.date === b.date) {
        return a.timeSlot - b.timeSlot;
      }
      return new Date(a.date) - new Date(b.date);
    });

    console.log("✅ Teacher schedule range retrieved:", {
      teacherId,
      startDate,
      endDate,
      sessionsCount: sessions.length,
    });

    return sessions;
  } catch (error) {
    console.error("❌ Error getting teacher schedule range:", error);
    throw error;
  }
};

/**
 * Xóa tất cả tiết học của một lớp trong tuần
 */
export const clearTimetableForClass = async (classId, weekId) => {
  try {
    console.log("🔥 Clearing timetable for class:", { classId, weekId });

    const q = query(
      collection(db, "timetable_sessions"),
      where("classId", "==", classId),
      where("weekId", "==", weekId)
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = [];

    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);

    console.log("✅ Timetable cleared for class:", {
      classId,
      weekId,
      deletedCount: deletePromises.length,
    });

    return true;
  } catch (error) {
    console.error("❌ Error clearing timetable:", error);
    throw error;
  }
};

/**
 * Sao chép thời khóa biểu từ tuần này sang tuần khác
 */
export const copyTimetableToWeek = async (
  fromClassId,
  fromWeekId,
  toClassId,
  toWeekId
) => {
  try {
    console.log("🔥 Copying timetable:", {
      fromClassId,
      fromWeekId,
      toClassId,
      toWeekId,
    });

    // Get source sessions
    const sourceQ = query(
      collection(db, "timetable_sessions"),
      where("classId", "==", fromClassId),
      where("weekId", "==", fromWeekId),
      where("status", "==", "active")
    );

    const sourceSnapshot = await getDocs(sourceQ);
    const copyPromises = [];

    sourceSnapshot.forEach((doc) => {
      const sourceData = doc.data();
      const newDate = getDateFromWeekAndDay(toWeekId, sourceData.dayOfWeek);

      const newSession = {
        ...sourceData,
        classId: toClassId,
        weekId: toWeekId,
        date: newDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      copyPromises.push(
        addDoc(collection(db, "timetable_sessions"), newSession)
      );
    });

    await Promise.all(copyPromises);

    console.log("✅ Timetable copied:", {
      fromClassId,
      fromWeekId,
      toClassId,
      toWeekId,
      copiedCount: copyPromises.length,
    });

    return true;
  } catch (error) {
    console.error("❌ Error copying timetable:", error);
    throw error;
  }
};

/**
 * Kiểm tra xung đột thời khóa biểu
 */
export const checkTimetableConflicts = async (weekId) => {
  try {
    console.log("🔍 Checking timetable conflicts for week:", weekId);

    const q = query(
      collection(db, "timetable_sessions"),
      where("weekId", "==", weekId),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    const conflicts = [];

    // Check for teacher conflicts (same teacher, same time, same day)
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        const session1 = sessions[i];
        const session2 = sessions[j];

        if (
          session1.teacherId === session2.teacherId &&
          session1.date === session2.date &&
          session1.timeSlot === session2.timeSlot &&
          session1.teacherId // Only check if teacherId exists
        ) {
          conflicts.push({
            type: "teacher_conflict",
            teacherId: session1.teacherId,
            date: session1.date,
            timeSlot: session1.timeSlot,
            sessions: [session1, session2],
          });
        }
      }
    }

    console.log("✅ Conflicts checked:", {
      weekId,
      conflictsCount: conflicts.length,
    });

    return conflicts;
  } catch (error) {
    console.error("❌ Error checking conflicts:", error);
    throw error;
  }
};

// Export tất cả functions cần thiết cho compatibility
export { TIME_SLOTS as timeSlots, DAYS_OF_WEEK as days };
