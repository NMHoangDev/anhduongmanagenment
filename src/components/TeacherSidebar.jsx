import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { message } from "antd";
import {
  FaChalkboardTeacher,
  FaBookOpen,
  FaCalendarAlt,
  FaPenFancy,
  FaFolderOpen,
  FaBell,
  FaUser,
  FaSignOutAlt,
  FaUserCheck,
  FaClock,
} from "react-icons/fa";

const menu = [
  {
    label: "Điểm danh giáo viên",
    path: "/teacher/teacher-attendance",
    icon: <FaClock />,
  },
  {
    label: "Điểm danh học sinh",
    path: "/teacher/student-attendance",
    icon: <FaUserCheck />,
  },
  {
    label: "Quản lý lớp",
    path: "/teacher/class",
    icon: <FaChalkboardTeacher />,
  },
  { label: "Ra đề/Bài tập", path: "/teacher/assignment", icon: <FaBookOpen /> },
  {
    label: "Thời khóa biểu",
    path: "/teacher/timetable",
    icon: <FaCalendarAlt />,
  },
  { label: "Nhập điểm", path: "/teacher/grade", icon: <FaPenFancy /> },
  { label: "Tài liệu", path: "/teacher/material", icon: <FaFolderOpen /> },
  { label: "Thông báo", path: "/teacher/notification", icon: <FaBell /> },
  { label: "Hồ sơ cá nhân", path: "/teacher/profile", icon: <FaUser /> },
];

export default function TeacherSidebar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      try {
        const result = await logout();
        if (result.success) {
          message.success("Đăng xuất thành công!");
          navigate("/login");
        } else {
          message.error("Có lỗi xảy ra khi đăng xuất");
        }
      } catch (error) {
        console.error("Lỗi đăng xuất:", error);
        message.error("Có lỗi xảy ra khi đăng xuất");
      }
    }
  };

  return (
    <div
      style={{
        width: 250,
        background: "#fff",
        minHeight: "100vh",
        boxShadow: "2px 0 12px #0001",
        display: "flex",
        flexDirection: "column",
        padding: "32px 0 0 0",
        position: "sticky",
        top: 0,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 22,
          color: "#1976d2",
          textAlign: "center",
          marginBottom: 32,
          letterSpacing: 1,
        }}
      >
        Giáo viên
      </div>

      {/* User Info */}
      <div
        style={{
          padding: "16px 28px",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: "#1976d2",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            <FaUser />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>
              {currentUser?.name || currentUser?.email || "Giáo viên"}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>Giáo viên</div>
          </div>
        </div>
      </div>

      <nav
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}
      >
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "12px 28px",
              fontWeight: 600,
              fontSize: 16,
              color: isActive ? "#1976d2" : "#444",
              background: isActive ? "#e3eafe" : "transparent",
              borderLeft: isActive
                ? "4px solid #1976d2"
                : "4px solid transparent",
              textDecoration: "none",
              borderRadius: "0 24px 24px 0",
              transition: "background 0.2s, color 0.2s, border-left 0.2s",
            })}
            end
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 28px",
            fontWeight: 600,
            fontSize: 16,
            color: "#f44336",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: "0 24px 24px 0",
            transition: "background 0.2s, color 0.2s",
            marginTop: "auto",
            marginBottom: 20,
          }}
          onMouseEnter={(e) => (e.target.style.background = "#ffebee")}
          onMouseLeave={(e) => (e.target.style.background = "transparent")}
        >
          <span style={{ fontSize: 20 }}>
            <FaSignOutAlt />
          </span>
          Đăng xuất
        </button>
      </nav>
    </div>
  );
}
