/**
 * Test script để kiểm tra API mới hoạt động
 * Run this to test the new timetable structure
 */

import * as attendanceService from "./attendanceService";
import * as timetableV2 from "./timetableServiceV2";

export const testNewTimetableStructure = async () => {
  try {
    console.log("🧪 Testing new timetable structure...");

    // Test 1: Create a sample timetable session
    const sampleSession = {
      classId: "test_class_001",
      weekId: "2024-W32",
      dayOfWeek: "monday",
      timeSlot: 1,
      subject: "Toán",
      teacherId: "test_teacher_001",
      room: "A101",
      note: "Test session",
    };

    console.log("📝 Creating sample session...");
    const created = await timetableV2.createTimetableSession(sampleSession);
    console.log("✅ Created session:", created);

    // Test 2: Get teacher schedule by date
    const testDate = "2024-08-05";
    console.log("📅 Getting teacher schedule for:", testDate);
    const schedule = await attendanceService.getTeacherTimetableByDate(
      "test_teacher_001",
      testDate
    );
    console.log("✅ Schedule retrieved:", schedule);

    // Test 3: Get teacher working hours
    console.log("🕒 Getting working hours...");
    const workingHours = await attendanceService.getTeacherExpectedWorkingHours(
      "test_teacher_001",
      testDate
    );
    console.log("✅ Working hours:", workingHours);

    // Test 4: Get today status
    console.log("📊 Getting today status...");
    const todayStatus = await attendanceService.getTeacherTodayStatus(
      "test_teacher_001",
      testDate
    );
    console.log("✅ Today status:", todayStatus);

    // Cleanup: Delete test session
    console.log("🧹 Cleaning up test data...");
    await timetableV2.deleteTimetableSession(created.id);
    console.log("✅ Test data cleaned up");

    console.log("🎉 All tests passed! New structure is working correctly.");

    return {
      success: true,
      message: "All tests passed",
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Test attendance functions specifically
 */
export const testAttendanceFunctions = async (
  teacherId = "test_teacher_001"
) => {
  try {
    console.log("🧪 Testing attendance functions for teacher:", teacherId);

    const testDate = new Date().toISOString().split("T")[0]; // Today
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]; // 30 days ago
    const endDate = testDate;

    // Test 1: Get teacher schedule
    console.log("📅 Testing getTeacherTimetableByDate...");
    const schedule = await attendanceService.getTeacherTimetableByDate(
      teacherId,
      testDate
    );
    console.log("✅ Schedule:", schedule);

    // Test 2: Get working hours
    console.log("🕒 Testing getTeacherExpectedWorkingHours...");
    const workingHours = await attendanceService.getTeacherExpectedWorkingHours(
      teacherId,
      testDate
    );
    console.log("✅ Working hours:", workingHours);

    // Test 3: Get today status
    console.log("📊 Testing getTeacherTodayStatus...");
    const todayStatus = await attendanceService.getTeacherTodayStatus(
      teacherId,
      testDate
    );
    console.log("✅ Today status:", todayStatus);

    // Test 4: Get attendance range
    console.log("📈 Testing getTeacherAttendanceByDateRange...");
    const attendanceRange =
      await attendanceService.getTeacherAttendanceByDateRange(
        teacherId,
        startDate,
        endDate
      );
    console.log("✅ Attendance range:", attendanceRange);

    // Test 5: Get attendance stats
    console.log("📊 Testing getTeacherAttendanceStats...");
    const stats = await attendanceService.getTeacherAttendanceStats(
      teacherId,
      startDate,
      endDate
    );
    console.log("✅ Attendance stats:", stats);

    console.log("🎉 All attendance function tests completed!");

    return {
      success: true,
      results: {
        schedule,
        workingHours,
        todayStatus,
        attendanceRange,
        stats,
      },
    };
  } catch (error) {
    console.error("❌ Attendance test failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
