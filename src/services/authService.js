import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// helper tạo token đơn giản
function createSessionToken() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

const usersCol = collection(db, "users");

// Đăng nhập
export const loginUser = async (email, password) => {
  try {
    // Normalize email to avoid trailing spaces or case issues
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    // Optional: set auth persistence explicitly so session survives reloads
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (pErr) {
      console.warn("Could not set auth persistence:", pErr);
      // continue anyway
    }

    // tìm user doc theo email (fallback nếu users doc id không là uid)
    const q = query(usersCol, where("email", "==", normalizedEmail));
    const snap = await getDocs(q);
    const userDoc = snap.docs[0]; // may be undefined

    // nếu client có token và userDoc tồn tại -> kiểm tra token/expiry
    const clientToken = sessionStorage.getItem("sessionToken") || null;
    if (userDoc) {
      const userDataTmp = userDoc.data();
      const expiry = userDataTmp.sessionExpiry
        ? new Date(userDataTmp.sessionExpiry)
        : null;
      const now = new Date();

      if (
        clientToken &&
        userDataTmp.sessionToken &&
        clientToken === userDataTmp.sessionToken &&
        expiry &&
        now < expiry
      ) {
        // session client hợp lệ -> không cần check mật khẩu, đảm bảo auth state (không bắt buộc)
        return {
          success: true,
          user: {
            uid: userDataTmp.uid || userDoc.id,
            email: userDataTmp.email,
            ...userDataTmp,
          },
        };
      }
    }

    // Nếu tới đây: không có session hợp lệ -> phải xác thực bằng Firebase Auth
    const userCredential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );
    const user = userCredential.user;

    // Tìm users doc theo uid; nếu không tồn tại fallback về userDoc (tìm theo email) hoặc tạo mới
    let userRef = doc(db, "users", user.uid);
    let snapUid = await getDoc(userRef);

    if (!snapUid.exists()) {
      if (userDoc) {
        // fallback: dùng document tìm bằng email
        userRef = doc(db, "users", userDoc.id);
        snapUid = await getDoc(userRef);
      } else {
        // không tìm thấy users doc => tạo minimal user doc để gắn session
        const minimal = {
          uid: user.uid,
          authUid: user.uid,
          email: user.email || normalizedEmail,
          name: user.email ? user.email.split("@")[0] : "",
          role: "student",
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          isActive: true,
        };
        await setDoc(userRef, minimal, { merge: true });
        snapUid = await getDoc(userRef);
      }
    }

    if (!snapUid.exists()) {
      throw new Error("Không tìm thấy thông tin người dùng trong hệ thống");
    }

    const userData = snapUid.data();

    // tạo token mới và expiry (vd: 2 ngày)
    const token = createSessionToken();
    const newExpiry = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000
    ).toISOString();

    // cập nhật user doc (merge) — sử dụng userRef (đã fallback/created nếu cần)
    await setDoc(
      userRef,
      {
        sessionToken: token,
        sessionExpiry: newExpiry,
        lastUpdated: new Date().toISOString(),
        uid: user.uid, // ensure uid field present
        email: user.email || userData.email || normalizedEmail,
      },
      { merge: true }
    );

    // lấy lại userData tươi
    const freshSnap = await getDoc(userRef);
    const freshData = freshSnap.exists() ? freshSnap.data() : {};

    // lưu token vào sessionStorage
    sessionStorage.setItem("sessionToken", token);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        ...freshData,
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
      case "auth/invalid-credential":
      case "auth/invalid-login-credentials":
        errorMessage = "Email hoặc mật khẩu không đúng";
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

    const role = userData?.role || "student";
    const token = createSessionToken();
    const expiry = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // Prepare minimal users doc (only authentication / role / session)
    const minimalUserDoc = {
      uid: user.uid,
      email: user.email,
      role,
      sessionToken: token,
      sessionExpiry: expiry,
      createdAt: now,
      lastUpdated: now,
      isActive: true,
    };

    if (role === "teacher") {
      // Save minimal user doc
      await setDoc(doc(db, "users", user.uid), minimalUserDoc, { merge: true });

      // Create or update teachers/{uid} with profile details
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
          createdAt: now,
          lastUpdated: now,
          isActive: true,
        };
        await setDoc(teacherDocRef, teacherDocData, { merge: true });
      } catch (teacherError) {
        console.error("Lỗi khi tạo document giáo viên:", teacherError);
      }

      // store session token in sessionStorage
      sessionStorage.setItem("sessionToken", token);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          ...minimalUserDoc,
        },
      };
    } else if (role === "student") {
      // Create students document with detailed student fields
      try {
        const studentsCol = collection(db, "students");
        const studentDocData = {
          uid: user.uid,
          authUid: user.uid,
          name: userData.name || user.email.split("@")[0],
          email: user.email,
          avatar: userData.avatar || "",
          classId: userData.class || userData.classId || "",
          grade: userData.grade || "",
          dob: userData.dateOfBirth || userData.dob || null,
          gender: userData.gender || "",
          parent: {
            name: userData.parentName || "",
            phoneNumber:
              userData.parentPhone || userData.parentPhoneNumber || "",
          },
          extra: userData.extra || {}, // any other student-specific fields
          createdAt: now,
          lastUpdated: now,
          isActive: true,
        };

        const studentRef = await addDoc(studentsCol, studentDocData);

        // Attach reference to student document in users doc (minimal)
        minimalUserDoc.studentId = studentRef.id;

        await setDoc(doc(db, "users", user.uid), minimalUserDoc, {
          merge: true,
        });
      } catch (studentErr) {
        console.error("Lỗi khi tạo document student:", studentErr);
        // even if student doc creation fails, still persist minimal user doc
        await setDoc(doc(db, "users", user.uid), minimalUserDoc, {
          merge: true,
        });
      }

      // store session token in sessionStorage
      sessionStorage.setItem("sessionToken", token);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          ...minimalUserDoc,
        },
      };
    } else {
      // other roles: persist minimal user doc only
      await setDoc(doc(db, "users", user.uid), minimalUserDoc, { merge: true });
      sessionStorage.setItem("sessionToken", token);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          ...minimalUserDoc,
        },
      };
    }
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
