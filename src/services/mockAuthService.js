/**
 * Mock Authentication Service cho development
 * Sử dụng Local Storage thay vì Firebase để test
 */

const MOCK_USERS = [
  {
    id: "admin-1",
    uid: "admin-1", // Thêm uid để tương thích với Firebase
    email: "admin@school.vn",
    password: "admin123",
    name: "Nguyễn Văn A (Admin)",
    role: "admin",
    phone: "0123456789",
    address: "Huế, Việt Nam",
  },
  {
    id: "teacher-1",
    uid: "teacher-1", // Thêm uid để tương thích với Firebase
    email: "teacher@school.vn",
    password: "teacher123",
    name: "Trần Thị B (Giáo viên)",
    role: "teacher",
    phone: "0987654321",
    address: "Huế, Việt Nam",
    subjects: ["Tiếng Việt", "Toán"],
    gradeLevel: [3, 4, 5],
  },
  {
    id: "student-1",
    uid: "student-1", // Thêm uid để tương thích với Firebase
    email: "student@school.vn",
    password: "student123",
    name: "Lê Văn C (Học sinh)",
    role: "student",
    phone: "0369852147",
    address: "Huế, Việt Nam",
    grade: 4,
    class: "4A",
  },
];

// Đăng nhập mock
export const loginUser = async (email, password) => {
  try {
    console.log("🔄 Mock đăng nhập:", { email });

    // Giả lập delay network
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // Lưu thông tin đăng nhập vào localStorage với session 2 ngày
    const { password: _, ...userWithoutPassword } = user;
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 2);

    const authData = {
      user: {
        ...userWithoutPassword,
        sessionExpiry: sessionExpiry.toISOString(),
        lastLogin: new Date().toISOString(),
      },
      timestamp: Date.now(),
      sessionExpiry: sessionExpiry.toISOString(),
    };

    localStorage.setItem("mockAuth", JSON.stringify(authData));

    console.log("✅ Mock đăng nhập thành công:", {
      ...userWithoutPassword,
      sessionExpiry: sessionExpiry.toISOString(),
    });

    return {
      success: true,
      user: userWithoutPassword,
    };
  } catch (error) {
    console.error("❌ Mock đăng nhập lỗi:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Đăng xuất mock
export const logoutUser = async () => {
  try {
    localStorage.removeItem("mockAuth");
    console.log("✅ Mock đăng xuất thành công");
    return { success: true };
  } catch (error) {
    console.error("❌ Mock đăng xuất lỗi:", error);
    return { success: false, error: error.message };
  }
};

// Đăng ký mock
export const registerUser = async (email, password, userData) => {
  try {
    console.log("🔄 Mock đăng ký:", { email, role: userData.role });

    // Kiểm tra role chỉ được phép teacher hoặc student
    if (!userData.role || !["teacher", "student"].includes(userData.role)) {
      throw new Error(
        "Chỉ được phép đăng ký với vai trò Giáo viên hoặc Học sinh"
      );
    }

    // Kiểm tra các trường bắt buộc
    if (!userData.name || !userData.name.trim()) {
      throw new Error("Vui lòng nhập họ và tên");
    }
    if (!userData.phone || !userData.phone.trim()) {
      throw new Error("Vui lòng nhập số điện thoại");
    }

    // Giả lập delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Kiểm tra email đã tồn tại
    const existingUser = MOCK_USERS.find((u) => u.email === email);
    if (existingUser) {
      throw new Error("Email đã được sử dụng");
    }

    // Tạo session expiry (2 ngày)
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 2);

    const userId = `user-${Date.now()}`;
    const newUser = {
      id: userId,
      uid: userId, // Thêm uid để tương thích với Firebase
      email,
      ...userData,
      createdAt: new Date().toISOString(),
      sessionExpiry: sessionExpiry.toISOString(),
      isActive: true,
    };

    // Tự động đăng nhập sau khi đăng ký thành công
    localStorage.setItem(
      "mockAuth",
      JSON.stringify({
        user: newUser,
        timestamp: Date.now(),
        sessionExpiry: sessionExpiry.toISOString(),
      })
    );

    // Trong thực tế sẽ lưu vào database
    console.log("✅ Mock đăng ký thành công:", {
      ...newUser,
      sessionExpiry: sessionExpiry.toISOString(),
    });

    return {
      success: true,
      user: newUser,
    };
  } catch (error) {
    console.error("❌ Mock đăng ký lỗi:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Lấy user hiện tại từ localStorage
export const getCurrentUser = async () => {
  try {
    const authData = localStorage.getItem("mockAuth");
    if (!authData) return null;

    const { user, timestamp, sessionExpiry } = JSON.parse(authData);

    // Kiểm tra session expiry (2 ngày hoặc từ sessionExpiry nếu có)
    let isExpired = false;

    if (sessionExpiry) {
      // Kiểm tra theo sessionExpiry từ user data
      const expiryDate = new Date(sessionExpiry);
      isExpired = new Date() > expiryDate;
    } else {
      // Fallback: kiểm tra theo timestamp (2 ngày)
      isExpired = Date.now() - timestamp > 2 * 24 * 60 * 60 * 1000;
    }

    if (isExpired) {
      console.log("🔔 Session đã hết hạn, xóa auth data");
      localStorage.removeItem("mockAuth");
      return null;
    }

    return user;
  } catch (error) {
    console.error("❌ Lỗi lấy user hiện tại:", error);
    return null;
  }
};

// Lắng nghe thay đổi auth state (mock)
export const onAuthStateChange = (callback) => {
  // Kiểm tra ngay lập tức
  getCurrentUser().then(callback);

  // Lắng nghe thay đổi localStorage (để sync giữa các tab)
  const handleStorageChange = (e) => {
    if (e.key === "mockAuth") {
      getCurrentUser().then(callback);
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // Trả về cleanup function
  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
};

// Kiểm tra quyền
export const checkPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    admin: 3,
    teacher: 2,
    student: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Lấy route mặc định
export const getDefaultRoute = (role) => {
  switch (role) {
    case "admin":
      return "/dashboard";
    case "teacher":
      return "/teacher/dashboard";
    case "student":
      return "/student/dashboard";
    default:
      return "/login";
  }
};
