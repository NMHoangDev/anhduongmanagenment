// src/service/seedDatabase.js
import { doc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { getFirestore } from "firebase/firestore";
import { seedSubjects } from "./seedSubjects"; // Import hàm seed subjects

/**
 * Script để khởi tạo dữ liệu giả (mock data) chi tiết cho Firestore,
 * dựa trên phân tích các thành phần giao diện (pages).
 * Phiên bản v3 - Đơn cơ sở.
 */
export const seedDatabase = async () => {
  console.log(
    "Bắt đầu quá trình khởi tạo dữ liệu giả chi tiết (seeding v3)..."
  );
  const db = getFirestore();
  const batch = writeBatch(db);

  try {
    // 1. Tạo dữ liệu cho các cơ sở vật chất (facilities)
    const facilitiesData = {
      facility_1: { name: "Phòng học A", type: "Classroom", capacity: 30 },
      facility_2: { name: "Phòng học B", type: "Classroom", capacity: 25 },
      facility_3: { name: "Phòng học C", type: "Classroom", capacity: 40 },
    };
    for (const [id, data] of Object.entries(facilitiesData)) {
      const facilityRef = doc(db, "facilities", id);
      batch.set(facilityRef, data);
    }

    // 2. Cập nhật và bổ sung dữ liệu giáo viên (teachers)
    const teachersData = {
      teacher_1: {
        name: "Cô T.Trang",
        subject: "Toán",
        experience: "5 năm",
        rating: 4.5,
        avatar: "https://i.pravatar.cc/150?img=1",
      },
      teacher_2: {
        name: "Cô My",
        subject: "Tiếng Việt",
        experience: "3 năm",
        rating: 4.8,
        avatar: "https://i.pravatar.cc/150?img=2",
      },
      teacher_3: {
        name: "Thầy Nam",
        subject: "Khoa học",
        experience: "7 năm",
        rating: 4.2,
        avatar: "https://i.pravatar.cc/150?img=3",
      },
      teacher_4: {
        name: "Cô An",
        subject: "Tiếng Anh",
        experience: "4 năm",
        rating: 4.7,
        avatar: "https://i.pravatar.cc/150?img=4",
      },
      teacher_5: {
        name: "Thầy Hùng",
        subject: "Thể dục & GDQP",
        experience: "6 năm",
        rating: 4.3,
        avatar: "https://i.pravatar.cc/150?img=5",
      },
      teacher_6: {
        name: "Cô Mai",
        subject: "Năng khiếu (Nhạc, Họa)",
        experience: "5 năm",
        rating: 4.6,
        avatar: "https://i.pravatar.cc/150?img=6",
      },
    };
    for (const [id, data] of Object.entries(teachersData)) {
      const teacherRef = doc(db, "teachers", id);
      batch.set(teacherRef, data);
    }

    // 3. Tạo dữ liệu học sinh Cấp 1 và Cấp 2 (Cập nhật toàn bộ)
    const studentsData = {
      student_1: {
        name: "Nguyễn Văn An",
        grade: "6A",
        dob: "2012-05-10",
        parentName: "Nguyễn Văn A",
        contact: "0901234567",
        avatar: "https://i.pravatar.cc/150?img=7",
        status: "studying",
      },
      student_2: {
        name: "Trần Thị Bình",
        grade: "8B",
        dob: "2010-09-15",
        parentName: "Trần Văn B",
        contact: "0912345678",
        avatar: "https://i.pravatar.cc/150?img=8",
        status: "studying",
      },
      student_3: {
        name: "Lê Văn Cường",
        grade: "9A",
        dob: "2009-02-20",
        parentName: "Lê Thị C",
        contact: "0923456789",
        avatar: "",
        status: "studying",
      },
      student_4: {
        name: "Phạm Thị Dung",
        grade: "7C",
        dob: "2011-11-30",
        parentName: "Phạm Văn D",
        contact: "0934567890",
        avatar: "https://i.pravatar.cc/150?img=10",
        status: "studying",
      },
      student_5: {
        name: "Hoàng Văn Em",
        grade: "6B",
        dob: "2012-01-25",
        parentName: "Hoàng Thị E",
        contact: "0945678901",
        avatar: "https://i.pravatar.cc/150?img=11",
        status: "dropped_out",
      },
      student_6: {
        name: "Vũ Thị Giang",
        grade: "3A",
        dob: "2015-08-12",
        parentName: "Vũ Văn G",
        contact: "0956789012",
        avatar: "https://i.pravatar.cc/150?img=12",
        status: "studying",
      },
      student_7: {
        name: "Đỗ Văn Hùng",
        grade: "5B",
        dob: "2013-03-18",
        parentName: "Đỗ Thị H",
        contact: "0967890123",
        avatar: "",
        status: "studying",
      },
      student_8: {
        name: "Bùi Thị Lan",
        grade: "4A",
        dob: "2014-07-22",
        parentName: "Bùi Văn L",
        contact: "0978901234",
        avatar: "https://i.pravatar.cc/150?img=14",
        status: "studying",
      },
      student_9: {
        name: "Ngô Văn Mạnh",
        grade: "2B",
        dob: "2016-10-05",
        parentName: "Ngô Thị M",
        contact: "0989012345",
        avatar: "",
        status: "studying",
      },
      student_10: {
        name: "Đặng Thị Nga",
        grade: "1A",
        dob: "2017-12-01",
        parentName: "Đặng Văn N",
        contact: "0990123456",
        avatar: "https://i.pravatar.cc/150?img=16",
        status: "studying",
      },
    };
    for (const [id, data] of Object.entries(studentsData)) {
      const studentRef = doc(db, "students", id);
      batch.set(studentRef, data);
    }

    // 4. Cập nhật và bổ sung dữ liệu cho các lớp học (classes)
    const classesData = {
      class_1: {
        name: "Lớp 4A",
        grade: "4",
        teacher: "teacher_1",
        facility: "facility_1",
        students: ["student_8"],
      },
      class_2: {
        name: "Lớp 6A",
        grade: "6",
        teacher: "teacher_2",
        facility: "facility_2",
        students: ["student_1", "student_5"],
      },
      class_3: {
        name: "Lớp 1A",
        grade: "1",
        teacher: "teacher_1",
        facility: "facility_3",
        students: ["student_10"],
      },
      class_4: {
        name: "Lớp 3A",
        grade: "3",
        teacher: "teacher_2",
        facility: "facility_1",
        students: ["student_6"],
      },
      class_5: {
        name: "Lớp 9A",
        grade: "9",
        teacher: "teacher_3",
        facility: "facility_2",
        students: ["student_3"],
      },
      class_6: {
        name: "Lớp 8B",
        grade: "8",
        teacher: "teacher_3",
        facility: "facility_3",
        students: ["student_2"],
      },
      class_7: {
        name: "Lớp 7C",
        grade: "7",
        teacher: "teacher_4",
        facility: "facility_1",
        students: ["student_4"],
      },
      class_8: {
        name: "Lớp 5B",
        grade: "5",
        teacher: "teacher_1",
        facility: "facility_2",
        students: ["student_7"],
      },
      class_9: {
        name: "Lớp 2B",
        grade: "2",
        teacher: "teacher_1",
        facility: "facility_3",
        students: ["student_9"],
      },
    };
    for (const [id, data] of Object.entries(classesData)) {
      const classRef = doc(db, "classes", id);
      batch.set(classRef, data);
    }

    // 5. Tạo Thời khóa biểu thực tế cho tuần 30
    const weekId = "2024-W30";

    // --- Lịch học cho Lớp 4A (class_1) ---
    const timetable_4A = {
      schedule: {
        monday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Chào cờ",
            teacher: "BGH",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Khoa học",
            teacher: "Thầy Nam",
          },
          {
            startTime: "14:55",
            endTime: "15:40",
            subject: "Luyện chữ",
            teacher: "Cô My",
          },
        ],
        tuesday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "10:15",
            endTime: "11:00",
            subject: "Tiếng Anh",
            teacher: "Cô An",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Lịch sử & Địa lý",
            teacher: "Cô My",
          },
        ],
        wednesday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Âm nhạc",
            teacher: "Cô Mai",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "14:00",
            endTime: "15:40",
            subject: "STEAM",
            teacher: "Cô T.Trang",
            topic: "Chế tạo la bàn",
          },
        ],
        thursday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Mỹ thuật",
            teacher: "Cô Mai",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Tiếng Anh",
            teacher: "Cô An",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Kỹ năng sống",
            teacher: "Cô T.Trang",
          },
        ],
        friday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Sinh hoạt lớp",
            teacher: "Cô T.Trang",
          },
        ],
      },
    };
    const timetableRef_4A = doc(db, `classes/class_1/timetable`, weekId);
    batch.set(timetableRef_4A, timetable_4A);

    // --- Lịch học cho Lớp 4B (class_2) - Hoàn thiện ---
    const timetable_4B = {
      schedule: {
        monday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Chào cờ",
            teacher: "BGH",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Lịch sử & Địa lý",
            teacher: "Cô My",
          },
          {
            startTime: "14:55",
            endTime: "15:40",
            subject: "Luyện chữ",
            teacher: "Cô My",
          },
        ],
        tuesday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "10:15",
            endTime: "11:00",
            subject: "Khoa học",
            teacher: "Thầy Nam",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Tiếng Anh",
            teacher: "Cô An",
          },
        ],
        wednesday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Mỹ thuật",
            teacher: "Cô Mai",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "14:00",
            endTime: "15:40",
            subject: "STEAM",
            teacher: "Thầy Nam",
            topic: "Lắp ráp mô hình DNA",
          },
        ],
        thursday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Âm nhạc",
            teacher: "Cô Mai",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Tiếng Anh",
            teacher: "Cô An",
          },
        ],
        friday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Sinh hoạt lớp",
            teacher: "Cô My",
          },
        ],
      },
    };
    const timetableRef_4B = doc(db, `classes/class_2/timetable`, weekId);
    batch.set(timetableRef_4B, timetable_4B);

    // --- Lịch học cho Lớp 3A (class_4) ---
    const timetable_3A = {
      schedule: {
        monday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Chào cờ",
            teacher: "BGH",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Cô My",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Tự nhiên & Xã hội",
            teacher: "Cô My",
          },
        ],
        tuesday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Toán",
            teacher: "Cô My",
          },
          {
            startTime: "10:15",
            endTime: "11:00",
            subject: "Tiếng Anh",
            teacher: "Cô An",
          },
        ],
        wednesday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Toán",
            teacher: "Cô My",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Âm nhạc",
            teacher: "Cô Mai",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Tin học",
            teacher: "Thầy Nam",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Đạo đức",
            teacher: "Cô My",
          },
        ],
        thursday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Mỹ thuật",
            teacher: "Cô Mai",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Tiếng Anh",
            teacher: "Cô An",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
        ],
        friday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Tiếng Việt",
            teacher: "Cô My",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Cô My",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Sinh hoạt lớp",
            teacher: "Cô My",
          },
        ],
      },
    };
    const timetableRef_3A = doc(db, `classes/class_4/timetable`, weekId);
    batch.set(timetableRef_3A, timetable_3A);

    // --- Lịch học cho Lớp 1A (class_3) - Tạo mới ---
    const timetable_1A = {
      schedule: {
        monday: [
          {
            startTime: "07:45",
            endTime: "08:20",
            subject: "Chào cờ",
            teacher: "BGH",
          },
          {
            startTime: "08:30",
            endTime: "09:05",
            subject: "Tiếng Việt (Học vần)",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "09:15",
            endTime: "09:50",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "14:00",
            endTime: "14:35",
            subject: "Tự nhiên & Xã hội",
            teacher: "Cô T.Trang",
          },
        ],
        tuesday: [
          {
            startTime: "07:45",
            endTime: "08:20",
            subject: "Tiếng Việt (Học vần)",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "08:30",
            endTime: "09:05",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "09:15",
            endTime: "09:50",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "14:00",
            endTime: "14:35",
            subject: "Âm nhạc",
            teacher: "Cô Mai",
          },
        ],
        wednesday: [
          {
            startTime: "07:45",
            endTime: "08:20",
            subject: "Tiếng Việt (Tập viết)",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "08:30",
            endTime: "09:05",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "09:15",
            endTime: "09:50",
            subject: "Mỹ thuật",
            teacher: "Cô Mai",
          },
          {
            startTime: "14:00",
            endTime: "14:35",
            subject: "Hoạt động trải nghiệm",
            teacher: "Cô T.Trang",
          },
        ],
        thursday: [
          {
            startTime: "07:45",
            endTime: "08:20",
            subject: "Toán",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "08:30",
            endTime: "09:05",
            subject: "Tiếng Việt (Học vần)",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "09:15",
            endTime: "09:50",
            subject: "Tiếng Anh",
            teacher: "Cô An",
          },
        ],
        friday: [
          {
            startTime: "07:45",
            endTime: "08:20",
            subject: "Tiếng Việt (Tập viết)",
            teacher: "Cô T.Trang",
          },
          {
            startTime: "08:30",
            endTime: "09:05",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "09:15",
            endTime: "09:50",
            subject: "Sinh hoạt lớp",
            teacher: "Cô T.Trang",
          },
        ],
      },
    };
    const timetableRef_1A = doc(db, `classes/class_3/timetable`, weekId);
    batch.set(timetableRef_1A, timetable_1A);

    // --- Lịch học cho Lớp 5A (class_5) - Tạo mới ---
    const timetable_5A = {
      schedule: {
        monday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Chào cờ",
            teacher: "BGH",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Thầy Nam",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Tiếng Việt",
            teacher: "Thầy Nam",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Khoa học",
            teacher: "Thầy Nam",
          },
          {
            startTime: "14:55",
            endTime: "15:40",
            subject: "Lịch sử",
            teacher: "Thầy Nam",
          },
        ],
        tuesday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Tiếng Việt",
            teacher: "Thầy Nam",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Toán",
            teacher: "Thầy Nam",
          },
          {
            startTime: "10:15",
            endTime: "11:00",
            subject: "Tiếng Anh",
            teacher: "Cô An",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Địa lý",
            teacher: "Thầy Nam",
          },
        ],
        wednesday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Mỹ thuật",
            teacher: "Cô Mai",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Thầy Nam",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Tiếng Việt",
            teacher: "Thầy Nam",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Tin học",
            teacher: "Thầy Nam",
          },
        ],
        thursday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Tiếng Việt",
            teacher: "Thầy Nam",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Toán",
            teacher: "Thầy Nam",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Âm nhạc",
            teacher: "Cô Mai",
          },
          {
            startTime: "10:15",
            endTime: "11:00",
            subject: "Tiếng Anh",
            teacher: "Cô An",
          },
        ],
        friday: [
          {
            startTime: "07:30",
            endTime: "08:15",
            subject: "Toán",
            teacher: "Thầy Nam",
          },
          {
            startTime: "08:25",
            endTime: "09:10",
            subject: "Tiếng Việt",
            teacher: "Thầy Nam",
          },
          {
            startTime: "09:20",
            endTime: "10:05",
            subject: "Thể dục",
            teacher: "Thầy Hùng",
          },
          {
            startTime: "14:00",
            endTime: "14:45",
            subject: "Sinh hoạt lớp",
            teacher: "Thầy Nam",
          },
        ],
      },
    };
    const timetableRef_5A = doc(db, `classes/class_5/timetable`, weekId);
    batch.set(timetableRef_5A, timetable_5A);

    // Xóa các dữ liệu cũ không cần thiết
    batch.delete(doc(db, `classes/class_1/timetable`, "2024-W31"));
    // Không còn các lệnh xóa lớp 3 và 5 nữa

    // 6. Tạo Thực đơn tuần
    const menuData = {
      "2019-W30": {
        // Dữ liệu giống trong ảnh
        startDate: new Date("2019-07-21"),
        endDate: new Date("2019-07-25"),
        schoolLevel: "preschool",
        weeklyMenu: {
          monday: {
            breakfast: "Cháo bò câu đậu đỏ",
            lunch: [
              "Vịt kho sả",
              "Rau dền đỏ xào tỏi",
              "Canh rau ngót nấu tôm",
            ],
            snack: "Sinh tố",
          },
          tuesday: {
            breakfast: "Bò kho bánh mỳ",
            lunch: [
              "Nấm rim đậu khuôn",
              "Củ quả xào",
              "Canh đủ đủ nấu chả quết",
            ],
            snack: "Khoai lang mật hấp",
          },
          wednesday: {
            breakfast: "Cháo gà ác đậu đỏ",
            lunch: [
              "Cá sốt cà chua",
              "Rau muống xào tỏi",
              "Canh dưa hồng nấu cá mớm",
            ],
            snack: "Sữa sắn dây bí đỏ",
          },
          thursday: {
            breakfast: "Soup bắp non cá thu",
            lunch: [
              "Cà rốt kho cốt dừa chà bò",
              "Mướp xào tôm",
              "Canh rau lang nấu nấm",
            ],
            snack: "Thạch rau câu cốt dừa",
          },
          friday: {
            breakfast: "Xôi dậu",
            lunch: ["Cơm gà xé", "Củ quả xào", "Canh rong biển tàu hủ non"],
            snack: "Sữa Kale hạt điều",
          },
        },
      },
    };
    const menuRef = doc(db, "menus", "2019-W30");
    batch.set(menuRef, menuData["2019-W30"]);

    await batch.commit();

    // Khởi tạo dữ liệu môn học
    await seedSubjects();

    console.log("Khởi tạo dữ liệu giả chi tiết (v3) thành công!");
    alert("Database đã được khởi tạo thành công với dữ liệu chi tiết (v3)!");
  } catch (error) {
    console.error("Lỗi khi khởi tạo database (v3): ", error);
    alert(`Lỗi khi khởi tạo database (v3): ${error.message}`);
  }
};
