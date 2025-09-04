/**
 * Script migration để chuyển dữ liệu từ cấu trúc timetable cũ sang cấu trúc mới
 * Chỉ chạy 1 lần để migrate data
 */

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import * as timetableV2 from "./timetableServiceV2";

export const migrateTimetableData = async () => {
  try {
    console.log("🔄 Starting timetable data migration...");

    // Get all classes
    const classesSnapshot = await getDocs(collection(db, "classes"));
    const migrationResults = [];

    for (const classDoc of classesSnapshot.docs) {
      const classId = classDoc.id;
      const className = classDoc.data().name;

      console.log(`📚 Processing class: ${className} (${classId})`);

      // Get all timetable weeks for this class
      const timetableCollection = collection(
        db,
        `classes/${classId}/timetable`
      );
      const timetableSnapshot = await getDocs(timetableCollection);

      for (const timetableDoc of timetableSnapshot.docs) {
        const weekId = timetableDoc.id;
        const timetableData = timetableDoc.data();

        console.log(`📅 Processing week: ${weekId} for class: ${className}`);

        if (timetableData.schedule) {
          const schedule = timetableData.schedule;
          let sessionCount = 0;

          // Process each day
          for (const [dayOfWeek, sessions] of Object.entries(schedule)) {
            if (Array.isArray(sessions)) {
              for (const session of sessions) {
                try {
                  const sessionData = {
                    classId,
                    weekId,
                    dayOfWeek,
                    timeSlot: session.timeSlot,
                    subject: session.subject || "",
                    teacherId: session.teacherId || session.teacher || "",
                    room: session.room || "",
                    note: session.note || "",
                  };

                  await timetableV2.createTimetableSession(sessionData);
                  sessionCount++;
                } catch (error) {
                  console.error(`❌ Error migrating session:`, error);
                }
              }
            }
          }

          migrationResults.push({
            classId,
            className,
            weekId,
            sessionsCreated: sessionCount,
          });

          console.log(
            `✅ Migrated ${sessionCount} sessions for ${className} - ${weekId}`
          );
        }
      }
    }

    console.log("🎉 Migration completed successfully!");
    console.log("📊 Migration summary:", migrationResults);

    return {
      success: true,
      results: migrationResults,
      totalSessions: migrationResults.reduce(
        (sum, result) => sum + result.sessionsCreated,
        0
      ),
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

/**
 * Kiểm tra dữ liệu đã được migrate chưa
 */
export const checkMigrationStatus = async () => {
  try {
    const sessionsSnapshot = await getDocs(
      collection(db, "timetable_sessions")
    );
    const sessionCount = sessionsSnapshot.docs.length;

    console.log(`📊 Found ${sessionCount} sessions in new format`);

    return {
      hasMigratedData: sessionCount > 0,
      sessionCount,
    };
  } catch (error) {
    console.error("❌ Error checking migration status:", error);
    return {
      hasMigratedData: false,
      sessionCount: 0,
    };
  }
};
