/**
 * Script để sửa lỗi teacherId trong timetable_sessions collection
 * Chuyển đổi teacherId từ tên sang ID thực
 */

import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import * as teacherService from "./teacherService";

export const fixTeacherIds = async () => {
  try {
    console.log("🔧 Starting teacherId fix process...");

    // Get all teachers first
    const teachers = await teacherService.getTeachers();
    console.log(
      `📚 Loaded ${teachers.length} teachers:`,
      teachers.map((t) => ({ id: t.id, name: t.name }))
    );

    // Get all timetable sessions
    const sessionsCollection = collection(db, "timetable_sessions");
    const sessionsSnapshot = await getDocs(sessionsCollection);

    let fixedCount = 0;
    let totalCount = 0;

    console.log(
      `📊 Found ${sessionsSnapshot.docs.length} timetable sessions to check`
    );

    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionData = sessionDoc.data();
      totalCount++;

      // Check if teacherId looks like a name instead of an ID
      if (sessionData.teacherId) {
        const currentTeacherId = sessionData.teacherId;

        // Try to find teacher by current teacherId (check if it's already a valid ID)
        const teacherById = teachers.find((t) => t.id === currentTeacherId);

        if (!teacherById) {
          // Current teacherId is not a valid ID, try to find by name
          const teacherByName = teachers.find(
            (t) => t.name === currentTeacherId
          );

          if (teacherByName) {
            // Found teacher by name, update with correct ID
            console.log(
              `🔧 Fixing session ${sessionDoc.id}: "${currentTeacherId}" → "${teacherByName.id}" (${teacherByName.name})`
            );

            await updateDoc(doc(db, "timetable_sessions", sessionDoc.id), {
              teacherId: teacherByName.id,
              // Keep the old value as backup
              originalTeacherName: currentTeacherId,
              fixedAt: new Date().toISOString(),
            });

            fixedCount++;
          } else {
            console.warn(
              `⚠️ Session ${sessionDoc.id}: Cannot find teacher "${currentTeacherId}"`
            );
          }
        } else {
          console.log(
            `✅ Session ${sessionDoc.id}: teacherId "${currentTeacherId}" is already valid`
          );
        }
      }
    }

    const result = {
      success: true,
      totalChecked: totalCount,
      fixedSessions: fixedCount,
      message: `Checked ${totalCount} sessions, fixed ${fixedCount} teacherId references`,
    };

    console.log("✅ TeacherId fix completed:", result);
    return result;
  } catch (error) {
    console.error("❌ Error fixing teacherIds:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to fix teacherId references",
    };
  }
};
