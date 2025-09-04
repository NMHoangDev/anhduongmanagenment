import {
  doc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import * as timetableService from "./timetableService";
import { calculateDateFromWeekAndDay } from "../utils/dateUtils";

/**
 * FIX: Sửa tất cả ngày trong timetable_sessions để khớp với weekId và dayOfWeek
 */
export const fixTimetableDates = async () => {
  try {
    console.log("🔧 Starting timetable dates fix...");

    // 1. Lấy tất cả timetable sessions
    const timetableQuery = query(collection(db, "timetable_sessions"));
    const timetableSnapshot = await getDocs(timetableQuery);

    const sessionsToFix = [];
    const correctSessions = [];

    timetableSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const { weekId, dayOfWeek, date: currentDate } = data;

      if (weekId && dayOfWeek) {
        // Tính ngày đúng dựa trên weekId và dayOfWeek
        const correctDate = calculateDateFromWeekAndDay(weekId, dayOfWeek);

        if (currentDate !== correctDate) {
          sessionsToFix.push({
            id: doc.id,
            currentDate,
            correctDate,
            weekId,
            dayOfWeek,
            subject: data.subject,
            timeSlot: data.timeSlot,
            teacherId: data.teacherId,
            data,
          });
        } else {
          correctSessions.push({
            id: doc.id,
            date: currentDate,
            weekId,
            dayOfWeek,
          });
        }
      }
    });

    console.log("📊 Fix analysis:", {
      totalSessions: timetableSnapshot.size,
      sessionsToFix: sessionsToFix.length,
      correctSessions: correctSessions.length,
    });

    console.log("🔧 Sessions that need fixing:", sessionsToFix);

    // 2. Fix từng session
    const fixPromises = sessionsToFix.map((session) =>
      updateDoc(doc(db, "timetable_sessions", session.id), {
        date: session.correctDate,
        updatedAt: new Date().toISOString(),
      })
        .then(() => {
          console.log(
            `✅ Fixed session ${session.id}: ${session.currentDate} → ${session.correctDate}`
          );
          return { success: true, sessionId: session.id };
        })
        .catch((error) => {
          console.error(`❌ Failed to fix session ${session.id}:`, error);
          return { success: false, sessionId: session.id, error };
        })
    );

    // Chờ tất cả updates hoàn thành
    const results = await Promise.allSettled(fixPromises);
    const successfulFixes = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;

    console.log("🎉 Timetable dates fix completed:", {
      totalFixed: successfulFixes,
      totalSessions: timetableSnapshot.size,
    });

    return {
      success: true,
      totalSessions: timetableSnapshot.size,
      sessionsFixed: successfulFixes,
      correctSessions: correctSessions.length,
      fixedSessions: sessionsToFix,
    };
  } catch (error) {
    console.error("❌ Error fixing timetable dates:", error);
    throw error;
  }
};

/**
 * UTILITY: Tạo timetable session với ngày chính xác
 * @param {Object} sessionData - Dữ liệu session
 * @returns {Object} - Session data với ngày đã được tính toán chính xác
 */
export const createTimetableSessionWithCorrectDate = (sessionData) => {
  try {
    const { weekId, dayOfWeek } = sessionData;

    if (!weekId || !dayOfWeek) {
      throw new Error("weekId và dayOfWeek là bắt buộc");
    }

    // Tính ngày chính xác
    const correctDate = calculateDateFromWeekAndDay(weekId, dayOfWeek);

    // Tạo session data với ngày đúng
    const correctedSessionData = {
      ...sessionData,
      date: correctDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("📅 Created session with correct date:", {
      weekId,
      dayOfWeek,
      calculatedDate: correctDate,
      subject: sessionData.subject,
      timeSlot: sessionData.timeSlot,
    });

    return correctedSessionData;
  } catch (error) {
    console.error("❌ Error creating session with correct date:", error);
    throw error;
  }
};

/**
 * Service quản lý điểm danh cho học sinh và giáo viên
 */

// ==================== STUDENT ATTENDANCE ====================

/**
 * Điểm danh học sinh
 * @param {string} studentId - ID của học sinh
 * @param {string} classId - ID của lớp
 * @param {string} teacherId - ID của giáo viên điểm danh
 * @param {string} status - Trạng thái: 'present', 'absent', 'late', 'excused'
 * @param {string} note - Ghi chú (optional)
 */
export const markStudentAttendance = async (
  studentId,
  classId,
  teacherId,
  status,
  note = ""
) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const attendanceId = `${studentId}_${dateString}`;

    const attendanceData = {
      studentId,
      classId,
      teacherId,
      date: dateString,
      timestamp: Timestamp.now(),
      status, // 'present', 'absent', 'late', 'excused'
      note,
      markedBy: teacherId,
      markedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, "student_attendance", attendanceId), attendanceData);

    console.log("✅ Điểm danh học sinh thành công:", {
      studentId,
      status,
      date: dateString,
    });

    return {
      success: true,
      attendanceId,
      data: attendanceData,
    };
  } catch (error) {
    console.error("❌ Lỗi điểm danh học sinh:", error);
    throw error;
  }
};

/**
 * Lấy điểm danh học sinh theo ngày
 * @param {string} classId - ID của lớp
 * @param {string} date - Ngày (YYYY-MM-DD)
 */
export const getStudentAttendanceByDate = async (classId, date) => {
  try {
    const q = query(
      collection(db, "student_attendance"),
      where("classId", "==", classId),
      where("date", "==", date)
    );

    const querySnapshot = await getDocs(q);
    const attendanceList = [];

    querySnapshot.forEach((doc) => {
      attendanceList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return attendanceList;
  } catch (error) {
    console.error("❌ Lỗi lấy điểm danh học sinh:", error);
    throw error;
  }
};

/**
 * Lấy thống kê điểm danh học sinh
 * @param {string} studentId - ID học sinh
 * @param {string} startDate - Ngày bắt đầu
 * @param {string} endDate - Ngày kết thúc
 */
export const getStudentAttendanceStats = async (
  studentId,
  startDate,
  endDate
) => {
  try {
    const q = query(
      collection(db, "student_attendance"),
      where("studentId", "==", studentId),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );

    const querySnapshot = await getDocs(q);
    const attendanceRecords = [];
    const stats = {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendanceRate: 0,
    };

    querySnapshot.forEach((doc) => {
      const record = doc.data();
      attendanceRecords.push({
        id: doc.id,
        ...record,
      });

      stats.total++;
      stats[record.status]++;
    });

    // Sắp xếp records theo ngày giảm dần
    attendanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Tính tỷ lệ đi học
    if (stats.total > 0) {
      stats.attendanceRate = (
        ((stats.present + stats.late) / stats.total) *
        100
      ).toFixed(2);
    }

    return {
      records: attendanceRecords,
      stats,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy thống kê điểm danh học sinh:", error);
    throw error;
  }
};

// ==================== TEACHER ATTENDANCE ====================

/**
 * Điểm danh giáo viên cho giờ dạy
 * @param {string} teacherId - ID của giáo viên
 * @param {string} classId - ID của lớp
 * @param {string} subject - Môn học
 * @param {string} timeSlot - Tiết học (VD: "Tiết 1", "Tiết 2")
 * @param {string} status - Trạng thái: 'present', 'absent', 'late', 'substitute'
 * @param {string} note - Ghi chú
 */
export const markTeacherAttendance = async (
  teacherId,
  classId,
  subject,
  timeSlot,
  status,
  note = ""
) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const timestamp = Timestamp.now();

    const attendanceId = `${teacherId}_${classId}_${dateString}_${timeSlot}`;

    const attendanceData = {
      teacherId,
      classId,
      subject,
      timeSlot,
      date: dateString,
      timestamp,
      status, // 'present', 'absent', 'late', 'substitute'
      note,
      clockInTime: status === "present" || status === "late" ? timestamp : null,
      markedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDoc(doc(db, "teacher_attendance", attendanceId), attendanceData);

    console.log("✅ Điểm danh giáo viên thành công:", {
      teacherId,
      classId,
      subject,
      timeSlot,
      status,
      date: dateString,
    });

    return {
      success: true,
      attendanceId,
      data: attendanceData,
    };
  } catch (error) {
    console.error("❌ Lỗi điểm danh giáo viên:", error);
    throw error;
  }
};

/**
 * Lấy điểm danh giáo viên theo khoảng thời gian - V2 tương thích với UI
 * @param {string} teacherId - ID của giáo viên
 * @param {string} startDate - Ngày bắt đầu (YYYY-MM-DD)
 * @param {string} endDate - Ngày kết thúc (YYYY-MM-DD)
 */
export const getTeacherAttendanceByDateRange = async (
  teacherId,
  startDate,
  endDate
) => {
  try {
    // Lấy dữ liệu attendance từ collection teacher_attendance
    const q = query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherId),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );

    const querySnapshot = await getDocs(q);
    const attendanceData = {};

    // Nhóm records theo ngày
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date;

      if (!attendanceData[date]) {
        attendanceData[date] = {
          date,
          checkInData: null,
          checkOutData: null,
        };
      }

      if (data.type === "check_in") {
        attendanceData[date].checkInData = {
          actualTime: data.actualTime,
          status: data.status,
          note: data.note,
        };
      } else if (data.type === "check_out") {
        attendanceData[date].checkOutData = {
          actualTime: data.actualTime,
          status: data.status,
          note: data.note,
          workingHours: data.workingHours,
        };
      }
    });

    // Convert thành array và sắp xếp
    const attendanceList = Object.values(attendanceData).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return attendanceList;
  } catch (error) {
    console.error("❌ Error getting teacher attendance range:", error);
    throw error;
  }
};

/**
 * Lấy điểm danh giáo viên theo ngày
 * @param {string} teacherId - ID của giáo viên
 * @param {string} date - Ngày (YYYY-MM-DD)
 */
export const getTeacherAttendanceByDate = async (teacherId, date) => {
  try {
    console.log("🔍 Getting teacher attendance for:", { teacherId, date });

    // Simplify query to avoid composite index requirement
    const q = query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherId),
      where("date", "==", date)
      // Remove orderBy to avoid composite index requirement
    );

    const querySnapshot = await getDocs(q);
    const attendanceList = [];

    querySnapshot.forEach((doc) => {
      attendanceList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Sort in memory instead of using orderBy in query
    attendanceList.sort((a, b) => {
      const timestampA = a.timestamp?.toDate
        ? a.timestamp.toDate()
        : new Date(a.timestamp);
      const timestampB = b.timestamp?.toDate
        ? b.timestamp.toDate()
        : new Date(b.timestamp);
      return timestampA.getTime() - timestampB.getTime();
    });

    console.log("✅ Found attendance records:", attendanceList.length);
    return attendanceList;
  } catch (error) {
    console.error("❌ Lỗi lấy điểm danh giáo viên:", error);
    throw error;
  }
};

/**
 * Lấy thống kê điểm danh giáo viên - V2 tương thích với UI
 * @param {string} teacherId - ID giáo viên
 * @param {string} startDate - Ngày bắt đầu
 * @param {string} endDate - Ngày kết thúc
 */
export const getTeacherAttendanceStats = async (
  teacherId,
  startDate,
  endDate
) => {
  try {
    console.log("🔍 Getting teacher attendance stats V2:", {
      teacherId,
      startDate,
      endDate,
    });

    // Lấy dữ liệu attendance từ collection mới
    const q = query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherId),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );

    const querySnapshot = await getDocs(q);
    const attendanceRecords = [];
    const dailyAttendance = {};

    // Group by date and type
    querySnapshot.forEach((doc) => {
      const record = doc.data();
      const date = record.date;

      if (!dailyAttendance[date]) {
        dailyAttendance[date] = {
          date,
          hasCheckIn: false,
          hasCheckOut: false,
          status: "absent",
          note: "",
          subject: "",
          timeSlot: "",
        };
      }

      if (record.type === "check_in") {
        dailyAttendance[date].hasCheckIn = true;
        dailyAttendance[date].status = record.status || "present";
        dailyAttendance[date].note = record.note || "";
      } else if (record.type === "check_out") {
        dailyAttendance[date].hasCheckOut = true;
      }

      attendanceRecords.push({
        id: doc.id,
        ...record,
      });
    });

    // Calculate stats
    const dailyRecords = Object.values(dailyAttendance);
    const stats = {
      totalSessions: dailyRecords.length,
      present: 0,
      absent: 0,
      late: 0,
      substitute: 0,
      attendanceRate: 0,
      totalHoursWorked: 0,
    };

    dailyRecords.forEach((record) => {
      if (record.hasCheckIn) {
        stats[record.status]++;
        // Ước tính 8 giờ làm việc mỗi ngày có mặt
        stats.totalHoursWorked += 8;
      } else {
        stats.absent++;
      }
    });

    // Calculate attendance rate
    if (stats.totalSessions > 0) {
      stats.attendanceRate = (
        ((stats.present + stats.late) / stats.totalSessions) *
        100
      ).toFixed(2);
    }

    // Sort records by date (newest first)
    const sortedRecords = dailyRecords.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    console.log("✅ Teacher attendance stats V2:", {
      teacherId,
      totalSessions: stats.totalSessions,
      present: stats.present,
      attendanceRate: stats.attendanceRate,
    });

    return {
      records: sortedRecords,
      stats,
    };
  } catch (error) {
    console.error("❌ Error getting teacher attendance stats V2:", error);
    throw error;
  }
};

// ==================== BULK OPERATIONS ====================

/**
 * Điểm danh hàng loạt cho học sinh trong lớp
 * @param {Array} attendanceList - Danh sách điểm danh [{studentId, status, note}]
 * @param {string} classId - ID của lớp
 * @param {string} teacherId - ID của giáo viên
 */
export const markBulkStudentAttendance = async (
  attendanceList,
  classId,
  teacherId
) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];
    const promises = [];

    for (const attendance of attendanceList) {
      promises.push(
        markStudentAttendance(
          attendance.studentId,
          classId,
          teacherId,
          attendance.status,
          attendance.note
        )
      );
    }

    await Promise.all(promises);

    console.log("✅ Điểm danh hàng loạt thành công:", {
      classId,
      date: dateString,
      count: attendanceList.length,
    });

    return {
      success: true,
      date: dateString,
      count: attendanceList.length,
    };
  } catch (error) {
    console.error("❌ Lỗi điểm danh hàng loạt:", error);
    throw error;
  }
};

/**
 * Lấy tổng quan điểm danh lớp học theo tháng
 * @param {string} classId - ID của lớp
 * @param {number} month - Tháng (1-12)
 * @param {number} year - Năm
 */
export const getClassAttendanceOverview = async (classId, month, year) => {
  try {
    const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
    const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

    const q = query(
      collection(db, "student_attendance"),
      where("classId", "==", classId),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );

    const querySnapshot = await getDocs(q);
    const dailyStats = {};

    querySnapshot.forEach((doc) => {
      const record = doc.data();
      const date = record.date;

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }

      dailyStats[date].total++;
      dailyStats[date][record.status]++;
    });

    // Sắp xếp kết quả theo ngày tăng dần
    const sortedDailyStats = Object.values(dailyStats).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return sortedDailyStats;
  } catch (error) {
    console.error("❌ Lỗi lấy tổng quan điểm danh lớp:", error);
    throw error;
  }
};

/**
 * Lấy lịch dạy của giáo viên trong ngày từ timetable V2
 * @param {string} teacherId - ID của giáo viên
 * @param {string} date - Ngày (YYYY-MM-DD)
 */
export const getTeacherTimetableByDate = async (teacherId, date) => {
  try {
    // Sử dụng function mới từ timetableServiceV2
    const sessions = await timetableService.getTeacherScheduleByDate(
      teacherId,
      date
    );

    // Convert để tương thích với format cũ
    const formattedSchedule = sessions.map((session) => ({
      period: `Tiết ${session.timeSlot}`,
      subject: session.subject,
      classId: session.classId,
      startTime: session.startTime,
      endTime: session.endTime,
      teacherId: session.teacherId,
      timeSlot: session.timeSlot,
      room: session.room || "",
    }));

    return formattedSchedule;
  } catch (error) {
    console.error("❌ Error getting teacher timetable:", error);
    return [];
  }
};

/**
 * Lấy thời gian check-in và check-out dự kiến cho giáo viên
 * @param {string} teacherId - ID của giáo viên
 * @param {string} date - Ngày (YYYY-MM-DD)
 */
export const getTeacherExpectedWorkingHours = async (teacherId, date) => {
  try {
    const schedule = await getTeacherTimetableByDate(teacherId, date);

    if (schedule.length === 0) {
      return {
        hasSchedule: false,
        checkInTime: null,
        checkOutTime: null,
        totalPeriods: 0,
        periods: [],
      };
    }

    // Lấy tiết đầu và cuối từ schedule đã được sắp xếp
    const firstPeriod = schedule[0];
    const lastPeriod = schedule[schedule.length - 1];

    const checkInTime = firstPeriod.startTime || "07:00";
    const checkOutTime = lastPeriod.endTime || "16:15";

    return {
      hasSchedule: true,
      checkInTime,
      checkOutTime,
      totalPeriods: schedule.length,
      periods: schedule,
      expectedCheckIn: `${date} ${checkInTime}:00`,
      expectedCheckOut: `${date} ${checkOutTime}:00`,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy giờ làm việc dự kiến:", error);
    throw error;
  }
};

/**
 * Check-in giáo viên với logic thông minh
 * @param {string} teacherId - ID của giáo viên
 */
/**
 * Helper function to convert time string (HH:MM) to minutes
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

export const teacherCheckIn = async (teacherId, dateArg, checkInTimeArg) => {
  try {
    const now = new Date();
    const today = dateArg || now.toISOString().split("T")[0];

    // Lấy lịch dạy hôm nay
    const workingHours = await getTeacherExpectedWorkingHours(teacherId, today);

    if (!workingHours.hasSchedule) {
      throw new Error("Bạn không có lịch dạy hôm nay");
    }

    // Lấy tiết đầu tiên trong ngày
    const sortedPeriods = [...workingHours.periods].sort((a, b) => {
      const [h1, m1] = a.startTime.split(":").map(Number);
      const [h2, m2] = b.startTime.split(":").map(Number);
      return h1 * 60 + m1 - (h2 * 60 + m2);
    });
    const firstPeriod = sortedPeriods[0];
    const checkInTime = checkInTimeArg || firstPeriod.startTime;

    // Kiểm tra đã check-in chưa
    const existingCheckIn = await getTeacherAttendanceByDate(teacherId, today);
    const hasCheckedIn = existingCheckIn.some(
      (record) => record.type === "check_in"
    );
    if (hasCheckedIn) {
      throw new Error("Bạn đã check-in rồi");
    }

    // Lấy giờ thực tế bấm nút
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM
    const currentMinutes = timeToMinutes(currentTime);
    const checkInMinutes = timeToMinutes(checkInTime);

    let status = "present";
    let note = "";

    if (currentMinutes > checkInMinutes) {
      status = "late";
      const lateMinutes = currentMinutes - checkInMinutes;
      note = `Đi muộn ${lateMinutes} phút`;
    } else if (currentMinutes < checkInMinutes) {
      const earlyMinutes = checkInMinutes - currentMinutes;
      note = `Đến sớm ${earlyMinutes} phút`;
    } else {
      note = "Đúng giờ";
    }

    // Lưu check-in vào Firestore
    const checkInData = {
      teacherId,
      date: today,
      type: "check_in",
      timestamp: Timestamp.now(),
      actualTime: currentTime,
      expectedTime: checkInTime,
      status,
      note,
      periods: sortedPeriods,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(db, "teacher_attendance"),
      checkInData
    );

    return {
      success: true,
      id: docRef.id,
      data: checkInData,
      message: note,
    };
  } catch (error) {
    console.error("❌ Lỗi check-in giáo viên:", error);
    throw error;
  }
};

export const teacherCheckOut = async (teacherId, dateArg, checkOutTimeArg) => {
  try {
    const now = new Date();
    const today = dateArg || now.toISOString().split("T")[0];

    // Lấy lịch dạy hôm nay
    const workingHours = await getTeacherExpectedWorkingHours(teacherId, today);

    if (!workingHours.hasSchedule) {
      throw new Error("Bạn không có lịch dạy hôm nay");
    }

    // Lấy tiết cuối cùng trong ngày
    const sortedPeriods = [...workingHours.periods].sort((a, b) => {
      const [h1, m1] = a.endTime.split(":").map(Number);
      const [h2, m2] = b.endTime.split(":").map(Number);
      return h1 * 60 + m1 - (h2 * 60 + m2);
    });
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
    const checkOutTime = checkOutTimeArg || lastPeriod.endTime;

    // Kiểm tra trạng thái check-in/out
    const existingRecords = await getTeacherAttendanceByDate(teacherId, today);
    const hasCheckedIn = existingRecords.some(
      (record) => record.type === "check_in"
    );
    const hasCheckedOut = existingRecords.some(
      (record) => record.type === "check_out"
    );

    if (!hasCheckedIn) {
      throw new Error("Bạn chưa check-in");
    }
    if (hasCheckedOut) {
      throw new Error("Bạn đã check-out rồi");
    }

    // Lấy giờ thực tế bấm nút
    const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM
    const currentTimeInMinutes = timeToMinutes(currentTime);
    const checkOutTimeInMinutes = timeToMinutes(checkOutTime);

    let status = "completed";
    let note = "Check-out đúng giờ";

    if (currentTimeInMinutes < checkOutTimeInMinutes) {
      status = "early_leave";
      const minutesEarly = checkOutTimeInMinutes - currentTimeInMinutes;
      note = `Về sớm ${minutesEarly} phút`;
    } else if (currentTimeInMinutes > checkOutTimeInMinutes) {
      const minutesLate = currentTimeInMinutes - checkOutTimeInMinutes;
      note = `Về muộn ${minutesLate} phút`;
    }

    // Tính tổng giờ làm việc
    const checkInRecord = existingRecords.find(
      (record) => record.type === "check_in"
    );
    const checkInTimeInMinutes = timeToMinutes(checkInRecord.actualTime);
    const workingMinutes = currentTimeInMinutes - checkInTimeInMinutes;
    const totalWorkingHours = (workingMinutes / 60).toFixed(2);

    // Lưu check-out vào Firestore
    const checkOutData = {
      teacherId,
      date: today,
      type: "check_out",
      timestamp: Timestamp.now(),
      actualTime: currentTime,
      expectedTime: checkOutTime,
      status,
      note,
      workingMinutes,
      workingHours: parseFloat(totalWorkingHours),
      periods: sortedPeriods,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(db, "teacher_attendance"),
      checkOutData
    );

    return {
      success: true,
      id: docRef.id,
      data: checkOutData,
      message: note,
      workingHours: parseFloat(totalWorkingHours),
    };
  } catch (error) {
    console.error("❌ Lỗi check-out giáo viên:", error);
    throw error;
  }
};

/**
 * Lấy trạng thái check-in/check-out hiện tại của giáo viên
 * @param {string} teacherId - ID của giáo viên
 * @param {string} date - Ngày (YYYY-MM-DD)
 */
export const getTeacherTodayStatus = async (teacherId, date) => {
  try {
    const workingHours = await getTeacherExpectedWorkingHours(teacherId, date);
    const attendanceRecords = await getTeacherAttendanceByDate(teacherId, date);

    const checkInRecord = attendanceRecords.find(
      (record) => record.type === "check_in"
    );
    const checkOutRecord = attendanceRecords.find(
      (record) => record.type === "check_out"
    );

    return {
      hasSchedule: workingHours.hasSchedule,
      expectedCheckIn: workingHours.checkInTime,
      expectedCheckOut: workingHours.checkOutTime,
      periods: workingHours.periods || [],
      totalPeriods: workingHours.totalPeriods || 0,
      hasCheckedIn: !!checkInRecord,
      hasCheckedOut: !!checkOutRecord,
      checkInData: checkInRecord || null,
      checkOutData: checkOutRecord || null,
      canCheckIn: workingHours.hasSchedule && !checkInRecord,
      canCheckOut: workingHours.hasSchedule && checkInRecord && !checkOutRecord,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy trạng thái hôm nay:", error);
    throw error;
  }
};
