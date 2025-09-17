import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spin } from "antd";
import Layout from "./Layout";
import TeacherLayout from "./TeacherLayout";
import StudentLayout from "./StudentLayout";

const ProtectedRoute = ({
  children,
  requiredRole = null,
  adminOnly = false,
  teacherOnly = false,
  studentOnly = false,
}) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Hiển thị loading khi đang kiểm tra trạng thái xác thực
  if (loading || currentUser === undefined) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f6f6fa",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px", color: "#666" }}>
            Đang kiểm tra quyền truy cập...
          </div>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập -> chuyển đến trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đã đăng nhập nhưng chưa có thông tin role
  if (!currentUser?.role) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền admin
  if (adminOnly && currentUser.role !== "admin") {
    // redirect users without admin role
    const defaultRoute = getDefaultRouteByRole(currentUser.role);
    return <Navigate to={defaultRoute} replace />;
  }

  // Kiểm tra quyền teacher
  if (
    teacherOnly &&
    currentUser.role !== "teacher" &&
    currentUser.role !== "admin"
  ) {
    // redirect users who are not teacher or admin
    const defaultRoute = getDefaultRouteByRole(currentUser.role);
    return <Navigate to={defaultRoute} replace />;
  }

  if (
    studentOnly &&
    currentUser.role !== "student" &&
    currentUser.role !== "admin"
  ) {
    const defaultRoute = getDefaultRouteByRole(currentUser.role);
    return <Navigate to={defaultRoute} replace />;
  }

  // Kiểm tra role cụ thể
  if (
    requiredRole &&
    currentUser.role !== requiredRole &&
    currentUser.role !== "admin"
  ) {
    const defaultRoute = getDefaultRouteByRole(currentUser.role);
    return <Navigate to={defaultRoute} replace />;
  }

  // allowed. choose layout based on path

  // Sử dụng layout phù hợp dựa trên route
  if (location.pathname.startsWith("/teacher/")) {
    return <TeacherLayout>{children}</TeacherLayout>;
  }

  if (location.pathname.startsWith("/student/")) {
    return <StudentLayout>{children}</StudentLayout>;
  }

  return <Layout>{children}</Layout>;
};

// Helper function để xác định route mặc định theo role
const getDefaultRouteByRole = (role) => {
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

export default ProtectedRoute;
