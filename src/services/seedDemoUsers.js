import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Script tạo tài khoản demo cho hệ thống
 */

const DEMO_USERS = [
  {
    email: "admin@school.vn",
    password: "admin123",
    userData: {
      name: "Nguyễn Văn A (Admin)",
      phone: "0123456789",
      address: "Huế, Việt Nam",
      role: "admin",
      isDemo: true,
    },
  },
  {
    email: "teacher@school.vn",
    password: "teacher123",
    userData: {
      name: "Trần Thị B (Giáo viên)",
      phone: "0987654321",
      address: "Huế, Việt Nam",
      role: "teacher",
      isDemo: true,
      subjects: ["Tiếng Việt", "Toán"],
      gradeLevel: [3, 4, 5],
    },
  },
  {
    email: "student@school.vn",
    password: "student123",
    userData: {
      name: "Lê Văn C (Học sinh)",
      phone: "0369852147",
      address: "Huế, Việt Nam",
      role: "student",
      isDemo: true,
      grade: 4,
      class: "4A",
    },
  },
];

export const createDemoUsers = async () => {
  console.log("Bắt đầu tạo tài khoản demo...");

  try {
    const results = [];

    for (const demoUser of DEMO_USERS) {
      try {
        console.log(`Đang tạo tài khoản: ${demoUser.email}`);

        // Tạo tài khoản Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          demoUser.email,
          demoUser.password
        );

        const user = userCredential.user;

        // Lưu thông tin bổ sung vào Firestore
        const userDocData = {
          ...demoUser.userData,
          email: user.email,
          uid: user.uid,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };

        await setDoc(doc(db, "users", user.uid), userDocData);

        console.log(
          `✅ Tạo thành công: ${demoUser.email} (${demoUser.userData.role})`
        );

        results.push({
          success: true,
          email: demoUser.email,
          role: demoUser.userData.role,
          uid: user.uid,
        });
      } catch (error) {
        console.error(`❌ Lỗi tạo tài khoản ${demoUser.email}:`, error.message);

        // Nếu tài khoản đã tồn tại, không coi là lỗi
        if (error.code === "auth/email-already-in-use") {
          console.log(`ℹ️ Tài khoản ${demoUser.email} đã tồn tại`);
          results.push({
            success: true,
            email: demoUser.email,
            role: demoUser.userData.role,
            message: "Đã tồn tại",
          });
        } else {
          results.push({
            success: false,
            email: demoUser.email,
            error: error.message,
          });
        }
      }
    }

    console.log("Hoàn thành tạo tài khoản demo:");
    console.table(results);

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `📊 Kết quả: ${successCount}/${DEMO_USERS.length} tài khoản được tạo/xác nhận`
    );

    return {
      success: true,
      results,
      summary: {
        total: DEMO_USERS.length,
        successful: successCount,
        failed: DEMO_USERS.length - successCount,
      },
    };
  } catch (error) {
    console.error("Lỗi tổng quát khi tạo tài khoản demo:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Export thông tin demo để hiển thị trong UI
export const getDemoAccountsInfo = () => {
  return DEMO_USERS.map((user) => ({
    email: user.email,
    password: user.password,
    role: user.userData.role,
    name: user.userData.name,
  }));
};

export default {
  createDemoUsers,
  getDemoAccountsInfo,
  DEMO_USERS,
};
