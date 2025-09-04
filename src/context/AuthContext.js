import React, { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService"; // Dùng authService thật để lưu vào Firestore
// import * as authService from "../service/mockAuthService"; // Tạm dùng mock service để debug

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log("Khởi tạo AuthProvider, đang kiểm tra trạng thái đăng nhập...");

    const unsubscribe = authService.onAuthStateChange((user) => {
      console.log(
        "Trạng thái xác thực thay đổi:",
        user
          ? {
              id: user.id || user.uid,
              email: user.email,
              role: user.role,
              name: user.name,
              phone: user.phone,
              address: user.address,
              // Log thêm thông tin teacher nếu có
              subjects: user.subjects,
              gradeLevel: user.gradeLevel,
              teachingExperience: user.teachingExperience,
              qualifications: user.qualifications,
            }
          : null
      );

      // Đảm bảo state được cập nhật một cách an toàn
      setTimeout(() => {
        setCurrentUser(user);
        setIsAuthenticated(!!user);
        setLoading(false);
      }, 0);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authService.loginUser(email, password);
      if (result.success) {
        console.log("Đăng nhập thành công từ AuthContext");
        setCurrentUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const result = await authService.logoutUser();
      if (result.success) {
        console.log("Đăng xuất thành công từ AuthContext");
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, userData) => {
    setLoading(true);
    try {
      const result = await authService.registerUser(email, password, userData);
      if (result.success) {
        console.log("Đăng ký thành công từ AuthContext");
        setCurrentUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role) => {
    return currentUser?.role === role;
  };

  const hasPermission = (requiredRole) => {
    if (!currentUser?.role) return false;
    return authService.checkPermission(currentUser.role, requiredRole);
  };

  const getDefaultRoute = () => {
    console.log("getDefaultRoute called, currentUser:", currentUser);
    if (!currentUser?.role) {
      console.log("No role found, returning /login");
      return "/login";
    }
    const route = authService.getDefaultRoute(currentUser.role);
    console.log("Default route for role", currentUser.role, ":", route);
    return route;
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    hasRole,
    hasPermission,
    getDefaultRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
