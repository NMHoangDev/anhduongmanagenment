import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spin } from "antd";
import Layout from "./Layout";
import TeacherLayout from "./TeacherLayout";

const ProtectedRoute = ({
  children,
  requiredRole = null,
  adminOnly = false,
  teacherOnly = false,
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
    console.log("Người dùng chưa đăng nhập, chuyển hướng đến /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đã đăng nhập nhưng chưa có thông tin role
  if (!currentUser?.role) {
    console.log("Không tìm thấy thông tin role, chuyển hướng đến /login");
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền admin
  if (adminOnly && currentUser.role !== "admin") {
    console.log("Không có quyền admin, chuyển hướng đến trang phù hợp");
    const defaultRoute = getDefaultRouteByRole(currentUser.role);
    return <Navigate to={defaultRoute} replace />;
  }

  // Kiểm tra quyền teacher
  if (
    teacherOnly &&
    currentUser.role !== "teacher" &&
    currentUser.role !== "admin"
  ) {
    console.log("Không có quyền teacher, chuyển hướng đến trang phù hợp");
    const defaultRoute = getDefaultRouteByRole(currentUser.role);
    return <Navigate to={defaultRoute} replace />;
  }

  // Kiểm tra role cụ thể
  if (
    requiredRole &&
    currentUser.role !== requiredRole &&
    currentUser.role !== "admin"
  ) {
    console.log(
      `Không có quyền ${requiredRole}, chuyển hướng đến trang phù hợp`
    );
    const defaultRoute = getDefaultRouteByRole(currentUser.role);
    return <Navigate to={defaultRoute} replace />;
  }

  console.log(
    `Cho phép truy cập: ${location.pathname} với role: ${currentUser.role}`
  );

  // Sử dụng layout phù hợp dựa trên route
  if (location.pathname.startsWith("/teacher/")) {
    return <TeacherLayout>{children}</TeacherLayout>;
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
