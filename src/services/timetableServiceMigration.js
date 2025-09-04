/**
 * Migration từ cấu trúc cũ sang cấu trúc mới
 * File này sẽ wrapper các function cũ để tương thích với UI hiện tại
 */

import * as timetableV2 from "./timetableService";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

// Re-export tất cả functions mới
export * from "./timetableService";

/**
 * Wrapper function để tương thích với handleSaveSession hiện tại
 */
export const updateSessionInTimetable = async (
  classId,
  weekId,
  day,
  timeSlotId,
  sessionData
) => {
  try {
    console.log(
      "📝 Legacy updateSessionInTimetable called, converting to V2..."
    );

    // Convert legacy format to new format
    const newSessionData = {
      classId,
      weekId,
      dayOfWeek: day,
      timeSlot: timeSlotId,
      subject: sessionData.subject,
      teacherId: sessionData.teacherId,
      room: sessionData.room,
      note: sessionData.note,
    };

    // Check if this is an update (existing session) or create new
    // For now, we'll always create new since we don't have sessionId from legacy call
    const result = await timetableV2.createTimetableSession(newSessionData);

    console.log("✅ Legacy updateSessionInTimetable completed via V2");
    return result;
  } catch (error) {
    console.error("❌ Error in legacy updateSessionInTimetable:", error);
    throw error;
  }
};

/**
 * Wrapper function để tương thích với handleDeleteSession hiện tại
 */
export const deleteSessionFromTimetable = async (
  classId,
  weekId,
  day,
  timeSlotId
) => {
  try {
    console.log(
      "🗑️ Legacy deleteSessionFromTimetable called, converting to V2..."
    );

    // Find the session to delete by querying the new collection
    const q = query(
      collection(db, "timetable_sessions"),
      where("classId", "==", classId),
      where("weekId", "==", weekId),
      where("dayOfWeek", "==", day),
      where("timeSlot", "==", timeSlotId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Delete all matching sessions (should be only one)
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(timetableV2.deleteTimetableSession(doc.id));
      });

      await Promise.all(deletePromises);
      console.log("✅ Legacy deleteSessionFromTimetable completed via V2");
    } else {
      console.log("⚠️ Session not found for deletion");
    }

    return true;
  } catch (error) {
    console.error("❌ Error in legacy deleteSessionFromTimetable:", error);
    throw error;
  }
};

/**
 * Wrapper cho saveTimetable (batch save) - chuyển đổi sang create individual sessions
 */
export const saveTimetable = async (
  classId,
  weekId,
  schedule,
  overwrite = false
) => {
  try {
    console.log("💾 Legacy saveTimetable called, converting to V2...");

    if (overwrite) {
      // Clear existing sessions first
      await timetableV2.clearTimetableForClass(classId, weekId);
    }

    const createPromises = [];

    // Convert schedule object to individual session documents
    Object.keys(schedule).forEach((dayOfWeek) => {
      if (schedule[dayOfWeek] && Array.isArray(schedule[dayOfWeek])) {
        schedule[dayOfWeek].forEach((session) => {
          const sessionData = {
            classId,
            weekId,
            dayOfWeek,
            timeSlot: session.timeSlot,
            subject: session.subject,
            teacherId: session.teacherId || session.teacher, // Support both formats
            room: session.room,
            note: session.note,
          };

          createPromises.push(timetableV2.createTimetableSession(sessionData));
        });
      }
    });

    await Promise.all(createPromises);

    console.log("✅ Legacy saveTimetable completed via V2:", {
      classId,
      weekId,
      sessionsCreated: createPromises.length,
    });

    return { success: true, sessionsCreated: createPromises.length };
  } catch (error) {
    console.error("❌ Error in legacy saveTimetable:", error);
    throw error;
  }
};
