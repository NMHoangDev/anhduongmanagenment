/* eslint-disable no-console */
import { db } from "../firebase"; // chỉnh lại path nếu khác
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

/** ===== Debug helpers ===== */
const DEBUG_TIMETABLE = true;
const logScope = (name, meta = {}) => {
  const scopeId = `[TimetableSvc] ${name}`;
  if (!DEBUG_TIMETABLE) {
    return {
      start: () => {},
      end: () => {},
      log: () => {},
      error: (...a) => console.error(scopeId, ...a),
    };
  }
  return {
    start: () => {
      console.groupCollapsed(scopeId, meta);
      console.time(scopeId);
    },
    end: () => {
      console.timeEnd(scopeId);
      console.groupEnd();
    },
    log: (...a) => console.log(scopeId, ...a),
    error: (...a) => console.error(scopeId, ...a),
  };
};

/** ===== Constants / helpers ===== */
export const DISPLAY_LABEL = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
};

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const emptySchedule = () => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
});

const toMinutes = (t) => {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const [h, m] = String(t).split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

const sortLessonsInDay = (arr) =>
  arr.sort((a, b) => {
    const aSlot = a.timeSlot ?? Number.MAX_SAFE_INTEGER;
    const bSlot = b.timeSlot ?? Number.MAX_SAFE_INTEGER;
    if (aSlot !== bSlot) return aSlot - bSlot;
    return toMinutes(a.startTime) - toMinutes(b.startTime);
  });

const getDayKey = (s) => {
  const k = s?.dayOfWeek?.toLowerCase?.();
  return DAY_ORDER.includes(k) ? k : null;
};

// ===== Session helpers =====
export const buildSessionName = (term /*1|2*/, yearFrom, yearTo) =>
  `SESSION ${term} ${yearFrom}-${yearTo}`;

const parseSessionName = (sessionName) => {
  const m = String(sessionName || "").match(
    /^SESSION\s+(\d)\s+(\d{4})-(\d{4})$/i
  );
  if (!m)
    throw new Error(
      "Invalid sessionName format (expect 'SESSION 1 2024-2025')."
    );
  const term = parseInt(m[1], 10);
  const yearFrom = parseInt(m[2], 10);
  const yearTo = parseInt(m[3], 10);
  return { term, yearRange: `${yearFrom}-${yearTo}`, yearFrom, yearTo };
};

const buildTimetableDocId = (classId, sessionName) =>
  `${classId}__${sessionName}`;

// ===== Week helpers (ISO-ish: 'YYYY-Www')
const normalizeWeekId = (weekId) =>
  String(weekId || "")
    .trim()
    .replace(/_/g, "-")
    .toUpperCase()
    .replace(/-W(\d)$/, "-W0$1"); // W3 -> W03

const weekIdFromDate = (dateStr) => {
  // dateStr: 'YYYY-MM-DD'
  const d = new Date(dateStr + "T00:00:00Z");
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const dayNum = Math.floor((d - tmp) / (24 * 60 * 60 * 1000)) + 1;
  const week = Math.ceil((d.getUTCDay() + 6 + dayNum) / 7); // Mon=1..Sun=7 style
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const getMondayFromWeekId = (weekId) => {
  // returns Date in local TZ at 00:00 (we’ll compare by YYYY-MM-DD)
  const [y, w] = String(weekId).split("-W");
  const year = parseInt(y, 10);
  const week = parseInt(w, 10);
  // Thursday in current week decides the year.
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay(); // 0..6 (Sun..Sat)
  const ISOWeekStart = new Date(simple);
  // shift to Monday
  const shift = dow === 0 ? -6 : 1 - dow;
  ISOWeekStart.setUTCDate(simple.getUTCDate() + shift);
  // return Monday in local time
  const local = new Date(ISOWeekStart.getTime());
  return new Date(local.getFullYear(), local.getMonth(), local.getDate());
};

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/** ===== 1) Tìm lớp chứa học sinh (studentId là ID doc trong 'students') ===== */
export const getStudentClass = async (studentId) => {
  const lg = logScope("getStudentClass", { studentId });
  lg.start();
  try {
    if (!studentId) throw new Error("studentId không được để trống");
    const classesRef = collection(db, "classes");
    const qClasses = query(
      classesRef,
      where("students", "array-contains", studentId)
    );
    const snap = await getDocs(qClasses);
    lg.log("classes matched:", snap.size);
    if (snap.empty) return null;
    const doc0 = snap.docs[0];
    const data = { id: doc0.id, ...doc0.data() };
    lg.log("studentClass:", data);
    return data;
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/** ===== 2) Lấy toàn bộ TKB của LỚP trong 1 SESSION (gom theo thứ, không lọc tuần) =====
 * Đọc doc: timetable/{classId__sessionName}
 */
export const getClassTimetable = async (classId, sessionName) => {
  const lg = logScope("getClassTimetable", { classId, sessionName });
  lg.start();
  try {
    if (!classId) throw new Error("classId không được để trống");
    if (!sessionName) throw new Error("sessionName không được để trống");

    // xác thực sessionName
    parseSessionName(sessionName);

    const ref = doc(db, "timetable", buildTimetableDocId(classId, sessionName));
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      lg.log("no timetable doc for class+session");
      return emptySchedule();
    }
    const data = snap.data();
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];

    const schedule = emptySchedule();
    sessions.forEach((s) => {
      if (s.status && s.status !== "active") return;
      const dayKey = getDayKey(s);
      if (!dayKey) return;
      schedule[dayKey].push({
        id: s.id,
        subject: s.subject,
        teacherId: s.teacherId,
        teacher: s.teacher,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        timeSlot: s.timeSlot,
        status: s.status,
        note: s.note,
        date: s.date, // YYYY-MM-DD
      });
    });

    Object.keys(schedule).forEach((k) => sortLessonsInDay(schedule[k]));
    return schedule;
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/** ===== 3) Lấy TKB của LỚP THEO TUẦN (weekId) trong 1 SESSION =====
 * Filter các phần tử trong mảng sessions theo date thuộc tuần weekId.
 */
export const getClassWeekTimetable = async (
  classId,
  rawWeekId,
  sessionName
) => {
  const weekId = normalizeWeekId(rawWeekId);
  const lg = logScope("getClassWeekTimetable", {
    classId,
    weekId,
    sessionName,
  });
  lg.start();
  try {
    if (!classId) throw new Error("classId không được để trống");
    if (!weekId) throw new Error("weekId không được để trống");
    if (!sessionName) throw new Error("sessionName không được để trống");
    parseSessionName(sessionName);

    const ref = doc(db, "timetable", buildTimetableDocId(classId, sessionName));
    const snap = await getDoc(ref);
    const schedule = emptySchedule();

    if (!snap.exists()) return { weekId, schedule };

    const all = Array.isArray(snap.data().sessions) ? snap.data().sessions : [];

    // date range Mon..Sun
    const mon = getMondayFromWeekId(weekId);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);

    const inRange = (dstr) => {
      // dstr: YYYY-MM-DD (local)
      const d = new Date(dstr + "T00:00:00");
      return d >= mon && d <= sun;
    };

    all.forEach((s) => {
      if (s.status && s.status !== "active") return;
      if (!s.date || !inRange(s.date)) return;
      const dayKey = getDayKey(s);
      if (!dayKey) return;
      schedule[dayKey].push({
        id: s.id,
        subject: s.subject,
        teacherId: s.teacherId,
        teacher: s.teacher,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        timeSlot: s.timeSlot,
        status: s.status,
        note: s.note,
        date: s.date,
      });
    });

    Object.keys(schedule).forEach((k) => sortLessonsInDay(schedule[k]));
    return { weekId, schedule };
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/** ===== 4) API: nhận studentId -> TKB (không theo tuần) trong 1 SESSION ===== */
export const getStudentTimetable = async (studentId, sessionName) => {
  const lg = logScope("getStudentTimetable", { studentId, sessionName });
  lg.start();
  try {
    if (!studentId) throw new Error("studentId không được để trống");
    if (!sessionName) throw new Error("sessionName không được để trống");

    const studentClass = await getStudentClass(studentId);
    if (!studentClass) {
      return {
        studentId,
        classId: null,
        className: null,
        schedule: emptySchedule(),
        message: "Học sinh chưa thuộc lớp nào",
      };
    }

    const schedule = await getClassTimetable(studentClass.id, sessionName);
    const result = {
      studentId,
      classId: studentClass.id,
      className: studentClass.name,
      schedule,
    };
    lg.log("final:", { classId: result.classId, className: result.className });
    return result;
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/** ===== 5) API: nhận studentId + weekId -> TKB theo tuần trong 1 SESSION ===== */
export const getStudentWeekTimetable = async (
  studentId,
  rawWeekId,
  sessionName
) => {
  const weekId = normalizeWeekId(rawWeekId);
  const lg = logScope("getStudentWeekTimetable", {
    studentId,
    weekId,
    sessionName,
  });
  lg.start();
  try {
    if (!studentId) throw new Error("studentId không được để trống");
    if (!sessionName) throw new Error("sessionName không được để trống");

    const studentClass = await getStudentClass(studentId);
    if (!studentClass) {
      return {
        studentId,
        classId: null,
        className: null,
        weekId,
        schedule: emptySchedule(),
        message: "Học sinh chưa thuộc lớp nào",
      };
    }

    const { schedule } = await getClassWeekTimetable(
      studentClass.id,
      weekId,
      sessionName
    );
    return {
      studentId,
      classId: studentClass.id,
      className: studentClass.name,
      weekId,
      schedule,
    };
  } catch (err) {
    lg.error("FAILED:", err);
    throw err;
  } finally {
    lg.end();
  }
};

/** ===== 6) Danh sách weekId (tăng dần) của LỚP trong 1 SESSION =====
 * Tính từ mảng 'sessions[].date'
 */
export const getClassWeeks = async (classId, sessionName) => {
  const lg = logScope("getClassWeeks", { classId, sessionName });
  lg.start();
  try {
    if (!classId) throw new Error("classId không được để trống");
    if (!sessionName) throw new Error("sessionName không được để trống");
    parseSessionName(sessionName);

    const ref = doc(db, "timetable", buildTimetableDocId(classId, sessionName));
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const sessions = Array.isArray(snap.data().sessions)
      ? snap.data().sessions
      : [];
    const set = new Set();
    sessions.forEach((s) => {
      if (!s.date) return;
      const w = weekIdFromDate(s.date);
      set.add(w);
    });
    const weeks = Array.from(set).sort(); // tăng dần
    lg.log("weeks:", weeks.length, weeks.slice(0, 8), "...");
    return weeks;
  } catch (err) {
    lg.error("FAILED:", err);
    return [];
  } finally {
    lg.end();
  }
};

/** ===== 7) Danh sách weekId của HỌC SINH (theo lớp) trong 1 SESSION ===== */
export const getStudentWeeks = async (studentId, sessionName) => {
  const lg = logScope("getStudentWeeks", { studentId, sessionName });
  lg.start();
  try {
    const studentClass = await getStudentClass(studentId);
    if (!studentClass) return [];
    return await getClassWeeks(studentClass.id, sessionName);
  } catch (err) {
    lg.error("FAILED:", err);
    return [];
  } finally {
    lg.end();
  }
};

/** ===== 8) Lấy nhiều tuần liên tiếp cho học sinh trong 1 SESSION =====
 * offset: 0 => bắt đầu từ tuần nhỏ nhất tìm được trong session
 * take: số tuần muốn lấy
 */
export const getStudentWeeklyTimetables = async (
  studentId,
  sessionName,
  offset = 0,
  take = 1
) => {
  const lg = logScope("getStudentWeeklyTimetables", {
    studentId,
    sessionName,
    offset,
    take,
  });
  lg.start();
  try {
    const weeks = await getStudentWeeks(studentId, sessionName);
    if (!weeks.length) return [];

    const startIdx = Math.max(0, 0 + offset);
    const slice = weeks.slice(startIdx, startIdx + take);

    const out = [];
    for (const w of slice) {
      const one = await getStudentWeekTimetable(studentId, w, sessionName);
      out.push(one);
    }
    return out;
  } catch (err) {
    lg.error("FAILED:", err);
    return [];
  } finally {
    lg.end();
  }
};
// ===== Stats: tổng tiết & top môn học trong 1 session =====
export const getTimetableStats = async (studentId, sessionName) => {
  // Tận dụng API đã có
  const all = await getStudentTimetable(studentId, sessionName);

  // Phòng hờ trường hợp chưa có lớp
  const schedule = all?.schedule || {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  // Gom & đếm
  const subjectCount = new Map();
  let totalLessons = 0;

  Object.values(schedule).forEach((dayArr) => {
    (dayArr || []).forEach((l) => {
      totalLessons += 1;
      const key = (l?.subject || "Khác").trim();
      subjectCount.set(key, (subjectCount.get(key) || 0) + 1);
    });
  });

  const topSubjects = Array.from(subjectCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([subject, count]) => ({ subject, count }));

  return {
    studentId,
    classId: all?.classId ?? null,
    className: all?.className ?? null,
    totalLessons,
    topSubjects,
  };
};
