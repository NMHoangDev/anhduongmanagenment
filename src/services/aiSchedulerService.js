import * as timetableService from "./timetableService";
import * as subjectService from "./subjectService";
import * as teacherService from "./teacherService";
import * as classesService from "./classesService";

/**
 * AI Timetable Scheduler
 * Tự động tạo thời khóa biểu dựa trên các điều kiện và ràng buộc
 */

// Định nghĩa các tiết học trong tuần
const TIME_SLOTS = [
  {
    id: 1,
    label: "Tiết 1",
    startTime: "07:00",
    endTime: "07:45",
    period: "morning",
  },
  {
    id: 2,
    label: "Tiết 2",
    startTime: "07:45",
    endTime: "08:30",
    period: "morning",
  },
  {
    id: 3,
    label: "Tiết 3",
    startTime: "08:45",
    endTime: "09:30",
    period: "morning",
  },
  {
    id: 4,
    label: "Tiết 4",
    startTime: "09:30",
    endTime: "10:15",
    period: "morning",
  },
  {
    id: 5,
    label: "Tiết 5",
    startTime: "10:30",
    endTime: "11:15",
    period: "morning",
  },
  {
    id: 6,
    label: "Tiết 6",
    startTime: "11:15",
    endTime: "12:00",
    period: "morning",
  },
  {
    id: 7,
    label: "Tiết 7",
    startTime: "13:00",
    endTime: "13:45",
    period: "afternoon",
  },
  {
    id: 8,
    label: "Tiết 8",
    startTime: "13:45",
    endTime: "14:30",
    period: "afternoon",
  },
  {
    id: 9,
    label: "Tiết 9",
    startTime: "14:45",
    endTime: "15:30",
    period: "afternoon",
  },
  {
    id: 10,
    label: "Tiết 10",
    startTime: "15:30",
    endTime: "16:15",
    period: "afternoon",
  },
];

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Cấu hình ràng buộc cho AI scheduler
 */
const DEFAULT_CONSTRAINTS = {
  maxSessionsPerDay: 6,
  maxConsecutiveSessions: 3,
  preferredTimeSlots: {
    Toán: [1, 2, 3, 4], // Toán nên dạy vào buổi sáng
    Văn: [1, 2, 7, 8], // Văn có thể dạy sáng hoặc chiều
    "Thể dục": [9, 10], // Thể dục nên dạy cuối ngày
    "Âm nhạc": [7, 8, 9], // Âm nhạc nên dạy buổi chiều
    "Mỹ thuật": [7, 8, 9], // Mỹ thuật nên dạy buổi chiều
  },
  subjectFrequency: {
    Toán: 5, // 5 tiết/tuần
    Văn: 4, // 4 tiết/tuần
    "Tiếng Anh": 3,
    "Khoa học": 2,
    "Lịch sử": 2,
    "Địa lý": 2,
    "Thể dục": 2,
    "Âm nhạc": 1,
    "Mỹ thuật": 1,
  },
  teacherWorkload: {
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
    preferredBreaks: [5, 6], // Nghỉ giữa tiết 5 và 6
  },
};

/**
 * Kiểm tra xung đột lịch dạy của giáo viên
 */
const hasTeacherConflict = (
  schedule,
  teacherId,
  teacherName,
  day,
  timeSlot,
  excludeClassId = null
) => {
  for (const classId in schedule) {
    if (excludeClassId && classId === excludeClassId) continue;

    const daySchedule = schedule[classId]?.[day] || [];
    const conflict = daySchedule.find(
      (session) =>
        (session.teacherId === teacherId || session.teacher === teacherName) &&
        session.timeSlot === timeSlot &&
        session.subject // Chỉ kiểm tra session có môn học
    );

    if (conflict) return true;
  }
  return false;
};

/**
 * Tính điểm phù hợp cho việc xếp một tiết học
 */
const calculateFitnessScore = (
  subject,
  teacherId,
  teacherName,
  day,
  timeSlot,
  currentSchedule,
  classId,
  constraints = DEFAULT_CONSTRAINTS
) => {
  let score = 100;

  // Kiểm tra xung đột giáo viên
  if (
    hasTeacherConflict(
      currentSchedule,
      teacherId,
      teacherName,
      day,
      timeSlot,
      classId
    )
  ) {
    return 0; // Loại bỏ hoàn toàn nếu có xung đột
  }

  // Ưu tiên khung giờ phù hợp với môn học
  const preferredSlots = constraints.preferredTimeSlots[subject] || [];
  if (preferredSlots.includes(timeSlot)) {
    score += 20;
  } else if (preferredSlots.length > 0) {
    score -= 10; // Giảm điểm nếu không phải khung giờ ưu tiên
  }

  // Tránh xếp quá nhiều tiết liên tiếp
  const daySchedule = currentSchedule[classId]?.[day] || [];
  let consecutiveCount = 0;

  // Kiểm tra các tiết liền kề
  for (let i = timeSlot - 1; i >= 1; i--) {
    if (daySchedule.find((s) => s.timeSlot === i && s.subject)) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  for (let i = timeSlot + 1; i <= 10; i++) {
    if (daySchedule.find((s) => s.timeSlot === i && s.subject)) {
      consecutiveCount++;
    } else {
      break;
    }
  }

  if (consecutiveCount >= constraints.maxConsecutiveSessions) {
    score -= 20;
  }

  // Ưu tiên phân bố đều trong tuần
  const weeklySubjectCount = DAYS.reduce((count, d) => {
    const dSchedule = currentSchedule[classId]?.[d] || [];
    return count + dSchedule.filter((s) => s.subject === subject).length;
  }, 0);

  const targetFrequency = constraints.subjectFrequency[subject] || 1;
  if (weeklySubjectCount < targetFrequency) {
    score += 10;
  } else if (weeklySubjectCount >= targetFrequency) {
    score -= 15;
  }

  // Ưu tiên thời gian phù hợp (sáng/chiều)
  const timeSlotInfo = TIME_SLOTS.find((slot) => slot.id === timeSlot);
  if (timeSlotInfo) {
    if (subject === "Toán" && timeSlotInfo.period === "morning") {
      score += 15;
    }
    if (
      (subject === "Thể dục" || subject === "Âm nhạc") &&
      timeSlotInfo.period === "afternoon"
    ) {
      score += 10;
    }
  }

  return Math.max(0, score);
};

/**
 * Tạo thời khóa biểu tự động cho một lớp
 */
export const generateTimetableForClass = async (
  classId,
  weekId,
  options = {}
) => {
  try {
    const constraints = { ...DEFAULT_CONSTRAINTS, ...options.constraints };

    // Lấy dữ liệu cần thiết
    const [subjects, teachers, allClasses] = await Promise.all([
      subjectService.getSubjects(),
      teacherService.getTeachers(),
      classesService.getAllClasses(),
    ]);

    const classInfo = allClasses.find((c) => c.id === classId);
    if (!classInfo) {
      throw new Error("Không tìm thấy thông tin lớp học");
    }

    // Lấy thời khóa biểu hiện tại của tất cả lớp để kiểm tra xung đột
    const allTimetables = await timetableService.getAllTimetablesByWeek(weekId);

    // Tạo danh sách môn học cần xếp
    const subjectsToSchedule = [];
    for (const subject of subjects.filter((s) => s.isActive !== false)) {
      const frequency = constraints.subjectFrequency[subject.name] || 1;
      for (let i = 0; i < frequency; i++) {
        // Tìm giáo viên phù hợp
        const availableTeachers = teachers.filter(
          (t) =>
            t.subjects?.includes(subject.name) ||
            t.specialization === subject.name ||
            t.name === classInfo.homeroomTeacher // Giáo viên chủ nhiệm có thể dạy bất kỳ môn nào
        );

        if (availableTeachers.length > 0) {
          subjectsToSchedule.push({
            subject: subject.name,
            teacherId: availableTeachers[0].id, // Use teacherId instead of teacher name
            teacher: availableTeachers[0].name, // Keep name for backward compatibility
            id: `${subject.name}_${i}`,
          });
        }
      }
    }

    // Khởi tạo thời khóa biểu trống
    const newSchedule = {};
    DAYS.forEach((day) => {
      newSchedule[day] = [];
    });

    // Thuật toán genetic/greedy để xếp lịch
    const schedule = await scheduleSubjectsOptimized(
      subjectsToSchedule,
      newSchedule,
      allTimetables,
      classId,
      constraints
    );

    // Lưu thời khóa biểu mới với overwrite = true để đảm bảo ghi đè hoàn toàn
    await timetableService.saveTimetable(classId, weekId, schedule, true);

    return {
      success: true,
      schedule,
      stats: generateScheduleStats(schedule, subjectsToSchedule),
    };
  } catch (error) {
    console.error("Error generating timetable:", error);
    throw new Error(`Không thể tạo thời khóa biểu: ${error.message}`);
  }
};

/**
 * Thuật toán tối ưu để xếp lịch các môn học
 */
const scheduleSubjectsOptimized = async (
  subjectsToSchedule,
  initialSchedule,
  allTimetables,
  classId,
  constraints
) => {
  const schedule = JSON.parse(JSON.stringify(initialSchedule));
  const unscheduledSubjects = [...subjectsToSchedule];

  // Sắp xếp theo độ ưu tiên (môn khó trước)
  unscheduledSubjects.sort((a, b) => {
    const freqA = constraints.subjectFrequency[a.subject] || 1;
    const freqB = constraints.subjectFrequency[b.subject] || 1;
    return freqB - freqA; // Môn có nhiều tiết/tuần được ưu tiên
  });

  for (const subjectInfo of unscheduledSubjects) {
    let bestSlot = null;
    let bestScore = 0;

    // Thử tất cả các khung giờ có thể
    for (const day of DAYS) {
      for (const timeSlot of TIME_SLOTS) {
        // Kiểm tra xem slot này đã được sử dụng chưa
        const existingSession = schedule[day].find(
          (s) => s.timeSlot === timeSlot.id
        );
        if (existingSession && existingSession.subject) {
          continue; // Slot đã được sử dụng
        }

        const score = calculateFitnessScore(
          subjectInfo.subject,
          subjectInfo.teacherId,
          subjectInfo.teacher,
          day,
          timeSlot.id,
          allTimetables,
          classId,
          constraints
        );

        if (score > bestScore) {
          bestScore = score;
          bestSlot = { day, timeSlot: timeSlot.id, timeSlotInfo: timeSlot };
        }
      }
    }

    // Xếp môn học vào slot tốt nhất
    if (bestSlot && bestScore > 0) {
      schedule[bestSlot.day].push({
        subject: subjectInfo.subject,
        teacher: subjectInfo.teacher,
        timeSlot: bestSlot.timeSlot,
        startTime: bestSlot.timeSlotInfo.startTime,
        endTime: bestSlot.timeSlotInfo.endTime,
        room: "", // Sẽ được cập nhật sau
        note: `Tự động tạo bởi AI`,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      });

      // Cập nhật allTimetables để tránh xung đột cho các môn tiếp theo
      if (!allTimetables[classId]) {
        allTimetables[classId] = {};
      }
      if (!allTimetables[classId][bestSlot.day]) {
        allTimetables[classId][bestSlot.day] = [];
      }
      allTimetables[classId][bestSlot.day].push(
        schedule[bestSlot.day][schedule[bestSlot.day].length - 1]
      );
    }
  }

  // Sắp xếp lại theo timeSlot
  DAYS.forEach((day) => {
    schedule[day].sort((a, b) => (a.timeSlot || 0) - (b.timeSlot || 0));
  });

  return schedule;
};

/**
 * Tạo thống kê thời khóa biểu
 */
const generateScheduleStats = (schedule, subjectsToSchedule) => {
  const stats = {
    totalSessions: 0,
    scheduledSessions: 0,
    unscheduledSubjects: [],
    subjectDistribution: {},
    dailyLoad: {},
  };

  // Đếm số tiết đã xếp
  DAYS.forEach((day) => {
    const daySchedule = schedule[day] || [];
    const sessionsInDay = daySchedule.filter((s) => s.subject).length;
    stats.dailyLoad[day] = sessionsInDay;
    stats.scheduledSessions += sessionsInDay;
  });

  stats.totalSessions = subjectsToSchedule.length;

  // Phân bố môn học
  subjectsToSchedule.forEach((subject) => {
    const subjectName = subject.subject;
    if (!stats.subjectDistribution[subjectName]) {
      stats.subjectDistribution[subjectName] = { scheduled: 0, total: 0 };
    }
    stats.subjectDistribution[subjectName].total++;
  });

  DAYS.forEach((day) => {
    const daySchedule = schedule[day] || [];
    daySchedule.forEach((session) => {
      if (session.subject && stats.subjectDistribution[session.subject]) {
        stats.subjectDistribution[session.subject].scheduled++;
      }
    });
  });

  // Tìm môn chưa được xếp đủ
  Object.keys(stats.subjectDistribution).forEach((subject) => {
    const dist = stats.subjectDistribution[subject];
    if (dist.scheduled < dist.total) {
      stats.unscheduledSubjects.push({
        subject,
        missing: dist.total - dist.scheduled,
      });
    }
  });

  return stats;
};

/**
 * Tạo thời khóa biểu cho tất cả lớp
 */
export const generateTimetableForAllClasses = async (weekId, options = {}) => {
  try {
    const classes = await classesService.getAllClasses();
    const results = [];

    for (const classInfo of classes) {
      try {
        const result = await generateTimetableForClass(
          classInfo.id,
          weekId,
          options
        );
        results.push({
          classId: classInfo.id,
          className: classInfo.name,
          ...result,
        });
      } catch (error) {
        results.push({
          classId: classInfo.id,
          className: classInfo.name,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error generating timetables for all classes:", error);
    throw error;
  }
};

/**
 * Tối ưu hóa thời khóa biểu hiện có
 */
export const optimizeExistingTimetable = async (classId, weekId) => {
  try {
    const currentTimetable = await timetableService.getTimetableByClassAndWeek(
      classId,
      weekId
    );

    // Phân tích thời khóa biểu hiện có
    const analysis = analyzeTimetable(currentTimetable.schedule);

    // Đề xuất cải thiện
    const suggestions = generateOptimizationSuggestions(analysis);

    return {
      analysis,
      suggestions,
      canOptimize: suggestions.length > 0,
    };
  } catch (error) {
    console.error("Error optimizing timetable:", error);
    throw error;
  }
};

/**
 * Phân tích thời khóa biểu
 */
const analyzeTimetable = (schedule) => {
  const analysis = {
    conflicts: [],
    suggestions: [],
    utilization: {},
    balance: {},
  };

  // Kiểm tra các vấn đề
  DAYS.forEach((day) => {
    const daySchedule = schedule[day] || [];

    // Kiểm tra tải trọng ngày
    const sessionsCount = daySchedule.filter((s) => s.subject).length;
    analysis.utilization[day] = sessionsCount;

    // Kiểm tra tiết liên tiếp
    let consecutiveCount = 0;
    let maxConsecutive = 0;

    for (let i = 1; i <= 10; i++) {
      const session = daySchedule.find((s) => s.timeSlot === i);
      if (session && session.subject) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        consecutiveCount = 0;
      }
    }

    if (maxConsecutive > 4) {
      analysis.conflicts.push({
        type: "too_many_consecutive",
        day,
        count: maxConsecutive,
      });
    }
  });

  return analysis;
};

/**
 * Tạo đề xuất tối ưu hóa
 */
const generateOptimizationSuggestions = (analysis) => {
  const suggestions = [];

  analysis.conflicts.forEach((conflict) => {
    switch (conflict.type) {
      case "too_many_consecutive":
        suggestions.push({
          type: "redistribute_sessions",
          priority: "high",
          description: `Ngày ${conflict.day}: Có quá nhiều tiết liên tiếp (${conflict.count}). Nên phân bố lại để có thời gian nghỉ.`,
          day: conflict.day,
        });
        break;
      default:
        // Xử lý các loại conflict khác
        break;
    }
  });

  return suggestions;
};

const aiSchedulerService = {
  generateTimetableForClass,
  generateTimetableForAllClasses,
  optimizeExistingTimetable,
  TIME_SLOTS,
  DEFAULT_CONSTRAINTS,
};

export default aiSchedulerService;
