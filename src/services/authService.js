import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * Service xử lý xác thực người dùng
 *
 * Behaviour:
 * - Nếu client có sessionToken hợp lệ (sessionStorage) và trùng với sessionToken trong users doc và chưa expiry => cho phép vào mà không cần sign-in lại.
 * - Ngược lại sẽ cố gắng signInWithEmailAndPassword (kiểm tra email/password). Nếu đúng => tạo mới sessionToken + sessionExpiry, lưu vào users doc và sessionStorage.
 * - Nếu sign-in sai => trả về lỗi.
 */

// helper tạo token đơn giản
function createSessionToken() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

const usersCol = collection(db, "users");

// Đăng nhập
export const loginUser = async (email, password) => {
  try {
    // tìm user doc theo email
    const q = query(usersCol, where("email", "==", email));
    const snap = await getDocs(q);
    const userDoc = snap.docs[0];

    // nếu client có token và userDoc tồn tại -> kiểm tra token/expiry
    const clientToken = sessionStorage.getItem("sessionToken") || null;
    if (userDoc) {
      const userData = userDoc.data();
      const expiry = userData.sessionExpiry
        ? new Date(userData.sessionExpiry)
        : null;
      const now = new Date();

      if (
        clientToken &&
        userData.sessionToken &&
        clientToken === userData.sessionToken &&
        expiry &&
        now < expiry
      ) {
        // session client hợp lệ -> không cần check mật khẩu, đảm bảo auth state (không bắt buộc)
        return {
          success: true,
          user: {
            uid: userData.uid || userDoc.id,
            email: userData.email,
            ...userData,
          },
        };
      }
    }

    // Nếu tới đây: không có session hợp lệ -> phải xác thực bằng Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // lấy user doc theo uid (nếu query email không trả về)
    const userRef = doc(db, "users", user.uid);
    const snapUid = await getDoc(userRef);
    if (!snapUid.exists()) {
      throw new Error("Không tìm thấy thông tin người dùng trong hệ thống");
    }
    const userData = snapUid.data();

    // tạo token mới và expiry (vd: 2 ngày)
    const token = createSessionToken();
    const newExpiry = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000
    ).toISOString();

    // cập nhật user doc (merge)
    await setDoc(
      userRef,
      {
        sessionToken: token,
        sessionExpiry: newExpiry,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );

    // lưu token vào sessionStorage
    sessionStorage.setItem("sessionToken", token);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...userData,
        sessionToken: token,
        sessionExpiry: newExpiry,
      },
    };
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    let errorMessage = "Có lỗi xảy ra khi đăng nhập";

    // Firebase auth errors
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
        errorMessage = error.message || errorMessage;
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
    sessionStorage.removeItem("sessionToken");
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
    return { success: false, error: error.message };
  }
};

// Đăng ký người dùng mới (không thay đổi logic hiện tại, chỉ thêm initial session token nếu cần)
export const registerUser = async (email, password, userData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const isTeacher = userData?.role === "teacher";
    const token = createSessionToken();
    const expiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    // For teacher role: keep minimal fields in users collection, store detailed profile in teachers collection
    const userDocData = isTeacher
      ? {
          uid: user.uid,
          email: user.email,
          name: userData.name || user.email.split("@")[0],
          role: "teacher",
          password, // lưu tạm (chú ý: chỉ dùng dev/test)
          sessionToken: token,
          sessionExpiry: expiry,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          isActive: true,
        }
      : {
          ...userData,
          email: user.email,
          uid: user.uid,
          password, // lưu tạm (chú ý: chỉ dùng dev/test)
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          sessionExpiry: expiry,
          sessionToken: token,
          isActive: true,
        };

    await setDoc(doc(db, "users", user.uid), userDocData, { merge: true });

    if (isTeacher) {
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
          lastUpdated: new Date().toISOString(),
          isActive: true,
        };
        await setDoc(teacherDocRef, teacherDocData, { merge: true });
      } catch (teacherError) {
        console.error("Lỗi khi tạo document giáo viên:", teacherError);
      }
    }

    // lưu token vào sessionStorage
    sessionStorage.setItem("sessionToken", userDocData.sessionToken);

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
                await signOut(auth);
                sessionStorage.removeItem("sessionToken");
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
              await signOut(auth);
              sessionStorage.removeItem("sessionToken");
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

/**
 * Cập nhật profile người dùng (admin hoặc teacher)
 * - uid: auth uid / document id
 * - updates: { email, password, currentPassword, name, username, avatar, role, ...otherFields }
 *
 * Behaviour:
 * - Nếu client đang đăng nhập (auth.currentUser) và uid trùng, cố gắng cập nhật email/password trên Firebase Auth.
 *   + Với password cần currentPassword để reauthenticate (nếu cần).
 * - Luôn cập nhật/merge các trường cơ bản vào users doc (id, name, email, username, avatar, role).
 * - Nếu role === 'teacher' sẽ đảm bảo document teachers/{uid} tồn tại và cập nhật các trường profile (name, email, avatar, phone...).
 */
export const updateUserProfile = async (uid, updates = {}) => {
  if (!uid) throw new Error("uid is required");
  if (!updates || Object.keys(updates).length === 0)
    throw new Error("updates is required");

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    const existingUser = userSnap.exists() ? userSnap.data() : null;

    const authUser = auth.currentUser;
    // 1) Update Firebase Auth email/password if possible
    if (updates.email) {
      if (!authUser || authUser.uid !== uid) {
        // cannot update Firebase Auth email for other users from client SDK
        // still persist requested email in users doc (admin panel should use Admin SDK)
        console.warn(
          "Auth updateEmail skipped: current client not logged as target uid"
        );
      } else {
        try {
          await updateEmail(authUser, updates.email);
        } catch (err) {
          // If requires re-auth, inform caller
          return {
            success: false,
            error:
              err.code === "auth/requires-recent-login"
                ? "Cần đăng nhập lại để thay đổi email. Vui lòng đăng nhập lại và thử lại."
                : err.message || "Lỗi khi cập nhật email",
          };
        }
      }
    }

    if (typeof updates.password !== "undefined") {
      if (!authUser || authUser.uid !== uid) {
        return {
          success: false,
          error:
            "Không thể cập nhật mật khẩu: khách hàng hiện tại không phải người dùng mục tiêu",
        };
      } else {
        // try reauthenticate if currentPassword provided
        if (updates.currentPassword) {
          try {
            const cred = EmailAuthProvider.credential(
              authUser.email,
              updates.currentPassword
            );
            await reauthenticateWithCredential(authUser, cred);
          } catch (reauthErr) {
            return {
              success: false,
              error:
                "Không thể xác thực lại. Vui lòng kiểm tra mật khẩu hiện tại và thử lại.",
            };
          }
        }
        try {
          await updatePassword(authUser, updates.password);
        } catch (err) {
          return {
            success: false,
            error:
              err.code === "auth/requires-recent-login"
                ? "Cần đăng nhập lại để thay đổi mật khẩu. Vui lòng đăng nhập lại và thử lại."
                : err.message || "Lỗi khi cập nhật mật khẩu",
          };
        }
      }
    }

    // 2) Prepare fields to update in users doc (keep minimal for teacher)
    const minimalFields = {};
    if (updates.name) minimalFields.name = updates.name;
    if (updates.username) minimalFields.username = updates.username;
    if (typeof updates.avatar !== "undefined")
      minimalFields.avatar = updates.avatar;
    if (updates.email) minimalFields.email = updates.email;
    if (updates.role) minimalFields.role = updates.role;
    // only store password in users doc for dev/test if provided (note warning)
    if (typeof updates.password !== "undefined")
      minimalFields.password = updates.password;

    // Ensure uid field always present
    minimalFields.uid = uid;

    await setDoc(userRef, minimalFields, { merge: true });

    // 3) If teacher, ensure teacher doc exists and contains basic profile fields
    const roleToCheck = updates.role || (existingUser && existingUser.role);
    if (roleToCheck === "teacher") {
      const teacherRef = doc(db, "teachers", uid);
      const teacherSnap = await getDoc(teacherRef);
      const teacherUpdate = {};
      if (updates.name) teacherUpdate.name = updates.name;
      if (updates.email) teacherUpdate.email = updates.email;
      if (typeof updates.avatar !== "undefined")
        teacherUpdate.avatar = updates.avatar;
      if (updates.phone) teacherUpdate.phone = updates.phone;
      // ensure required keys if doc missing
      if (!teacherSnap.exists()) {
        await setDoc(
          teacherRef,
          {
            uid,
            authUid: uid,
            name: updates.name || (existingUser && existingUser.name) || uid,
            email: updates.email || (existingUser && existingUser.email) || "",
            avatar: typeof updates.avatar !== "undefined" ? updates.avatar : "",
            phone: updates.phone || "",
            subjectIds: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            isActive: true,
          },
          { merge: true }
        );
      } else if (Object.keys(teacherUpdate).length > 0) {
        teacherUpdate.lastUpdated = new Date().toISOString();
        await setDoc(teacherRef, teacherUpdate, { merge: true });
      }
    } else {
      // If role changed away from teacher and teachers doc exists, do not delete automatically.
      // Optional: could remove teachers doc when role removed — keep current behavior safe.
    }

    // 4) Return fresh user doc
    const updatedSnap = await getDoc(userRef);
    return {
      success: true,
      user: updatedSnap.exists() ? updatedSnap.data() : null,
    };
  } catch (err) {
    console.error("updateUserProfile error:", err);
    return {
      success: false,
      error: err.message || "Lỗi khi cập nhật thông tin người dùng",
    };
  }
};
