import React, { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { message } from "antd";
import styles from "./Sidebar.module.css";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaTachometerAlt,
  FaMoneyBill,
  FaMoneyCheckAlt,
  FaCog,
  FaStar,
  FaChevronDown,
  FaChevronRight,
  FaUserPlus,
  FaChalkboard,
  FaBook,
  FaFileAlt,
  FaUtensils,
  FaTools,
  FaUsers,
  FaSchool,
  FaSignOutAlt,
  FaUser,
  FaMoneyBillWave,
} from "react-icons/fa";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [openStudent, setOpenStudent] = useState(false);

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  React.useEffect(() => {
    if (isActive("/all-student") || isActive("/student-details")) {
      setOpenStudent(true);
    }
  }, [isActive]);

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
    <aside className={styles.sidebar}>
      <div className={styles.logoBox}>
        <div className={styles.logoCircle}>
          <span style={{ fontSize: 32, color: "#1a237e" }}>M</span>
        </div>
        <div className={styles.logoText}>Trung tâm Ánh Dương</div>
      </div>
      <nav className={styles.menu}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li>
            <Link
              to="/dashboard"
              className={`${styles.menuItem} ${
                isActive("/dashboard") ? styles.menuItemActive : ""
              }`}
            >
              <FaTachometerAlt /> Trang chủ
            </Link>
          </li>
          <li>
            <Link
              to="/teachers"
              className={`${styles.menuItem} ${
                isActive("/teachers") ? styles.menuItemActive : ""
              }`}
            >
              <FaChalkboardTeacher /> Giáo viên
            </Link>
          </li>
          <li>
            <Link
              to="/subjects"
              className={`${styles.menuItem} ${
                isActive("/subjects") ? styles.menuItemActive : ""
              }`}
            >
              <FaBook /> Môn học
            </Link>
          </li>
          <li>
            <Link
              to="/timetable"
              className={`${styles.menuItem} ${
                isActive("/timetable") ? styles.menuItemActive : ""
              }`}
            >
              <FaFileAlt /> Thời khóa biểu
            </Link>
          </li>
          <li>
            <button
              className={`${styles.menuItem} ${
                openStudent ||
                isActive("/all-student") ||
                isActive("/student-details")
                  ? styles.menuItemActive
                  : ""
              }`}
              onClick={() => setOpenStudent((v) => !v)}
              style={{ width: "100%", textAlign: "left", background: "none" }}
            >
              <FaUserGraduate />
              Học sinh / Lớp
              <span style={{ marginLeft: "auto" }}>
                {openStudent ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            </button>
            {openStudent && (
              <ul className={styles.subMenu}>
                <li>
                  <Link
                    to="/all-student"
                    className={`${styles.subMenuItem} ${
                      isActive("/all-student") ? styles.subMenuItemActive : ""
                    }`}
                  >
                    <FaChalkboard /> Danh sách học sinh
                  </Link>
                </li>
                <li>
                  <Link to="/classes" className={styles.subMenuItem}>
                    <FaUserPlus /> Danh sách lớp học
                  </Link>
                </li>
                <li>
                  <Link to="/parents" className={styles.subMenuItem}>
                    <FaUsers /> Phụ huynh
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link
              to="/tuition-fee"
              className={`${styles.menuItem} ${
                isActive("/tuition-fee") ? styles.menuItemActive : ""
              }`}
            >
              <FaMoneyBill /> Học phí
            </Link>
          </li>
          <li>
            <Link
              to="/food-menu"
              className={`${styles.menuItem} ${
                isActive("/food-menu") ? styles.menuItemActive : ""
              }`}
            >
              <FaUtensils /> Thực đơn tuần
            </Link>
          </li>
          <li>
            <Link
              to="/teacher-salary"
              className={`${styles.menuItem} ${
                isActive("/teacher-salary") ? styles.menuItemActive : ""
              }`}
            >
              <FaMoneyCheckAlt /> Lương giáo viên
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className={`${styles.menuItem} ${
                isActive("/profile") ? styles.menuItemActive : ""
              }`}
            >
              <FaCog /> Cài đặt & hồ sơ
            </Link>
          </li>

          <li>
            <Link
              to="/facility"
              className={`${styles.menuItem} ${
                isActive("/facility") ? styles.menuItemActive : ""
              }`}
            >
              <FaTools /> Quản lý cơ sở vật chất
            </Link>
          </li>
          <li>
            <Link
              to="/expense-management"
              className={`${styles.menuItem} ${
                isActive("/expense-management") ? styles.menuItemActive : ""
              }`}
            >
              <FaMoneyBillWave /> Quản lí chi phí
            </Link>
          </li>
        </ul>
      </nav>

      {/* User Info và Logout */}
      <div className={styles.userInfo}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            <FaUser />
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>
              {currentUser?.name || currentUser?.email || "User"}
            </div>
            <div className={styles.userRole}>
              {currentUser?.role === "admin" && "Quản trị viên"}
              {currentUser?.role === "teacher" && "Giáo viên"}
              {currentUser?.role === "student" && "Học sinh"}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutButton}>
          <FaSignOutAlt />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
