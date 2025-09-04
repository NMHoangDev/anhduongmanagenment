import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Service xử lý xác thực người dùng
 */

// Đăng nhập
export const loginUser = async (email, password) => {
  try {
    console.log("Đang đăng nhập vào Firebase:", { email });

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      throw new Error("Không tìm thấy thông tin người dùng trong hệ thống");
    }

    const userData = userDoc.data();

    // Kiểm tra mật khẩu từ Firestore
    if (userData.password !== password) {
      throw new Error("Mật khẩu không đúng");
    }

    console.log("Đăng nhập thành công:", {
      uid: user.uid,
      email: user.email,
      role: userData.role,
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...userData,
      },
    };
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    let errorMessage = "Có lỗi xảy ra khi đăng nhập";

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "Không tìm thấy tài khoản với email này";
        break;
      case "auth/wrong-password":
        errorMessage = "Mật khẩu không đúng";
        break;
      case "auth/invalid-email":
        errorMessage = "Email không hợp lệ";
        break;
      case "auth/user-disabled":
        errorMessage = "Tài khoản đã bị vô hiệu hóa";
        break;
      case "auth/too-many-requests":
        errorMessage = "Quá nhiều lần thử. Vui lòng thử lại sau";
        break;
      default:
        errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Đăng xuất
export const logoutUser = async () => {
  try {
    console.log("Đang đăng xuất khỏi Firebase");
    await signOut(auth);
    console.log("Đăng xuất thành công");
    return { success: true };
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    return { success: false, error: error.message };
  }
};

// Đăng ký người dùng mới
export const registerUser = async (email, password, userData) => {
  try {
    console.log("🔄 Đang đăng ký tài khoản mới:", {
      email,
      role: userData.role,
    });

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const userDocData = {
      ...userData,
      email: user.email,
      uid: user.uid,
      password, // Lưu mật khẩu trực tiếp (không hash, chỉ để test)
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      sessionExpiry: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(), // Thêm 2 ngày
      isActive: true,
    };

    await setDoc(doc(db, "users", user.uid), userDocData);

    // Nếu là giáo viên thì tạo luôn document trong collection "teachers"
    if (userData.role === "teacher") {
      try {
        const teacherDocRef = doc(db, "teachers", user.uid);
        const teacherDocData = {
          uid: user.uid,
          authUid: user.uid,
          name: userData.name || user.email.split("@")[0],
          email: user.email,
          avatar: userData.avatar || "",
          experience: userData.experience || "",
          rating: userData.rating || 0,
          phone: userData.phone || "",
          gender: userData.gender || "",
          facilityId: userData.facilityId || null,
          subjectIds: userData.subjectIds || [],
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        // Dùng merge để không ghi đè nếu đã có document
        await setDoc(teacherDocRef, teacherDocData, { merge: true });
        console.log("✅ Đã tạo document giáo viên:", teacherDocRef.id);
      } catch (teacherError) {
        console.error("Lỗi khi tạo document giáo viên:", teacherError);
        // Không block quá trình đăng ký chính, chỉ log lỗi
      }
    }

    console.log("✅ Đăng ký thành công:", {
      uid: user.uid,
      email: user.email,
      role: userData.role,
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...userDocData,
      },
    };
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    let errorMessage = "Có lỗi xảy ra khi đăng ký";

    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "Email đã được sử dụng";
        break;
      case "auth/invalid-email":
        errorMessage = "Email không hợp lệ";
        break;
      case "auth/weak-password":
        errorMessage = "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn";
        break;
      default:
        errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Lấy thông tin người dùng hiện tại
export const getCurrentUser = async () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Kiểm tra session expiry
            if (userData.sessionExpiry) {
              const expiryDate = new Date(userData.sessionExpiry);
              if (new Date() > expiryDate) {
                // Session đã hết hạn, đăng xuất user
                console.log("Session đã hết hạn, đăng xuất user");
                await signOut(auth);
                resolve(null);
                return;
              }
            }

            resolve({
              uid: user.uid,
              email: user.email,
              ...userData,
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error("Lỗi lấy thông tin người dùng:", error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};

// Lắng nghe thay đổi trạng thái xác thực
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Kiểm tra session expiry
          if (userData.sessionExpiry) {
            const expiryDate = new Date(userData.sessionExpiry);
            if (new Date() > expiryDate) {
              // Session đã hết hạn, đăng xuất user
              console.log(
                "Session đã hết hạn trong onAuthStateChange, đăng xuất user"
              );
              await signOut(auth);
              callback(null);
              return;
            }
          }

          callback({
            uid: user.uid,
            email: user.email,
            ...userData,
          });
        } else {
          callback(null);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin người dùng:", error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// Kiểm tra quyền truy cập
export const checkPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    admin: 3,
    teacher: 2,
    student: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Lấy route mặc định dựa trên role
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
