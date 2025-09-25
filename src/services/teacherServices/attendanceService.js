import {
  doc,
  setDoc,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  addDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import * as timetableService from "../adminServices/timetableService";
import { calculateDateFromWeekAndDay } from "../../utils/dateUtils";

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

// ==================== HOME ROOM TEACHER FUNCTIONS ====================

/**
 * Lấy danh sách lớp mà giáo viên làm chủ nhiệm
 * @param {string} teacherId - ID của giáo viên
 * @returns {Promise<Array>} - Danh sách lớp chủ nhiệm
 */
export const getHomeRoomClasses = async (teacherId) => {
  try {
    console.log("🏫 Getting homeroom classes for teacher:", teacherId);

    // Lấy thông tin giáo viên
    const teacherRef = doc(db, "teachers", teacherId);
    const teacherSnap = await getDoc(teacherRef);

    if (!teacherSnap.exists()) {
      console.log("❌ Teacher not found:", teacherId);
      return [];
    }

    const teacherData = teacherSnap.data();
    const homeRoomClassIds = teacherData.homeRoomClasses || [];

    if (homeRoomClassIds.length === 0) {
      console.log("📝 Teacher has no homeroom classes");
      return [];
    }

    // Lấy chi tiết các lớp chủ nhiệm
    const classPromises = homeRoomClassIds.map(async (classId) => {
      const classRef = doc(db, "classes", classId);
      const classSnap = await getDoc(classRef);

      if (classSnap.exists()) {
        const classData = classSnap.data();

        // Lấy danh sách học sinh trong lớp
        const studentIds = classData.students || [];
        const studentsDetails = await Promise.all(
          studentIds.map(async (studentId) => {
            const studentDoc = doc(db, "students", studentId);
            const studentSnap = await getDoc(studentDoc);
            if (studentSnap.exists()) {
              return { id: studentId, ...studentSnap.data() };
            }
            return { id: studentId, name: "Không tìm thấy" };
          })
        );

        return {
          id: classId,
          ...classData,
          studentsDetails: studentsDetails,
          totalStudents: studentsDetails.length,
        };
      }
      return null;
    });

    const classes = await Promise.all(classPromises);
    const validClasses = classes.filter((cls) => cls !== null);

    console.log(`✅ Found ${validClasses.length} homeroom classes for teacher`);
    return validClasses;
  } catch (error) {
    console.error("❌ Error getting homeroom classes:", error);
    throw error;
  }
};

/**
 * Kiểm tra giáo viên có phải chủ nhiệm của lớp không
 * @param {string} teacherId - ID của giáo viên
 * @param {string} classId - ID của lớp
 * @returns {Promise<boolean>} - True nếu là chủ nhiệm
 */
export const isHomeRoomTeacher = async (teacherId, classId) => {
  try {
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      return false;
    }

    const classData = classSnap.data();
    return classData.homeRoomTeacherId === teacherId;
  } catch (error) {
    console.error("❌ Error checking homeroom teacher:", error);
    return false;
  }
};

// ==================== STUDENT ATTENDANCE ====================

/**
 * Điểm danh học sinh - CHỈ CHO PHÉP GVCN
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
    // KIỂM TRA QUYỀN: Chỉ GVCN mới được điểm danh
    const isHRT = await isHomeRoomTeacher(teacherId, classId);
    if (!isHRT) {
      throw new Error(
        "Chỉ giáo viên chủ nhiệm mới có thể điểm danh học sinh trong lớp này"
      );
    }

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
      isHomeRoomTeacher: true, // Flag để phân biệt GVCN điểm danh
    };

    await setDoc(doc(db, "student_attendance", attendanceId), attendanceData);

    console.log("✅ Điểm danh học sinh thành công:", {
      studentId,
      status,
      date: dateString,
      byHomeRoomTeacher: true,
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
 * Lấy điểm danh học sinh theo ngày - CHỈ CHO LỚPS CHỦ NHIỆM
 * @param {string} classId - ID của lớp
 * @param {string} date - Ngày (YYYY-MM-DD)
 * @param {string} teacherId - ID của giáo viên (để kiểm tra quyền)
 */
export const getStudentAttendanceByDate = async (classId, date, teacherId) => {
  try {
    // KIỂM TRA QUYỀN: Chỉ GVCN mới được xem điểm danh
    if (teacherId) {
      const isHRT = await isHomeRoomTeacher(teacherId, classId);
      if (!isHRT) {
        throw new Error(
          "Chỉ giáo viên chủ nhiệm mới có thể xem điểm danh lớp này"
        );
      }
    }

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
 * Điểm danh hàng loạt cho học sinh trong lớp - CHỈ CHO GVCN
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
    // KIỂM TRA QUYỀN: Chỉ GVCN mới được điểm danh
    const isHRT = await isHomeRoomTeacher(teacherId, classId);
    if (!isHRT) {
      throw new Error(
        "Chỉ giáo viên chủ nhiệm mới có thể điểm danh học sinh trong lớp này"
      );
    }

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
      byHomeRoomTeacher: true,
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
 * Lấy tổng quan điểm danh lớp học theo tháng - CHỈ CHO GVCN
 * @param {string} classId - ID của lớp
 * @param {number} month - Tháng (1-12)
 * @param {number} year - Năm
 * @param {string} teacherId - ID của giáo viên (để kiểm tra quyền)
 */
export const getClassAttendanceOverview = async (
  classId,
  month,
  year,
  teacherId
) => {
  try {
    // KIỂM TRA QUYỀN: Chỉ GVCN mới được xem thống kê
    if (teacherId) {
      const isHRT = await isHomeRoomTeacher(teacherId, classId);
      if (!isHRT) {
        throw new Error(
          "Chỉ giáo viên chủ nhiệm mới có thể xem thống kê điểm danh lớp này"
        );
      }
    }

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
 * Lấy danh sách học sinh trong lớp chủ nhiệm để điểm danh
 * @param {string} classId - ID của lớp
 * @param {string} teacherId - ID của giáo viên
 * @param {string} date - Ngày điểm danh (YYYY-MM-DD)
 */
export const getHomeRoomStudentsForAttendance = async (
  classId,
  teacherId,
  date
) => {
  try {
    // KIỂM TRA QUYỀN: Chỉ GVCN
    const isHRT = await isHomeRoomTeacher(teacherId, classId);
    if (!isHRT) {
      throw new Error("Chỉ giáo viên chủ nhiệm mới có thể điểm danh lớp này");
    }

    // Lấy thông tin lớp và danh sách học sinh
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      throw new Error("Không tìm thấy lớp học");
    }

    const classData = classSnap.data();
    const studentIds = classData.students || [];

    // Lấy thông tin chi tiết học sinh
    const studentsPromises = studentIds.map(async (studentId) => {
      const studentDoc = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentDoc);

      if (studentSnap.exists()) {
        return { id: studentId, ...studentSnap.data() };
      }
      return { id: studentId, name: "Không tìm thấy" };
    });

    const students = await Promise.all(studentsPromises);

    // Lấy điểm danh hiện tại (nếu có)
    const currentAttendance = await getStudentAttendanceByDate(
      classId,
      date,
      teacherId
    );
    const attendanceMap = {};
    currentAttendance.forEach((record) => {
      attendanceMap[record.studentId] = record;
    });

    // Kết hợp thông tin học sinh với trạng thái điểm danh
    const studentsWithAttendance = students.map((student) => ({
      ...student,
      attendance: attendanceMap[student.id] || null,
      status: attendanceMap[student.id]?.status || null,
    }));

    return {
      classInfo: {
        id: classId,
        name: classData.name,
        grade: classData.grade,
        facility: classData.facility,
      },
      students: studentsWithAttendance,
      date,
      totalStudents: students.length,
      markedCount: currentAttendance.length,
    };
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách học sinh điểm danh:", error);
    throw error;
  }
};

// ==================== TEACHER ATTENDANCE ====================

/**
 * Lấy trạng thái điểm danh hôm nay của giáo viên
 * @param {string} teacherId - ID của giáo viên
 * @returns {Promise<Object>} - Trạng thái điểm danh hôm nay
 */
export const getTeacherTodayStatus = async (teacherId) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD

    console.log("🔍 Getting teacher today status for:", {
      teacherId,
      date: dateString,
    });

    const q = query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherId),
      where("date", "==", dateString)
    );

    const querySnapshot = await getDocs(q);
    const records = [];

    querySnapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Tìm check-in và check-out records
    const checkInRecord = records.find((r) => r.type === "check_in");
    const checkOutRecord = records.find((r) => r.type === "check_out");

    const status = {
      date: dateString,
      hasCheckedIn: !!checkInRecord,
      hasCheckedOut: !!checkOutRecord,
      checkInTime: checkInRecord?.actualTime || null,
      checkOutTime: checkOutRecord?.actualTime || null,
      checkInStatus: checkInRecord?.status || null,
      checkOutStatus: checkOutRecord?.status || null,
      workingHours: checkOutRecord?.workingHours || 0,
      totalRecords: records.length,
      records: records.sort((a, b) => {
        const timeA = new Date(
          a.actualTime || a.timestamp?.toDate?.() || a.timestamp
        );
        const timeB = new Date(
          b.actualTime || b.timestamp?.toDate?.() || b.timestamp
        );
        return timeA - timeB;
      }),
    };

    console.log("✅ Teacher today status:", status);
    return status;
  } catch (error) {
    console.error("❌ Error getting teacher today status:", error);
    throw error;
  }
};

/**
 * Check-in giáo viên
 * @param {string} teacherId - ID của giáo viên
 * @param {string} note - Ghi chú (optional)
 * @returns {Promise<Object>} - Kết quả check-in
 */
export const teacherCheckIn = async (teacherId, note = "") => {
  try {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeString = now.toTimeString().split(" ")[0]; // HH:MM:SS
    const timestamp = Timestamp.now();

    console.log("⏰ Teacher checking in:", {
      teacherId,
      date: dateString,
      time: timeString,
    });

    // Kiểm tra xem đã check-in hôm nay chưa
    const existingCheckIn = query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherId),
      where("date", "==", dateString),
      where("type", "==", "check_in")
    );

    const existingSnapshot = await getDocs(existingCheckIn);
    if (!existingSnapshot.empty) {
      throw new Error("Bạn đã check-in hôm nay rồi!");
    }

    // Xác định trạng thái dựa trên giờ check-in
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute; // Convert to minutes
    const standardStartTime = 7 * 60 + 30; // 7:30 AM in minutes
    const lateThreshold = 8 * 60; // 8:00 AM in minutes

    let status = "present";
    if (currentTime > lateThreshold) {
      status = "late";
    }

    const attendanceId = `${teacherId}_${dateString}_checkin`;

    const checkInData = {
      teacherId,
      date: dateString,
      type: "check_in",
      actualTime: now.toISOString(),
      expectedTime: `${dateString}T07:30:00.000Z`,
      status,
      note,
      timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      isLate: status === "late",
      minutesLate:
        status === "late" ? Math.max(0, currentTime - standardStartTime) : 0,
    };

    await setDoc(doc(db, "teacher_attendance", attendanceId), checkInData);

    console.log("✅ Teacher check-in successful:", {
      teacherId,
      date: dateString,
      time: timeString,
      status,
      isLate: status === "late",
    });

    return {
      success: true,
      data: checkInData,
      message:
        status === "late" ? "Check-in thành công (Trễ)" : "Check-in thành công",
    };
  } catch (error) {
    console.error("❌ Error teacher check-in:", error);
    throw error;
  }
};

/**
 * Check-out giáo viên
 * @param {string} teacherId - ID của giáo viên
 * @param {string} note - Ghi chú (optional)
 * @returns {Promise<Object>} - Kết quả check-out
 */
export const teacherCheckOut = async (teacherId, note = "") => {
  try {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeString = now.toTimeString().split(" ")[0]; // HH:MM:SS
    const timestamp = Timestamp.now();

    console.log("🏃 Teacher checking out:", {
      teacherId,
      date: dateString,
      time: timeString,
    });

    // Kiểm tra xem đã check-out hôm nay chưa
    const existingCheckOut = query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherId),
      where("date", "==", dateString),
      where("type", "==", "check_out")
    );

    const existingSnapshot = await getDocs(existingCheckOut);
    if (!existingSnapshot.empty) {
      throw new Error("Bạn đã check-out hôm nay rồi!");
    }

    // Lấy thông tin check-in để tính giờ làm việc
    const checkInQuery = query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherId),
      where("date", "==", dateString),
      where("type", "==", "check_in")
    );

    const checkInSnapshot = await getDocs(checkInQuery);
    let checkInTime = null;
    let workingHours = 0;

    if (!checkInSnapshot.empty) {
      const checkInData = checkInSnapshot.docs[0].data();
      checkInTime = new Date(checkInData.actualTime);
      const workingMs = now.getTime() - checkInTime.getTime();
      workingHours = Math.round((workingMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
    }

    // Xác định trạng thái dựa trên giờ check-out
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute; // Convert to minutes
    const standardEndTime = 17 * 60; // 5:00 PM in minutes

    let status = "present";
    if (currentTime < standardEndTime) {
      status = "early_leave";
    }

    const attendanceId = `${teacherId}_${dateString}_checkout`;

    const checkOutData = {
      teacherId,
      date: dateString,
      type: "check_out",
      actualTime: now.toISOString(),
      expectedTime: `${dateString}T17:00:00.000Z`,
      status,
      note,
      timestamp,
      checkInTime: checkInTime?.toISOString() || null,
      workingHours,
      createdAt: timestamp,
      updatedAt: timestamp,
      isEarlyLeave: status === "early_leave",
    };

    await setDoc(doc(db, "teacher_attendance", attendanceId), checkOutData);

    console.log("✅ Teacher check-out successful:", {
      teacherId,
      date: dateString,
      time: timeString,
      status,
      workingHours,
      isEarlyLeave: status === "early_leave",
    });

    return {
      success: true,
      data: checkOutData,
      workingHours,
      message:
        status === "early_leave"
          ? "Check-out thành công (Ra sớm)"
          : "Check-out thành công",
    };
  } catch (error) {
    console.error("❌ Error teacher check-out:", error);
    throw error;
  }
};

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
      type: "teaching_session", // Phân biệt với check-in/check-out
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
