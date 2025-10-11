import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";

/**
 * Timetable by SESSION (semester) – stored per class + session
 * Collection: timetable
 * DocID: `${classId}__${sessionName}`  // e.g. "class_001__SESSION 1 2024-2025"
 *
 * Document schema:
 * {
 *   id, classId, sessionName, yearRange, term, createdAt, updatedAt,
 *   sessions: [ { id, date, dayOfWeek, timeSlot, startTime, endTime, subject, teacherId, room, note, status, createdAt, updatedAt } ]
 * }
 */

// ==== Constants ====
export const TIME_SLOTS = [
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

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

// ==== Helpers ====
export const getTimeSlotById = (timeSlotId) =>
  TIME_SLOTS.find((slot) => slot.id === timeSlotId);

const getVietnamISOString = () => {
  const now = new Date();
  now.setHours(now.getHours() + 7);
  return now.toISOString();
};

// Build session name in required format
export const buildSessionName = (term /*1|2*/, yearFrom, yearTo) =>
  `SESSION ${term} ${yearFrom}-${yearTo}`;

export const parseSessionName = (sessionName) => {
  // "SESSION 1 2024-2025" -> { term: 1, yearRange: "2024-2025", yearFrom: 2024, yearTo: 2025 }
  const m = sessionName.match(/^SESSION\s+(\d)\s+(\d{4})-(\d{4})$/i);
  if (!m) throw new Error("Invalid sessionName format");
  const term = parseInt(m[1], 10);
  const yearFrom = parseInt(m[2], 10);
  const yearTo = parseInt(m[3], 10);
  return { term, yearRange: `${yearFrom}-${yearTo}`, yearFrom, yearTo };
};

// Build document id
const buildTimetableDocId = (classId, sessionName) =>
  `${classId}__${sessionName}`;

// Ensure timetable doc exists
const ensureTimetableDoc = async (classId, sessionName) => {
  const { term, yearRange } = parseSessionName(sessionName);
  const docId = buildTimetableDocId(classId, sessionName);
  const ref = doc(db, "timetable", docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const now = getVietnamISOString();
    await setDoc(ref, {
      id: docId,
      classId,
      sessionName,
      yearRange,
      term,
      createdAt: now,
      updatedAt: now,
      sessions: [],
    });
  }
  return ref;
};

// ==== CRUD for a single period (session item) inside a class+session timetable ====

/**
 * Add a new lesson (period) to class+session
 */
export const addTimetablePeriod = async (classId, sessionName, periodData) => {
  try {
    const ref = await ensureTimetableDoc(classId, sessionName);

    const timeSlot = getTimeSlotById(periodData.timeSlot);
    const now = getVietnamISOString();
    const newItem = {
      id: uuidv4(),
      date: periodData.date, // "YYYY-MM-DD"
      dayOfWeek: periodData.dayOfWeek, // "monday"... (optional but recommended)
      timeSlot: periodData.timeSlot,
      startTime: timeSlot?.startTime || "",
      endTime: timeSlot?.endTime || "",
      subject: periodData.subject || "",
      teacherId: periodData.teacherId || "",
      room: periodData.room || "",
      note: periodData.note || "",
      status: periodData.status || "active",
      createdAt: now,
      updatedAt: now,
    };

    const snap = await getDoc(ref);
    const data = snap.data();
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];
    sessions.push(newItem);

    await updateDoc(ref, { sessions, updatedAt: now });

    return newItem;
  } catch (err) {
    console.error("❌ addTimetablePeriod error:", err);
    throw err;
  }
};

/**
 * Update a lesson (period) by id inside class+session
 */
export const updateTimetablePeriod = async (
  classId,
  sessionName,
  periodId,
  patch
) => {
  try {
    const ref = await ensureTimetableDoc(classId, sessionName);
    const snap = await getDoc(ref);
    const data = snap.data();
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];
    const idx = sessions.findIndex((s) => s.id === periodId);
    if (idx === -1) throw new Error("Period not found");

    // keep timeSlot coherent
    const merged = { ...sessions[idx], ...patch };
    if (typeof merged.timeSlot === "number") {
      const ts = getTimeSlotById(merged.timeSlot);
      merged.startTime = ts?.startTime || merged.startTime || "";
      merged.endTime = ts?.endTime || merged.endTime || "";
    }
    merged.updatedAt = getVietnamISOString();

    sessions[idx] = merged;
    await updateDoc(ref, { sessions, updatedAt: merged.updatedAt });

    return merged;
  } catch (err) {
    console.error("❌ updateTimetablePeriod error:", err);
    throw err;
  }
};

/**
 * Delete a lesson (period) by id inside class+session
 */
export const deleteTimetablePeriod = async (classId, sessionName, periodId) => {
  try {
    const ref = await ensureTimetableDoc(classId, sessionName);
    const snap = await getDoc(ref);
    const data = snap.data();
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];
    const filtered = sessions.filter((s) => s.id !== periodId);
    if (filtered.length === sessions.length)
      throw new Error("Period not found");

    await updateDoc(ref, {
      sessions: filtered,
      updatedAt: getVietnamISOString(),
    });
    return true;
  } catch (err) {
    console.error("❌ deleteTimetablePeriod error:", err);
    throw err;
  }
};

// ==== Higher-level operations ====

/**
 * Get timetable for a class in a session
 */
export const getTimetableByClassAndSession = async (classId, sessionName) => {
  try {
    const ref = await ensureTimetableDoc(classId, sessionName);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { classId, sessionName, schedule: {} };

    const { sessions = [] } = snap.data();

    // group by day and sort by timeSlot
    const schedule = {};
    DAYS_OF_WEEK.forEach((d) => (schedule[d] = []));
    sessions.forEach((s) => {
      const day = s.dayOfWeek || DAYS_OF_WEEK[new Date(s.date).getDay() - 1];
      if (!schedule[day]) schedule[day] = [];
      if (!s.status || s.status === "active") {
        schedule[day].push(s);
      }
    });
    Object.keys(schedule).forEach((day) =>
      schedule[day].sort((a, b) => a.timeSlot - b.timeSlot)
    );

    return { classId, sessionName, schedule };
  } catch (err) {
    console.error("❌ getTimetableByClassAndSession error:", err);
    throw err;
  }
};

/**
 * Clear all periods for a class in a session
 */
export const clearTimetableForClassInSession = async (classId, sessionName) => {
  try {
    const ref = await ensureTimetableDoc(classId, sessionName);
    await updateDoc(ref, { sessions: [], updatedAt: getVietnamISOString() });
    return true;
  } catch (err) {
    console.error("❌ clearTimetableForClassInSession error:", err);
    throw err;
  }
};

/**
 * Copy timetable from one (class, session) to another
 */
export const copyTimetableBetweenSessions = async (
  fromClassId,
  fromSessionName,
  toClassId,
  toSessionName
) => {
  try {
    const fromRef = await ensureTimetableDoc(fromClassId, fromSessionName);
    const toRef = await ensureTimetableDoc(toClassId, toSessionName);

    const fromSnap = await getDoc(fromRef);
    const toSnap = await getDoc(toRef);
    const fromData = fromSnap.data();
    const toData = toSnap.data();

    const now = getVietnamISOString();
    const copied = (fromData.sessions || [])
      .filter((s) => !s.status || s.status === "active")
      .map((s) => ({
        ...s,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      }));

    await updateDoc(toRef, {
      sessions: [...(toData.sessions || []), ...copied],
      updatedAt: now,
    });

    return true;
  } catch (err) {
    console.error("❌ copyTimetableBetweenSessions error:", err);
    throw err;
  }
};

/**
 * Check conflicts within a session (same teacher, same date + timeSlot)
 * Scope: entire session for one class OR all classes if classId is null
 */
export const checkTimetableConflictsInSession = async (
  sessionName,
  classId /* optional: if provided, only that class; else all classes in session */
) => {
  try {
    const { yearRange, term } = parseSessionName(sessionName);

    let docsSnap;
    if (classId) {
      const ref = await ensureTimetableDoc(classId, sessionName);
      docsSnap = { docs: [{ id: ref.id, data: () => getDoc(ref).data() }] };
      // NOTE: above pattern is for uniform processing below; but await cannot be used in object literal.
      // Simpler: resolve directly:
      const singleDocSnap = await getDoc(ref);
      docsSnap = { docs: [{ id: ref.id, data: () => singleDocSnap.data() }] };
    } else {
      // all classes in this session
      const qy = query(
        collection(db, "timetable"),
        where("sessionName", "==", sessionName),
        where("yearRange", "==", yearRange),
        where("term", "==", term)
      );
      docsSnap = await getDocs(qy);
    }

    const all = [];
    for (const d of docsSnap.docs) {
      const data = d.data();
      (data.sessions || []).forEach((s) => {
        if (!s.status || s.status === "active") {
          all.push({ classId: data.classId, ...s });
        }
      });
    }

    const conflicts = [];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i];
        const b = all[j];
        if (
          a.teacherId &&
          a.teacherId === b.teacherId &&
          a.date === b.date &&
          a.timeSlot === b.timeSlot
        ) {
          conflicts.push({
            type: "teacher_conflict",
            teacherId: a.teacherId,
            date: a.date,
            timeSlot: a.timeSlot,
            sessions: [a, b],
          });
        }
      }
    }
    return conflicts;
  } catch (err) {
    console.error("❌ checkTimetableConflictsInSession error:", err);
    throw err;
  }
};

// ==== Convenience queries (basic – scan + filter) ====

/**
 * Get teacher schedule by date (scans timetables in a sessionYearRange/term if provided; otherwise scans all)
 * For production-scale teacher queries, consider a secondary collection (timetable_sessions) for indexing.
 */
export const getTeacherScheduleByDate = async (
  teacherId,
  date,
  sessionName /* optional: narrow search */
) => {
  try {
    let docsSnap;
    if (sessionName) {
      const { term, yearRange } = parseSessionName(sessionName);
      const qy = query(
        collection(db, "timetable"),
        where("sessionName", "==", sessionName),
        where("yearRange", "==", yearRange),
        where("term", "==", term)
      );
      docsSnap = await getDocs(qy);
    } else {
      docsSnap = await getDocs(collection(db, "timetable"));
    }

    const matches = [];
    docsSnap.forEach((d) => {
      const data = d.data();
      (data.sessions || []).forEach((s) => {
        if (
          (!s.status || s.status === "active") &&
          s.teacherId === teacherId &&
          s.date === date
        ) {
          matches.push({
            classId: data.classId,
            sessionName: data.sessionName,
            ...s,
          });
        }
      });
    });

    matches.sort((a, b) => a.timeSlot - b.timeSlot);
    return matches;
  } catch (err) {
    console.error("❌ getTeacherScheduleByDate error:", err);
    throw err;
  }
};

export const getTeacherScheduleByDateRange = async (
  teacherId,
  startDate,
  endDate,
  sessionName /* optional */
) => {
  try {
    let docsSnap;
    if (sessionName) {
      const { term, yearRange } = parseSessionName(sessionName);
      const qy = query(
        collection(db, "timetable"),
        where("sessionName", "==", sessionName),
        where("yearRange", "==", yearRange),
        where("term", "==", term)
      );
      docsSnap = await getDocs(qy);
    } else {
      docsSnap = await getDocs(collection(db, "timetable"));
    }

    const inRange = (d) => d >= startDate && d <= endDate;

    const matches = [];
    docsSnap.forEach((d) => {
      const data = d.data();
      (data.sessions || []).forEach((s) => {
        if (
          (!s.status || s.status === "active") &&
          s.teacherId === teacherId &&
          inRange(s.date)
        ) {
          matches.push({
            classId: data.classId,
            sessionName: data.sessionName,
            ...s,
          });
        }
      });
    });

    matches.sort((a, b) => {
      if (a.date === b.date) return a.timeSlot - b.timeSlot;
      return new Date(a.date) - new Date(b.date);
    });

    return matches;
  } catch (err) {
    console.error("❌ getTeacherScheduleByDateRange error:", err);
    throw err;
  }
};

// Export for compatibility
export { TIME_SLOTS as timeSlots, DAYS_OF_WEEK as days };
