import React, { useState, useEffect } from "react";
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
  FaChevronLeft,
  FaChevronRight,
  FaTh,
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
  {
    label: "Tạo bài trắc nghiệm",
    path: "/teacher/assignment",
    icon: <FaBookOpen />,
  },
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

  // responsive collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.innerWidth < 900;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onResize = () => {
      // auto collapse on small screens, expand on large
      if (window.innerWidth < 900 && !collapsed) setCollapsed(true);
      if (window.innerWidth >= 900 && collapsed) setCollapsed(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

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

  const sidebarWidth = collapsed ? 80 : 260;
  const avatarSize = collapsed ? 32 : 36;

  return (
    <div
      style={{
        width: sidebarWidth,
        background: "linear-gradient(180deg, #2c3e50 0%, #34495e 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        position: "sticky",
        top: 0,
        transition: "width 300ms ease",
        zIndex: 20,
        borderRadius: collapsed ? "0 12px 12px 0" : "0 16px 16px 0",
        boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header with logo and toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          marginBottom: 24,
          padding: collapsed ? "8px 0" : "8px 12px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 12,
            color: "#ffffff",
          }}
        >
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: collapsed ? 14 : 16,
              fontWeight: "bold",
            }}
          >
            <FaTh />
          </div>
          {!collapsed && (
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              Giáo viên
            </span>
          )}
        </div>

        {/* Toggle button */}
        {!collapsed && (
          <button
            aria-label="Thu gọn sidebar"
            onClick={() => setCollapsed(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }
          >
            <FaChevronLeft size={12} />
          </button>
        )}
      </div>

      {/* User Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 12,
          marginBottom: 24,
          padding: collapsed ? "12px 0" : "16px 12px",
          background: "rgba(255,255,255,0.05)",
          borderRadius: collapsed ? "50%" : "12px",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: "bold",
          }}
        >
          <FaUser />
        </div>
        {!collapsed && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#ffffff",
                marginBottom: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentUser?.name || currentUser?.email || "Giáo viên"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              Giáo viên
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: collapsed ? 8 : 4,
        }}
      >
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : 16,
              padding: collapsed ? "12px 0" : "12px 16px",
              color: isActive ? "#ffffff" : "rgba(255,255,255,0.8)",
              background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
              textDecoration: "none",
              borderRadius: collapsed ? "8px" : "12px",
              transition: "all 0.2s ease",
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              justifyContent: collapsed ? "center" : "flex-start",
              position: "relative",
              overflow: "hidden",
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.getAttribute("data-active")) {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.getAttribute("data-active")) {
                e.currentTarget.style.background = "transparent";
              }
            }}
            title={collapsed ? item.label : undefined}
          >
            <span style={{ fontSize: 16, minWidth: 16 }}>{item.icon}</span>
            {!collapsed && (
              <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 16,
            padding: collapsed ? "12px 0" : "12px 16px",
            color: "rgba(255,255,255,0.9)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: collapsed ? "8px" : "12px",
            transition: "all 0.2s ease",
            fontSize: 14,
            fontWeight: 500,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(231, 76, 60, 0.15)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
          title={collapsed ? "Đăng xuất" : undefined}
        >
          <span style={{ fontSize: 16, minWidth: 16 }}>
            <FaSignOutAlt />
          </span>
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          aria-label="Mở rộng sidebar"
          onClick={() => setCollapsed(false)}
          style={{
            width: "100%",
            padding: "8px 0",
            marginTop: 8,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "8px",
            color: "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
        >
          <FaChevronRight size={12} />
        </button>
      )}
    </div>
  );
}
