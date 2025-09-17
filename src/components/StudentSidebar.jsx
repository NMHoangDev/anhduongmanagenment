import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { message, Switch, Slider } from "antd";
import {
  FaUserGraduate,
  FaMapSigns,
  FaCalendarAlt,
  FaBell,
  FaBookOpen,
  FaClipboardList,
  FaTrophy,
  FaDownload,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const studentMenu = [
  {
    label: "Hồ sơ học sinh",
    path: "/student/profile",
    icon: <FaUserGraduate />,
  },
  {
    label: "Lộ trình học",
    path: "/student/learning-path",
    icon: <FaMapSigns />,
  },
  {
    label: "Thời khóa biểu",
    path: "/student/timetable",
    icon: <FaCalendarAlt />,
  },
  {
    label: "Nhắc việc & Thông báo",
    path: "/student/notifications",
    icon: <FaBell />,
  },
  {
    label: "Sổ liên lạc điện tử",
    path: "/student/contact-book",
    icon: <FaClipboardList />,
  },
  {
    label: "Thư viện tài liệu",
    path: "/student/materials",
    icon: <FaBookOpen />,
  },
  { label: "Huy hiệu & BXH", path: "/student/badges", icon: <FaTrophy /> },
  {
    label: "Tải xuống / Offline",
    path: "/student/offline",
    icon: <FaDownload />,
  },
  {
    label: "Cài đặt truy cập",
    path: "/student/accessibility",
    icon: <FaCog />,
  },
];

export default function StudentSidebar() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.innerWidth < 900;
    } catch {
      return false;
    }
  });

  // accessibility state
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 900 && !collapsed) setCollapsed(true);
      if (window.innerWidth >= 900 && collapsed) setCollapsed(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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

  const sidebarWidth = collapsed ? 76 : 280;
  const avatarSize = collapsed ? 36 : 44;

  return (
    <aside
      style={{
        width: sidebarWidth,
        background: "linear-gradient(180deg, #1f3a93 0%, #2d6cdf 100%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "18px 12px",
        position: "sticky",
        top: 0,
        transition: "width 260ms ease",
        zIndex: 20,
        borderRadius: collapsed ? "0 12px 12px 0" : "0 16px 16px 0",
        boxShadow: "4px 0 20px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 12,
            color: "#fff",
          }}
        >
          <div
            style={{
              width: avatarSize,
              height: avatarSize,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#f6d365 0%,#fda085 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#333",
              fontWeight: 700,
            }}
          >
            <FaUserGraduate />
          </div>
          {!collapsed && (
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
              Học sinh
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            aria-label="Thu gọn sidebar"
            onClick={() => setCollapsed(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            <FaChevronLeft size={12} />
          </button>
        )}
      </div>

      {/* profile summary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 12,
          marginBottom: 18,
          padding: collapsed ? "10px 0" : "10px 12px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: collapsed ? "50%" : 12,
        }}
      >
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333",
            fontWeight: 700,
          }}
        >
          {currentUser?.name?.slice(0, 1) || "H"}
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                color: "#fff",
                fontWeight: 700,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {currentUser?.name || currentUser?.email || "Học sinh"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
              Lộ trình học
            </div>
          </div>
        )}
      </div>

      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: collapsed ? 8 : 6,
        }}
      >
        {studentMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : 12,
              padding: collapsed ? "12px 0" : "10px 14px",
              color: isActive ? "#fff" : "rgba(255,255,255,0.9)",
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              textDecoration: "none",
              borderRadius: 12,
              justifyContent: collapsed ? "center" : "flex-start",
            })}
            title={collapsed ? item.label : undefined}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {!collapsed && (
              <span style={{ color: "#fff", fontWeight: 600 }}>
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* accessibility and settings */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.03)",
        }}
      >
        {!collapsed && (
          <div style={{ color: "#fff", fontSize: 13, marginBottom: 8 }}>
            Trợ năng
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ color: "#fff", fontSize: 12, flex: 1 }}>
            Đọc to (TTS)
          </div>
          <Switch checked={ttsEnabled} onChange={setTtsEnabled} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "#fff", fontSize: 12, flex: 1 }}>Cỡ chữ</div>
          <div style={{ width: 120 }}>
            <Slider
              min={12}
              max={22}
              value={fontSize}
              onChange={setFontSize}
              tooltip={{ formatter: (v) => `${v}px` }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 12 }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 12,
            padding: collapsed ? "12px 0" : "12px 14px",
            color: "rgba(255,255,255,0.95)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: 12,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <span style={{ fontSize: 16 }}>
            <FaSignOutAlt />
          </span>
          {!collapsed && <span style={{ color: "#fff" }}>Đăng xuất</span>}
        </button>

        {collapsed && (
          <button
            aria-label="Mở rộng sidebar"
            onClick={() => setCollapsed(false)}
            style={{
              width: "100%",
              padding: "8px 0",
              marginTop: 8,
              borderRadius: 8,
              background: "rgba(255,255,255,0.08)",
              border: "none",
            }}
          >
            <FaChevronRight />
          </button>
        )}
      </div>
    </aside>
  );
}
