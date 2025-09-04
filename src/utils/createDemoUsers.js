import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

// Tạo các tài khoản demo trong Firestore
export const createDemoUsersInFirestore = async () => {
  const demoUsers = [
    {
      email: "admin@school.vn",
      password: "admin123",
      userData: {
        name: "Admin Hệ thống",
        role: "admin",
        phone: "0123456789",
        address: "Trường Tiểu học Anh Dương",
        createdAt: new Date().toISOString(),
      },
    },
    {
      email: "teacher@school.vn",
      password: "teacher123",
      userData: {
        name: "Nguyễn Thị Lan",
        role: "teacher",
        phone: "0987654321",
        address: "123 Đường ABC, TP.HCM",
        subjects: "Toán, Tiếng Việt",
        gradeLevel: "Lớp 1, 2, 3",
        teachingExperience: 5,
        qualifications: "Cử nhân Sư phạm Tiểu học",
        createdAt: new Date().toISOString(),
      },
    },
    {
      email: "student@school.vn",
      password: "student123",
      userData: {
        name: "Trần Văn An",
        role: "student",
        phone: "0123456788",
        address: "456 Đường XYZ, TP.HCM",
        grade: "Lớp 3",
        class: "3A",
        parentName: "Trần Văn Bình",
        parentPhone: "0912345678",
        dateOfBirth: "2018-03-15",
        gender: "Nam",
        createdAt: new Date().toISOString(),
      },
    },
  ];

  const results = [];

  for (const demoUser of demoUsers) {
    try {
      // Tạo user trong Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        demoUser.email,
        demoUser.password
      );

      const user = userCredential.user;

      // Lưu thông tin user vào Firestore
      await setDoc(doc(db, "users", user.uid), {
        ...demoUser.userData,
        uid: user.uid,
        email: demoUser.email,
      });

      results.push({
        success: true,
        email: demoUser.email,
        role: demoUser.userData.role,
      });

      console.log(`Tạo thành công user: ${demoUser.email}`);
    } catch (error) {
      console.error(`Lỗi tạo user ${demoUser.email}:`, error);
      results.push({
        success: false,
        email: demoUser.email,
        error: error.message,
      });
    }
  }

  return results;
};

// Hàm helper để chạy từ console
window.createDemoUsers = createDemoUsersInFirestore;
