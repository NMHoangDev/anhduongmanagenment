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
import { documentId } from "firebase/firestore";
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
// Giữ lại duy nhất hàm tổng quan; các hàm mark/get/ bulk/... bản cũ (chỉ GVCN) đã bị loại bỏ.
// Bản mới có subjectId nằm ở phần "CẬP NHẬT QUYỀN VỚI subjectId" phía dưới.

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

    const sortedDailyStats = Object.values(dailyStats).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return sortedDailyStats;
  } catch (error) {
    console.error("❌ Lỗi lấy tổng quan điểm danh lớp:", error);
    throw error;
  }
};

// ==================== CẬP NHẬT QUYỀN VỚI subjectId ====================

// helper cũ
const normalizeId = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.id || v._id || v.teacherId || null;
  return String(v);
};

// REPLACE: kiểm tra GV có được phân công subjectId trong lớp KHÔNG đọc từ classes.teachingAssignments
export const isTeacherAssignedToClassSubject = async (
  teacherId,
  classId,
  subjectId
) => {
  try {
    if (!teacherId || !classId || !subjectId) return false;

    // đọc từ classAssignments
    const qx = query(
      collection(db, "classAssignments"),
      where("type", "==", "teaching"),
      where("status", "==", "active"),
      where("teacherId", "==", String(teacherId)),
      where("classId", "==", classId),
      where("subjectId", "==", subjectId)
    );
    const snap = await getDocs(qx);
    return !snap.empty;
  } catch (err) {
    console.error("Error in isTeacherAssignedToClassSubject:", err);
    return false;
  }
};

export const getAssignedSubjectsForTeacherInClass = async (
  classId,
  teacherId
) => {
  if (!classId || !teacherId) return [];

  // 1) Lấy danh sách subjectId từ classAssignments (ACTIVE)
  const qx = query(
    collection(db, "classAssignments"),
    where("type", "==", "teaching"),
    where("status", "==", "active"),
    where("classId", "==", classId),
    where("teacherId", "==", String(teacherId))
  );
  const snap = await getDocs(qx);
  const subjectIds = [
    ...new Set(snap.docs.map((d) => d.data()?.subjectId).filter(Boolean)),
  ];
  if (subjectIds.length === 0) return [];

  // 2) Batch fetch subjects theo nhóm 10 (giới hạn Firestore `in`)
  const chunk = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const chunks = chunk(subjectIds, 10);
  const subjects = [];

  for (const ids of chunks) {
    const qs = query(
      collection(db, "subjects"),
      where(documentId(), "in", ids)
    );
    const ss = await getDocs(qs);
    ss.forEach((docSnap) => {
      const d = docSnap.data() || {};
      subjects.push({
        subjectId: docSnap.id,
        subjectName: d.name || d.title || docSnap.id,
        subjectCode: d.code || null,
        shortName: d.shortName || d.abbr || null,
      });
    });
  }

  // 3) Giữ nguyên thứ tự theo subjectIds ban đầu (nếu muốn)
  const index = new Map(subjectIds.map((id, i) => [id, i]));
  subjects.sort(
    (a, b) => (index.get(a.subjectId) ?? 0) - (index.get(b.subjectId) ?? 0)
  );

  return subjects;
};

// REPLACE: trả về danh sách lớp GV có thể điểm danh (GVCN + được phân công dạy) dựa trên classAssignments
export const getClassesForTeacherAttendance = async (teacherId) => {
  if (!teacherId) return [];
  const tid = String(teacherId);

  // 1) Lấy lớp chủ nhiệm
  const hrSnap = await getDocs(
    query(collection(db, "classes"), where("homeRoomTeacherId", "==", tid))
  );
  const homeroomClasses = hrSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  // 2) Lấy các assignment đang ACTIVE từ classAssignments theo teacherId
  const assignSnap = await getDocs(
    query(
      collection(db, "classAssignments"),
      where("type", "==", "teaching"),
      where("status", "==", "active"),
      where("teacherId", "==", tid)
    )
  );

  // Gom subject theo classId
  const subjectsByClass = new Map();
  assignSnap.docs.forEach((docSnap) => {
    const a = docSnap.data();
    if (!a?.classId || !a?.subjectId) return;
    if (!subjectsByClass.has(a.classId))
      subjectsByClass.set(a.classId, new Set());
    subjectsByClass.get(a.classId).add(a.subjectId);
  });

  // 3) Lấy thông tin lớp cho các classId từ assignments
  const teachingClassIds = Array.from(subjectsByClass.keys());

  // loại các lớp đã là GVCN (tránh trùng)
  const hrSet = new Set(homeroomClasses.map((c) => c.id));
  const teachingOnlyIds = teachingClassIds.filter((id) => !hrSet.has(id));

  // fetch từng lớp (đỡ giới hạn where in 10 phần tử)
  const teachingClasses = [];
  for (const cid of teachingOnlyIds) {
    const cSnap = await getDoc(doc(db, "classes", cid));
    if (cSnap.exists()) teachingClasses.push({ id: cSnap.id, ...cSnap.data() });
  }

  // 4) Chuẩn hóa output
  const result = [];

  // homeroom
  homeroomClasses.forEach((c) => {
    result.push({
      id: c.id,
      name: c.name || c.id,
      grade: c.grade || "",
      facility: c.facility || "",
      isHomeRoom: true,
      assignedSubjects: Array.from(subjectsByClass.get(c.id) || []), // nếu GV vừa là GVCN vừa dạy
      studentCount: Array.isArray(c.students)
        ? c.students.length
        : c.studentCount || 0,
    });
  });

  // teaching (không phải GVCN)
  teachingClasses.forEach((c) => {
    result.push({
      id: c.id,
      name: c.name || c.id,
      grade: c.grade || "",
      facility: c.facility || "",
      isHomeRoom: false,
      assignedSubjects: Array.from(subjectsByClass.get(c.id) || []),
      studentCount: Array.isArray(c.students)
        ? c.students.length
        : c.studentCount || 0,
    });
  });

  return result;
};

const _fmtDate = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Check-in giáo viên (tạo/ghi record theo ngày).
 * Trả về bản ghi sau check-in.
 */
export const teacherCheckIn = async (teacherId, payload = {}) => {
  if (!teacherId) throw new Error("teacherId is required");
  const today = _fmtDate(new Date());
  const docId = `${teacherId}_${today}`;
  const ref = doc(db, "teacher_attendance", docId);

  const snap = await getDoc(ref);
  const base = snap.exists() ? snap.data() : {};

  const data = {
    teacherId,
    date: today,
    checkInAt: Timestamp.now(),
    checkInNote: payload.note || base.checkInNote || "",
    status: "checked_in",
    createdAt: base.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await setDoc(ref, { ...base, ...data });
  const after = await getDoc(ref);
  return { id: ref.id, ...after.data() };
};

/**
 * Check-out giáo viên (cập nhật record trong ngày).
 * Trả về bản ghi sau check-out.
 */
export const teacherCheckOut = async (teacherId, payload = {}) => {
  if (!teacherId) throw new Error("teacherId is required");
  const today = _fmtDate(new Date());
  const ref = doc(db, "teacher_attendance", `${teacherId}_${today}`);

  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Bạn chưa check-in hôm nay.");
  }

  const data = {
    checkOutAt: Timestamp.now(),
    checkOutNote: payload.note || "",
    status: "checked_out",
    updatedAt: Timestamp.now(),
  };

  await updateDoc(ref, data);
  const after = await getDoc(ref);
  return { id: ref.id, ...after.data() };
};

/**
 * Trạng thái hôm nay của giáo viên (not_checked_in | checked_in | checked_out)
 */
export const getTeacherTodayStatus = async (teacherId) => {
  if (!teacherId) return { status: "not_checked_in" };
  const today = _fmtDate(new Date());
  const ref = doc(db, "teacher_attendance", `${teacherId}_${today}`);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { status: "not_checked_in" };

  const rec = snap.data();
  if (rec?.status === "checked_out")
    return { status: "checked_out", record: rec };
  if (rec?.status === "checked_in")
    return { status: "checked_in", record: rec };
  return { status: "not_checked_in", record: rec };
};

/**
 * Lấy thống kê điểm danh theo tháng (số ngày check-in, check-out, chưa check-in)
 */
export const getTeacherAttendanceStats = async (teacherId, month, year) => {
  if (!teacherId || !month || !year) {
    throw new Error("teacherId, month, year are required");
  }
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;

  const qSnap = await getDocs(
    query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherId),
      where("date", ">=", start),
      where("date", "<=", end)
    )
  );

  let checkedIn = 0;
  let checkedOut = 0;
  let days = new Set();

  qSnap.forEach((d) => {
    const rec = d.data();
    days.add(rec.date);
    if (rec.status === "checked_in") checkedIn += 1;
    if (rec.status === "checked_out") checkedOut += 1;
  });

  // “not_checked_in” = tổng số ngày có lịch làm mà chưa check-in (nếu cần có lịch).
  // Ở đây tạm hiểu theo dữ liệu hiện có: không có record -> chưa check-in.
  // Ta ước lượng bằng tổng ngày có bản ghi (unique dates) để xuất tỷ lệ tương đối.
  const totalRecordedDays = days.size;
  const notCheckedIn = Math.max(
    0,
    totalRecordedDays - (checkedIn + checkedOut)
  );

  return {
    month,
    year,
    checkedIn,
    checkedOut,
    notCheckedIn,
    totalRecordedDays,
  };
};

/**
 * Lấy bản ghi điểm danh theo khoảng ngày
 * Trả về danh sách sort theo date tăng dần
 */
export const getTeacherAttendanceByDateRange = async (
  teacherId,
  startDate,
  endDate
) => {
  if (!teacherId || !startDate || !endDate) {
    throw new Error("teacherId, startDate, endDate are required");
  }

  const qSnap = await getDocs(
    query(
      collection(db, "teacher_attendance"),
      where("teacherId", "==", teacherId),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    )
  );

  const items = [];
  qSnap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  items.sort((a, b) => new Date(a.date) - new Date(b.date));
  return items;
};
// ==================== STUDENT ATTENDANCE (ADD BACK) ====================

const _ymd = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// (private) Lấy bản ghi điểm danh 1 ngày cho 1 lớp; non-HRT có thể lọc theo subjectId
const _getStudentAttendanceByDate = async (classId, date, subjectId = null) => {
  const qAtt = query(
    collection(db, "student_attendance"),
    where("classId", "==", classId),
    where("date", "==", date)
  );
  const snap = await getDocs(qAtt);
  const list = [];
  snap.forEach((d) => {
    const rec = d.data();
    if (subjectId && rec.subjectId && rec.subjectId !== subjectId) return;
    list.push({ id: d.id, ...rec });
  });
  return list;
};

/**
 * Cho phép non-HRT lấy danh sách học sinh nếu có subjectId hợp lệ.
 * Trả về: { classInfo, students:[{... , attendance?, status?}], date, ... }
 */
export const getHomeRoomStudentsForAttendance = async (
  classId,
  teacherId,
  date,
  subjectId = null
) => {
  const day = _ymd(date || new Date());

  // Quyền: GVCN hoặc giáo viên được phân công môn
  const isHRT = await isHomeRoomTeacher(teacherId, classId);
  if (!isHRT) {
    if (!subjectId) throw new Error("Vui lòng chọn môn học để điểm danh.");
    const ok = await isTeacherAssignedToClassSubject(
      teacherId,
      classId,
      subjectId
    );
    if (!ok) throw new Error("Bạn không được phân công dạy môn này trong lớp.");
  }

  // Lấy thông tin lớp + danh sách học sinh
  const classRef = doc(db, "classes", classId);
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Không tìm thấy lớp học");

  const classData = classSnap.data();
  const studentIds = Array.isArray(classData.students)
    ? classData.students
    : [];

  const students = await Promise.all(
    studentIds.map(async (sid) => {
      const sSnap = await getDoc(doc(db, "students", sid));
      return sSnap.exists()
        ? { id: sid, ...sSnap.data() }
        : { id: sid, name: "Không tìm thấy" };
    })
  );

  // Lấy điểm danh hiện tại của ngày
  const currentAttendance = await _getStudentAttendanceByDate(
    classId,
    day,
    isHRT ? null : subjectId
  );
  const attMap = {};
  currentAttendance.forEach((r) => (attMap[r.studentId] = r));

  const studentsWithAttendance = students.map((s) => ({
    ...s,
    attendance: attMap[s.id] || null,
    status: attMap[s.id]?.status || null, // present/absent/late/excused...
  }));

  return {
    classInfo: {
      id: classId,
      name: classData.name,
      grade: classData.grade,
      facility: classData.facility,
    },
    students: studentsWithAttendance,
    date: day,
    totalStudents: students.length,
    markedCount: currentAttendance.length,
    isHomeRoomTeacher: isHRT,
    subjectId: isHRT ? null : subjectId,
  };
};

/**
 * Điểm danh 1 học sinh. Non-HRT bắt buộc có subjectId và phải được phân công.
 * Tạo khóa: `${studentId}_${YYYY-MM-DD}` hoặc kèm `_${subjectId}` cho non-HRT.
 */
export const markStudentAttendance = async (
  studentId,
  classId,
  teacherId,
  status,
  note = "",
  subjectId = null
) => {
  if (!studentId || !classId || !teacherId || !status) {
    throw new Error("studentId, classId, teacherId, status là bắt buộc");
  }

  const isHRT = await isHomeRoomTeacher(teacherId, classId);
  if (!isHRT) {
    if (!subjectId) throw new Error("Vui lòng chọn môn học để điểm danh.");
    const ok = await isTeacherAssignedToClassSubject(
      teacherId,
      classId,
      subjectId
    );
    if (!ok) throw new Error("Bạn không được phân công dạy môn này trong lớp.");
  }

  const today = _ymd(new Date());
  const attendanceId = `${studentId}_${today}${
    !isHRT && subjectId ? "_" + subjectId : ""
  }`;

  const data = {
    studentId,
    classId,
    teacherId,
    date: today,
    status, // present | absent | late | excused ...
    note,
    markedBy: teacherId,
    markedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    isHomeRoomTeacher: isHRT,
    subjectId: isHRT ? null : subjectId,
  };

  await setDoc(doc(db, "student_attendance", attendanceId), data);
  return { success: true, attendanceId, data };
};

/**
 * Điểm danh hàng loạt. Non-HRT truyền subjectId (chung) của tiết đang dạy.
 * attendanceList: [{ studentId, status, note? }, ...]
 */
export const markBulkStudentAttendance = async (
  attendanceList,
  classId,
  teacherId,
  subjectId = null
) => {
  if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
    return { success: true, count: 0 };
  }

  const isHRT = await isHomeRoomTeacher(teacherId, classId);
  if (!isHRT) {
    if (!subjectId) throw new Error("Vui lòng chọn môn học để điểm danh.");
    const ok = await isTeacherAssignedToClassSubject(
      teacherId,
      classId,
      subjectId
    );
    if (!ok) throw new Error("Bạn không được phân công dạy môn này trong lớp.");
  }

  const tasks = attendanceList.map((a) =>
    markStudentAttendance(
      a.studentId,
      classId,
      teacherId,
      a.status,
      a.note || "",
      isHRT ? null : subjectId
    )
  );
  await Promise.all(tasks);
  return { success: true, count: attendanceList.length };
};

/**
 * Helper: last day of month (number)
 */
const _lastDayOfMonth = (year, month) => {
  // month: 1-12
  return new Date(year, month, 0).getDate();
};

/**
 * Helper: build YYYY-MM-DD from parts (zero-padded)
 */
const _ymdFromParts = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/**
 * SUBJECT TEACHER
 * Thống kê điểm danh theo ngày cho giáo viên bộ môn.
 * Trả về danh sách học sinh theo từng trạng thái (present/absent/late/excused) trong ngày.
 */
export const getDailySubjectAttendanceBreakdown = async ({
  classId,
  subjectId,
  date,
  teacherId,
}) => {
  if (!classId || !subjectId || !date || !teacherId) {
    throw new Error("classId, subjectId, date, teacherId là bắt buộc");
  }
  // Quyền: phải là GV được phân công dạy môn đó trong lớp
  const ok = await isTeacherAssignedToClassSubject(
    teacherId,
    classId,
    subjectId
  );
  if (!ok) throw new Error("Bạn không được phân công dạy môn này trong lớp.");

  const day = _ymd(date);
  const qAtt = query(
    collection(db, "student_attendance"),
    where("classId", "==", classId),
    where("date", "==", day),
    where("subjectId", "==", subjectId)
  );
  const snap = await getDocs(qAtt);

  const records = [];
  const studentIds = new Set();
  snap.forEach((d) => {
    const rec = { id: d.id, ...d.data() };
    records.push(rec);
    if (rec.studentId) studentIds.add(rec.studentId);
  });

  // Fetch info cho các student đã có record
  const studentsMap = new Map();
  await Promise.all(
    Array.from(studentIds).map(async (sid) => {
      const sSnap = await getDoc(doc(db, "students", sid));
      if (sSnap.exists()) {
        studentsMap.set(snap.id, sSnap.data());
      }
      const data = sSnap.exists() ? sSnap.data() : { name: "Không tìm thấy" };
      studentsMap.set(sid, { id: sid, ...data });
    })
  );

  const group = {
    present: [],
    absent: [],
    late: [],
    excused: [],
    other: [],
  };

  records.forEach((r) => {
    const s = studentsMap.get(r.studentId) || {
      id: r.studentId,
      name: "Không tìm thấy",
    };
    const item = { ...s, recordId: r.id, status: r.status, note: r.note || "" };
    if (r.status === "present") group.present.push(item);
    else if (r.status === "absent") group.absent.push(item);
    else if (r.status === "late") group.late.push(item);
    else if (r.status === "excused") group.excused.push(item);
    else group.other.push(item);
  });

  return {
    classId,
    subjectId,
    date: day,
    totalMarked: records.length,
    counts: {
      present: group.present.length,
      absent: group.absent.length,
      late: group.late.length,
      excused: group.excused.length,
      other: group.other.length,
    },
    studentsByStatus: group,
  };
};

/**
 * SUBJECT TEACHER
 * Lịch thống kê theo tháng cho môn dạy: mỗi ngày liệt kê học sinh vắng/muộn/...
 */
export const getMonthlySubjectAttendanceCalendar = async ({
  classId,
  subjectId,
  month,
  year,
  teacherId,
}) => {
  if (!classId || !subjectId || !month || !year || !teacherId) {
    throw new Error("classId, subjectId, month, year, teacherId là bắt buộc");
  }
  const ok = await isTeacherAssignedToClassSubject(
    teacherId,
    classId,
    subjectId
  );
  if (!ok) throw new Error("Bạn không được phân công dạy môn này trong lớp.");

  const lastDay = _lastDayOfMonth(year, month);
  const startDate = _ymdFromParts(year, month, 1);
  const endDate = _ymdFromParts(year, month, lastDay);

  const qAtt = query(
    collection(db, "student_attendance"),
    where("classId", "==", classId),
    where("subjectId", "==", subjectId),
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snap = await getDocs(qAtt);

  // Gom theo ngày
  const byDate = {};
  const studentIds = new Set();

  snap.forEach((d) => {
    const rec = d.data();
    const day = rec.date;
    if (!byDate[day]) {
      byDate[day] = {
        date: day,
        present: [],
        absent: [],
        late: [],
        excused: [],
        other: [],
      };
    }
    const bucket =
      rec.status === "present"
        ? "present"
        : rec.status === "absent"
        ? "absent"
        : rec.status === "late"
        ? "late"
        : rec.status === "excused"
        ? "excused"
        : "other";
    byDate[day][bucket].push(rec.studentId);
    if (rec.studentId) studentIds.add(rec.studentId);
  });

  // Map tên học sinh
  const studentsMap = new Map();
  await Promise.all(
    Array.from(studentIds).map(async (sid) => {
      const sSnap = await getDoc(doc(db, "students", sid));
      const data = sSnap.exists() ? sSnap.data() : { name: "Không tìm thấy" };
      studentsMap.set(sid, { id: sid, ...data });
    })
  );

  // Thay ids => objects có tên
  const days = Object.keys(byDate).sort((a, b) => new Date(a) - new Date(b));
  const result = days.map((dkey) => {
    const entry = byDate[dkey];
    const mapList = (ids) =>
      ids.map(
        (sid) => studentsMap.get(sid) || { id: sid, name: "Không tìm thấy" }
      );
    return {
      date: entry.date,
      present: mapList(entry.present),
      absent: mapList(entry.absent),
      late: mapList(entry.late),
      excused: mapList(entry.excused),
      other: mapList(entry.other),
      counts: {
        present: entry.present.length,
        absent: entry.absent.length,
        late: entry.late.length,
        excused: entry.excused.length,
        other: entry.other.length,
        total:
          entry.present.length +
          entry.absent.length +
          entry.late.length +
          entry.excused.length +
          entry.other.length,
      },
    };
  });

  return {
    classId,
    subjectId,
    month,
    year,
    days: result,
  };
};

/**
 * HOMEROOM TEACHER
 * Thống kê theo tháng: học sinh nào vắng/muộn ngày nào, môn nào.
 * (GVCN xem toàn bộ bản ghi của lớp trong tháng, bao gồm bản ghi của GV bộ môn)
 */
export const getHomeroomMonthlyAbsenceDetails = async ({
  classId,
  month,
  year,
  teacherId,
}) => {
  if (!classId || !month || !year || !teacherId) {
    throw new Error("classId, month, year, teacherId là bắt buộc");
  }
  const isHRT = await isHomeRoomTeacher(teacherId, classId);
  if (!isHRT) {
    throw new Error(
      "Chỉ giáo viên chủ nhiệm mới có thể xem thống kê toàn lớp."
    );
  }

  const lastDay = _lastDayOfMonth(year, month);
  const startDate = _ymdFromParts(year, month, 1);
  const endDate = _ymdFromParts(year, month, lastDay);

  // Lấy danh sách học sinh của lớp
  const classSnap = await getDoc(doc(db, "classes", classId));
  if (!classSnap.exists()) throw new Error("Không tìm thấy lớp học");
  const classData = classSnap.data() || {};
  const studentIds = Array.isArray(classData.students)
    ? classData.students
    : [];

  // Map học sinh
  const studentsMap = new Map();
  await Promise.all(
    studentIds.map(async (sid) => {
      const sSnap = await getDoc(doc(db, "students", sid));
      const data = sSnap.exists() ? sSnap.data() : { name: "Không tìm thấy" };
      studentsMap.set(sid, { id: sid, ...data });
    })
  );

  // Lấy toàn bộ bản ghi điểm danh trong tháng cho lớp
  const qAtt = query(
    collection(db, "student_attendance"),
    where("classId", "==", classId),
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snap = await getDocs(qAtt);

  // Gom theo học sinh và theo ngày
  const byStudent = new Map();
  const byDate = {};

  // Khởi tạo byStudent
  studentIds.forEach((sid) => {
    byStudent.set(sid, {
      student: studentsMap.get(sid) || { id: sid, name: "Không tìm thấy" },
      absent: [], // { date, subjectId }
      late: [], // { date, subjectId }
      excused: [], // { date, subjectId }
      present: [], // { date, subjectId }
      other: [], // { date, subjectId, status }
    });
  });

  snap.forEach((d) => {
    const rec = d.data();
    const sid = rec.studentId;
    const day = rec.date;
    const subj = rec.subjectId || null; // null nếu GVCN điểm danh
    if (!byDate[day]) {
      byDate[day] = {
        date: day,
        absent: [],
        late: [],
        excused: [],
        present: [],
        other: [],
      };
    }

    const entry = byStudent.get(sid) || {
      student: { id: sid, name: "Không tìm thấy" },
      absent: [],
      late: [],
      excused: [],
      present: [],
      other: [],
    };

    const detail = { date: day, subjectId: subj, status: rec.status };
    if (rec.status === "absent") {
      entry.absent.push(detail);
      byDate[day].absent.push(sid);
    } else if (rec.status === "late") {
      entry.late.push(detail);
      byDate[day].late.push(sid);
    } else if (rec.status === "excused") {
      entry.excused.push(detail);
      byDate[day].excused.push(sid);
    } else if (rec.status === "present") {
      entry.present.push(detail);
      byDate[day].present.push(sid);
    } else {
      entry.other.push(detail);
      byDate[day].other.push(sid);
    }

    byStudent.set(sid, entry);
  });

  // Map ID -> object có tên cho byDate
  const mapIds = (ids) =>
    Array.from(new Set(ids)).map(
      (sid) => studentsMap.get(sid) || { id: sid, name: "Không tìm thấy" }
    );

  const days = Object.keys(byDate).sort((a, b) => new Date(a) - new Date(b));
  const dayDetails = days.map((dkey) => {
    const e = byDate[dkey];
    return {
      date: e.date,
      absent: mapIds(e.absent),
      late: mapIds(e.late),
      excused: mapIds(e.excused),
      present: mapIds(e.present),
      other: mapIds(e.other),
      counts: {
        absent: e.absent.length,
        late: e.late.length,
        excused: e.excused.length,
        present: e.present.length,
        other: e.other.length,
        total:
          e.absent.length +
          e.late.length +
          e.excused.length +
          e.present.length +
          e.other.length,
      },
    };
  });

  return {
    classId,
    month,
    year,
    students: Array.from(byStudent.values()),
    days: dayDetails,
    totalStudents: studentIds.length,
  };
};
