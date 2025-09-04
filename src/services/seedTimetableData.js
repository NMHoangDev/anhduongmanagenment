import { db } from "./firebase";
import { doc, writeBatch } from "firebase/firestore";
import * as timetableService from "./timetableService";

/**
 * Dữ liệu mẫu cho thời khóa biểu
 */

// Dữ liệu môn học mẫu
const SAMPLE_SUBJECTS = [
  {
    id: "math",
    name: "Toán",
    code: "TOAN",
    gradeLevel: [1, 2, 3, 4, 5],
    isActive: true,
  },
  {
    id: "literature",
    name: "Tiếng Việt",
    code: "VAN",
    gradeLevel: [1, 2, 3, 4, 5],
    isActive: true,
  },
  {
    id: "english",
    name: "Tiếng Anh",
    code: "ENG",
    gradeLevel: [3, 4, 5],
    isActive: true,
  },
  {
    id: "science",
    name: "Khoa học",
    code: "KH",
    gradeLevel: [3, 4, 5],
    isActive: true,
  },
  {
    id: "history",
    name: "Lịch sử và Địa lý",
    code: "SU-DL",
    gradeLevel: [4, 5],
    isActive: true,
  },
  {
    id: "civic",
    name: "Đạo đức",
    code: "DD",
    gradeLevel: [1, 2, 3, 4, 5],
    isActive: true,
  },
  {
    id: "pe",
    name: "Thể dục",
    code: "TD",
    gradeLevel: [1, 2, 3, 4, 5],
    isActive: true,
  },
  {
    id: "music",
    name: "Âm nhạc",
    code: "AN",
    gradeLevel: [1, 2, 3, 4, 5],
    isActive: true,
  },
  {
    id: "art",
    name: "Mỹ thuật",
    code: "MT",
    gradeLevel: [1, 2, 3, 4, 5],
    isActive: true,
  },
  {
    id: "handicraft",
    name: "Kỹ thuật",
    code: "KT",
    gradeLevel: [4, 5],
    isActive: true,
  },
  {
    id: "info",
    name: "Tin học",
    code: "TH",
    gradeLevel: [3, 4, 5],
    isActive: true,
  },
  {
    id: "nature",
    name: "Tự nhiên và xã hội",
    code: "TNXH",
    gradeLevel: [1, 2],
    isActive: true,
  },
];

// Dữ liệu giáo viên mẫu
const SAMPLE_TEACHERS = [
  {
    id: "teacher1",
    name: "Nguyễn Thị Mai",
    subjects: ["Toán"],
    specialization: "Toán",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher2",
    name: "Trần Văn Nam",
    subjects: ["Văn"],
    specialization: "Văn",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher3",
    name: "Lê Thị Hoa",
    subjects: ["Tiếng Anh"],
    specialization: "Tiếng Anh",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher4",
    name: "Phạm Minh Đức",
    subjects: ["Vật lý"],
    specialization: "Vật lý",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher5",
    name: "Hoàng Thị Lan",
    subjects: ["Hóa học"],
    specialization: "Hóa học",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher6",
    name: "Vũ Văn Hùng",
    subjects: ["Sinh học"],
    specialization: "Sinh học",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher7",
    name: "Đặng Thị Nga",
    subjects: ["Lịch sử"],
    specialization: "Lịch sử",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher8",
    name: "Bùi Minh Tuấn",
    subjects: ["Địa lý"],
    specialization: "Địa lý",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher9",
    name: "Ngô Thị Dung",
    subjects: ["GDCD"],
    specialization: "GDCD",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher10",
    name: "Lý Văn Cường",
    subjects: ["Thể dục"],
    specialization: "Thể dục",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher11",
    name: "Trịnh Thị Thu",
    subjects: ["Âm nhạc"],
    specialization: "Âm nhạc",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
  {
    id: "teacher12",
    name: "Đinh Văn Sơn",
    subjects: ["Mỹ thuật"],
    specialization: "Mỹ thuật",
    maxSessionsPerDay: 6,
    maxSessionsPerWeek: 25,
  },
];

// Lớp học mẫu
const SAMPLE_CLASSES = [
  { id: "class_1a", name: "1A", grade: 1, homeroomTeacher: "Nguyễn Thị Mai" },
  { id: "class_1b", name: "1B", grade: 1, homeroomTeacher: "Trần Văn Nam" },
  { id: "class_2a", name: "2A", grade: 2, homeroomTeacher: "Lê Thị Hoa" },
  { id: "class_2b", name: "2B", grade: 2, homeroomTeacher: "Phạm Minh Đức" },
  { id: "class_3a", name: "3A", grade: 3, homeroomTeacher: "Hoàng Thị Lan" },
  { id: "class_3b", name: "3B", grade: 3, homeroomTeacher: "Vũ Văn Hùng" },
  { id: "class_4a", name: "4A", grade: 4, homeroomTeacher: "Đặng Thị Nga" },
  { id: "class_4b", name: "4B", grade: 4, homeroomTeacher: "Bùi Minh Tuấn" },
  { id: "class_5a", name: "5A", grade: 5, homeroomTeacher: "Lý Thị Kim" },
  { id: "class_5b", name: "5B", grade: 5, homeroomTeacher: "Võ Văn Tài" },
];

// Thời khóa biểu mẫu cho lớp 3A
const SAMPLE_TIMETABLE_3A = {
  monday: [
    {
      timeSlot: 1,
      subject: "Tiếng Việt",
      teacher: "Nguyễn Thị Mai",
      startTime: "07:00",
      endTime: "07:45",
      room: "A101",
      note: "Học chữ cái và từ vựng",
    },
    {
      timeSlot: 2,
      subject: "Toán",
      teacher: "Hoàng Thị Lan",
      startTime: "07:45",
      endTime: "08:30",
      room: "A101",
      note: "Phép cộng trong phạm vi 100",
    },
    {
      timeSlot: 3,
      subject: "Tiếng Anh",
      teacher: "Lê Thị Hoa",
      startTime: "08:45",
      endTime: "09:30",
      room: "A101",
      note: "Học bảng chữ cái và số đếm",
    },
    {
      timeSlot: 4,
      subject: "Tự nhiên và xã hội",
      teacher: "Vũ Văn Hùng",
      startTime: "09:30",
      endTime: "10:15",
      room: "A101",
      note: "Khám phá thiên nhiên",
    },
    {
      timeSlot: 7,
      subject: "Thể dục",
      teacher: "Lý Văn Cường",
      startTime: "13:00",
      endTime: "13:45",
      room: "Sân trường",
      note: "Trò chơi vận động",
    },
  ],
  tuesday: [
    {
      timeSlot: 1,
      subject: "Tiếng Việt",
      teacher: "Nguyễn Thị Mai",
      startTime: "07:00",
      endTime: "07:45",
      room: "A101",
      note: "Luyện viết chữ đẹp",
    },
    {
      timeSlot: 2,
      subject: "Toán",
      teacher: "Hoàng Thị Lan",
      startTime: "07:45",
      endTime: "08:30",
      room: "A101",
      note: "Phép trừ trong phạm vi 100",
    },
    {
      timeSlot: 3,
      subject: "Đạo đức",
      teacher: "Đặng Thị Nga",
      startTime: "08:45",
      endTime: "09:30",
      room: "A101",
      note: "Kính trọng thầy cô",
    },
    {
      timeSlot: 4,
      subject: "Âm nhạc",
      teacher: "Bùi Minh Tuấn",
      startTime: "09:30",
      endTime: "10:15",
      room: "Phòng nhạc",
      note: "Học hát dân ca",
    },
    {
      timeSlot: 8,
      subject: "Mỹ thuật",
      teacher: "Trịnh Thị Thu",
      startTime: "13:45",
      endTime: "14:30",
      room: "Phòng vẽ",
      note: "Vẽ tranh thiên nhiên",
    },
  ],
  wednesday: [
    {
      timeSlot: 1,
      subject: "Tiếng Anh",
      teacher: "Lê Thị Hoa",
      startTime: "07:00",
      endTime: "07:45",
      room: "A101",
      note: "Học từ vựng về gia đình",
    },
    {
      timeSlot: 2,
      subject: "Toán",
      teacher: "Hoàng Thị Lan",
      startTime: "07:45",
      endTime: "08:30",
      room: "A101",
      note: "Giải bài tập",
    },
    {
      timeSlot: 3,
      subject: "Tiếng Việt",
      teacher: "Nguyễn Thị Mai",
      startTime: "08:45",
      endTime: "09:30",
      room: "A101",
      note: "Đọc hiểu đoạn văn",
    },
    {
      timeSlot: 4,
      subject: "Đạo đức",
      teacher: "Ngô Thị Dung",
      startTime: "09:30",
      endTime: "10:15",
      room: "A101",
      note: "Yêu quý gia đình",
    },
    {
      timeSlot: 9,
      subject: "Mỹ thuật",
      teacher: "Đinh Văn Sơn",
      startTime: "14:45",
      endTime: "15:30",
      room: "Phòng vẽ",
      note: "Vẽ tranh gia đình",
    },
  ],
  thursday: [
    {
      timeSlot: 1,
      subject: "Toán",
      teacher: "Hoàng Thị Lan",
      startTime: "07:00",
      endTime: "07:45",
      room: "A101",
      note: "Nhân chia trong phạm vi 100",
    },
    {
      timeSlot: 2,
      subject: "Tự nhiên và xã hội",
      teacher: "Vũ Văn Hùng",
      startTime: "07:45",
      endTime: "08:30",
      room: "A101",
      note: "Quan sát động vật",
    },
    {
      timeSlot: 3,
      subject: "Văn",
      teacher: "Trần Văn Nam",
      startTime: "08:45",
      endTime: "09:30",
      room: "A101",
      note: "Đọc hiểu văn bản",
    },
    {
      timeSlot: 4,
      subject: "Tiếng Anh",
      teacher: "Lê Thị Hoa",
      startTime: "09:30",
      endTime: "10:15",
      room: "A101",
      note: "Speaking practice",
    },
    {
      timeSlot: 7,
      subject: "Tin học",
      teacher: "Phạm Minh Đức",
      startTime: "13:00",
      endTime: "13:45",
      room: "Lab máy tính",
      note: "Làm quen với máy tính",
    },
  ],
  friday: [
    {
      timeSlot: 1,
      subject: "Văn",
      teacher: "Trần Văn Nam",
      startTime: "07:00",
      endTime: "07:45",
      room: "A101",
      note: "Ôn tập cuối tuần",
    },
    {
      timeSlot: 2,
      subject: "Toán",
      teacher: "Nguyễn Thị Mai",
      startTime: "07:45",
      endTime: "08:30",
      room: "A101",
      note: "Bài tập về nhà",
    },
    {
      timeSlot: 3,
      subject: "Lịch sử",
      teacher: "Đặng Thị Nga",
      startTime: "08:45",
      endTime: "09:30",
      room: "A101",
      note: "Ôn tập bài cũ",
    },
    {
      timeSlot: 7,
      subject: "Thể dục",
      teacher: "Lý Văn Cường",
      startTime: "13:00",
      endTime: "13:45",
      room: "Sân trường",
      note: "Bóng đá và bóng chuyền",
    },
    {
      timeSlot: 8,
      subject: "Sinh hoạt lớp",
      teacher: "Nguyễn Thị Mai",
      startTime: "13:45",
      endTime: "14:30",
      room: "A101",
      note: "Họp lớp cuối tuần",
    },
  ],
  saturday: [
    {
      timeSlot: 1,
      subject: "Ôn tập",
      teacher: "Nguyễn Thị Mai",
      startTime: "07:00",
      endTime: "07:45",
      room: "A101",
      note: "Ôn tập toán",
    },
    {
      timeSlot: 2,
      subject: "Ôn tập",
      teacher: "Trần Văn Nam",
      startTime: "07:45",
      endTime: "08:30",
      room: "A101",
      note: "Ôn tập văn",
    },
    {
      timeSlot: 3,
      subject: "Hoạt động ngoại khóa",
      teacher: "Lê Thị Hoa",
      startTime: "08:45",
      endTime: "09:30",
      room: "Sân trường",
      note: "Các hoạt động vui chơi",
    },
  ],
};

/**
 * Tạo dữ liệu mẫu cho môn học
 */
export const seedSubjects = async () => {
  try {
    const batch = writeBatch(db);

    for (const subject of SAMPLE_SUBJECTS) {
      const subjectRef = doc(db, "subjects", subject.id);
      batch.set(subjectRef, {
        ...subject,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
    console.log("✅ Đã tạo dữ liệu mẫu cho môn học");
    return { success: true, count: SAMPLE_SUBJECTS.length };
  } catch (error) {
    console.error("❌ Lỗi khi tạo dữ liệu môn học:", error);
    throw error;
  }
};

/**
 * Tạo dữ liệu mẫu cho giáo viên
 */
export const seedTeachers = async () => {
  try {
    const batch = writeBatch(db);

    for (const teacher of SAMPLE_TEACHERS) {
      const teacherRef = doc(db, "teachers", teacher.id);
      batch.set(teacherRef, {
        ...teacher,
        email: `${teacher.id}@school.edu.vn`,
        phone: `0${Math.floor(Math.random() * 900000000) + 100000000}`,
        address: "Hà Nội",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
    console.log("✅ Đã tạo dữ liệu mẫu cho giáo viên");
    return { success: true, count: SAMPLE_TEACHERS.length };
  } catch (error) {
    console.error("❌ Lỗi khi tạo dữ liệu giáo viên:", error);
    throw error;
  }
};

/**
 * Tạo dữ liệu mẫu cho lớp học
 */
export const seedClasses = async () => {
  try {
    const batch = writeBatch(db);

    for (const classInfo of SAMPLE_CLASSES) {
      const classRef = doc(db, "classes", classInfo.id);
      batch.set(classRef, {
        ...classInfo,
        studentCount: Math.floor(Math.random() * 10) + 25, // 25-35 học sinh
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
    console.log("✅ Đã tạo dữ liệu mẫu cho lớp học");
    return { success: true, count: SAMPLE_CLASSES.length };
  } catch (error) {
    console.error("❌ Lỗi khi tạo dữ liệu lớp học:", error);
    throw error;
  }
};

/**
 * Tạo dữ liệu mẫu cho thời khóa biểu
 */
export const seedTimetables = async () => {
  try {
    const currentDate = new Date();
    const weekId = timetableService.getWeekId(currentDate);

    // Tạo thời khóa biểu cho tất cả lớp
    const results = [];

    for (const classInfo of SAMPLE_CLASSES) {
      // Tạo thời khóa biểu cơ bản cho từng lớp
      let timetable;

      if (classInfo.id === "class_3a") {
        // Dùng thời khóa biểu mẫu chi tiết cho lớp 3A
        timetable = SAMPLE_TIMETABLE_3A;
      } else {
        // Tạo thời khóa biểu đơn giản cho các lớp khác
        timetable = generateBasicTimetable(classInfo);
      }

      // Thêm timestamp cho tất cả sessions
      Object.keys(timetable).forEach((day) => {
        timetable[day].forEach((session) => {
          session.createdAt = new Date().toISOString();
          session.lastModified = new Date().toISOString();
        });
      });

      await timetableService.saveTimetable(classInfo.id, weekId, timetable);

      results.push({
        classId: classInfo.id,
        className: classInfo.name,
        weekId,
        success: true,
      });
    }

    console.log("✅ Đã tạo thời khóa biểu mẫu cho tất cả lớp");
    return { success: true, results };
  } catch (error) {
    console.error("❌ Lỗi khi tạo thời khóa biểu:", error);
    throw error;
  }
};

/**
 * Tạo thời khóa biểu cơ bản cho một lớp
 */
const generateBasicTimetable = (classInfo) => {
  const timetable = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
  };

  // Lịch trình cơ bản cho các lớp tiểu học
  const basicSchedule = [
    {
      day: "monday",
      sessions: [
        { timeSlot: 1, subject: "Tiếng Việt", teacher: "Nguyễn Thị Mai" },
        { timeSlot: 2, subject: "Toán", teacher: "Hoàng Thị Lan" },
        { timeSlot: 3, subject: "Tiếng Anh", teacher: "Lê Thị Hoa" },
        { timeSlot: 7, subject: "Thể dục", teacher: "Lý Văn Cường" },
      ],
    },
    {
      day: "tuesday",
      sessions: [
        { timeSlot: 1, subject: "Tiếng Việt", teacher: "Nguyễn Thị Mai" },
        { timeSlot: 2, subject: "Toán", teacher: "Hoàng Thị Lan" },
        { timeSlot: 3, subject: "Đạo đức", teacher: "Đặng Thị Nga" },
        { timeSlot: 4, subject: "Âm nhạc", teacher: "Bùi Minh Tuấn" },
      ],
    },
    {
      day: "wednesday",
      sessions: [
        { timeSlot: 1, subject: "Tiếng Anh", teacher: "Lê Thị Hoa" },
        { timeSlot: 2, subject: "Toán", teacher: "Hoàng Thị Lan" },
        { timeSlot: 3, subject: "Tiếng Việt", teacher: "Nguyễn Thị Mai" },
      ],
    },
    {
      day: "thursday",
      sessions: [
        { timeSlot: 1, subject: "Toán", teacher: "Hoàng Thị Lan" },
        { timeSlot: 2, subject: "Tự nhiên và xã hội", teacher: "Vũ Văn Hùng" },
        { timeSlot: 7, subject: "Thể dục", teacher: "Lý Văn Cường" },
      ],
    },
    {
      day: "friday",
      sessions: [
        { timeSlot: 1, subject: "Tiếng Việt", teacher: "Nguyễn Thị Mai" },
        { timeSlot: 2, subject: "Toán", teacher: "Hoàng Thị Lan" },
        {
          timeSlot: 8,
          subject: "Sinh hoạt lớp",
          teacher: classInfo.homeroomTeacher,
        },
      ],
    },
    {
      day: "saturday",
      sessions: [
        { timeSlot: 1, subject: "Ôn tập", teacher: classInfo.homeroomTeacher },
        {
          timeSlot: 2,
          subject: "Hoạt động ngoại khóa",
          teacher: classInfo.homeroomTeacher,
        },
      ],
    },
  ];

  const timeSlots = [
    { id: 1, startTime: "07:00", endTime: "07:45" },
    { id: 2, startTime: "07:45", endTime: "08:30" },
    { id: 3, startTime: "08:45", endTime: "09:30" },
    { id: 4, startTime: "09:30", endTime: "10:15" },
    { id: 5, startTime: "10:30", endTime: "11:15" },
    { id: 6, startTime: "11:15", endTime: "12:00" },
    { id: 7, startTime: "13:00", endTime: "13:45" },
    { id: 8, startTime: "13:45", endTime: "14:30" },
    { id: 9, startTime: "14:45", endTime: "15:30" },
    { id: 10, startTime: "15:30", endTime: "16:15" },
  ];

  basicSchedule.forEach(({ day, sessions }) => {
    timetable[day] = sessions.map((session) => {
      const timeSlot = timeSlots.find((slot) => slot.id === session.timeSlot);
      return {
        ...session,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        room: `${classInfo.name}`,
        note: `Dữ liệu mẫu cho ${classInfo.name}`,
      };
    });
  });

  return timetable;
};

/**
 * Tạo tất cả dữ liệu mẫu
 */
export const seedAllData = async () => {
  try {
    console.log("🌱 Bắt đầu tạo dữ liệu mẫu...");

    const results = {
      subjects: await seedSubjects(),
      teachers: await seedTeachers(),
      classes: await seedClasses(),
      timetables: await seedTimetables(),
    };

    console.log("🎉 Hoàn thành tạo dữ liệu mẫu!");
    console.log("📊 Thống kê:");
    console.log(`   - Môn học: ${results.subjects.count}`);
    console.log(`   - Giáo viên: ${results.teachers.count}`);
    console.log(`   - Lớp học: ${results.classes.count}`);
    console.log(`   - Thời khóa biểu: ${results.timetables.results.length}`);

    return results;
  } catch (error) {
    console.error("❌ Lỗi khi tạo dữ liệu mẫu:", error);
    throw error;
  }
};

/**
 * Xóa tất cả dữ liệu (để test lại)
 */
export const clearAllData = async () => {
  try {
    console.log("🗑️ Đang xóa tất cả dữ liệu...");

    // Lưu ý: Trong môi trường production, cần cẩn thận với chức năng này
    // Tạm thời comment out để tránh xóa nhầm dữ liệu thật
    /*
    const collections = ['subjects', 'teachers', 'classes', 'timetables'];
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(db, collectionName));
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Đã xóa collection: ${collectionName}`);
    }
    */

    console.log("⚠️ Chức năng xóa dữ liệu đã được tắt để bảo vệ dữ liệu");
    return { success: true, message: "Clear function disabled for safety" };
  } catch (error) {
    console.error("❌ Lỗi khi xóa dữ liệu:", error);
    throw error;
  }
};

const seedTimetableData = {
  seedSubjects,
  seedTeachers,
  seedClasses,
  seedTimetables,
  seedAllData,
  clearAllData,
  SAMPLE_SUBJECTS,
  SAMPLE_TEACHERS,
  SAMPLE_CLASSES,
  SAMPLE_TIMETABLE_3A,
};

export default seedTimetableData;
