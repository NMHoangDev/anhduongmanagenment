import React, { useState } from "react";
import {
  FaUser,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSpinner,
  FaUserTag,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserTie,
  FaAward,
  FaSchool,
  FaUserFriends,
  FaCalendarAlt,
  FaVenusMars,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { message, Select } from "antd";
import { registerUser } from "../services/authService";

const { Option } = Select;

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    address: "",
    role: "student",
    // Thông tin đặc biệt cho teacher
    subjects: "",
    gradeLevel: "",
    teachingExperience: 0,
    qualifications: "",
    // Thông tin đặc biệt cho student
    grade: "",
    class: "",
    parentName: "",
    parentPhone: "",
    dateOfBirth: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password || !formData.name) {
      message.error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (formData.password.length < 6) {
      message.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        role: formData.role,
      };

      // Thêm thông tin đặc biệt cho teacher
      if (formData.role === "teacher") {
        userData.subjects = formData.subjects;
        userData.gradeLevel = formData.gradeLevel;
        userData.teachingExperience =
          parseInt(formData.teachingExperience) || 0;
        userData.qualifications = formData.qualifications;
        userData.gender = formData.gender || "";
      }

      // Thêm thông tin đặc biệt cho student
      if (formData.role === "student") {
        userData.grade = formData.grade;
        userData.class = formData.class;
        userData.parentName = formData.parentName;
        userData.parentPhone = formData.parentPhone;
        userData.dateOfBirth = formData.dateOfBirth;
        userData.gender = formData.gender;
      }
      console.log(userData);

      // Thêm password vào userData để truyền cho registerUser
      userData.password = formData.password;

      const result = await registerUser(
        formData.email,
        formData.password,
        userData
      );

      if (result.success) {
        message.success("Đăng ký thành công! Chào mừng bạn đến với hệ thống.");

        // Chuyển hướng dựa trên role
        switch (result.user.role) {
          case "admin":
            navigate("/dashboard");
            break;
          case "teacher":
            navigate("/teacher/dashboard");
            break;
          case "student":
          default:
            navigate("/student/dashboard");
            break;
        }
      } else {
        message.error(result.error || "Đăng ký thất bại");
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      message.error("Có lỗi xảy ra khi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f6fa",
      }}
    >
      <form
        onSubmit={handleRegister}
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 4px 32px #0002",
          padding: 40,
          minWidth: 340,
          maxWidth: 400,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 28,
            color: "#1976d2",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Đăng ký
        </div>
        <div
          style={{
            color: "#888",
            fontSize: 15,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Tạo tài khoản quản lý trường học
        </div>
        {/* Email */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f3f6fd",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <FaEnvelope
            style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
          />
          <input
            type="email"
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            disabled={loading}
            required
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 16,
              flex: 1,
              color: "#222",
            }}
          />
        </div>

        {/* Họ tên */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f3f6fd",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <FaUser style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }} />
          <input
            type="text"
            placeholder="Họ và tên *"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            disabled={loading}
            required
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 16,
              flex: 1,
              color: "#222",
            }}
          />
        </div>

        {/* Vai trò */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f3f6fd",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <FaUserTag
            style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
          />
          <Select
            value={formData.role}
            onChange={(value) => handleInputChange("role", value)}
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
            }}
            bordered={false}
            placeholder="Chọn vai trò"
          >
            <Option value="student">Học sinh</Option>
            <Option value="teacher">Giáo viên</Option>
          </Select>
        </div>

        {/* Số điện thoại */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f3f6fd",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <FaPhone style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }} />
          <input
            type="tel"
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            disabled={loading}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 16,
              flex: 1,
              color: "#222",
            }}
          />
        </div>

        {/* Địa chỉ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f3f6fd",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <FaMapMarkerAlt
            style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
          />
          <input
            type="text"
            placeholder="Địa chỉ"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            disabled={loading}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 16,
              flex: 1,
              color: "#222",
            }}
          />
        </div>

        {/* Teacher-specific fields */}
        {formData.role === "teacher" && (
          <>
            {/* Môn dạy */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f3f6fd",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <FaGraduationCap
                style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
              />
              <input
                type="text"
                placeholder="Môn dạy (VD: Toán, Văn, Anh)"
                value={formData.subjects}
                onChange={(e) => handleInputChange("subjects", e.target.value)}
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 16,
                  flex: 1,
                  color: "#222",
                }}
              />
            </div>

            {/* Khối lớp */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f3f6fd",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <FaChalkboardTeacher
                style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
              />
              <select
                value={formData.gradeLevel}
                onChange={(e) =>
                  handleInputChange("gradeLevel", e.target.value)
                }
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 16,
                  flex: 1,
                  color: "#222",
                  cursor: "pointer",
                }}
              >
                <option value="">Chọn khối lớp</option>
                <option value="1">Khối 1</option>
                <option value="2">Khối 2</option>
                <option value="3">Khối 3</option>
                <option value="4">Khối 4</option>
                <option value="5">Khối 5</option>
                <option value="Tất cả">Tất cả khối</option>
              </select>
            </div>

            {/* Kinh nghiệm */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f3f6fd",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <FaUserTie
                style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
              />
              <input
                type="number"
                placeholder="Số năm kinh nghiệm"
                value={formData.teachingExperience}
                onChange={(e) =>
                  handleInputChange("teachingExperience", e.target.value)
                }
                disabled={loading}
                min="0"
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 16,
                  flex: 1,
                  color: "#222",
                }}
              />
            </div>

            {/* Bằng cấp */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f3f6fd",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <FaAward
                style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
              />
              <input
                type="text"
                placeholder="Bằng cấp, chứng chỉ"
                value={formData.qualifications}
                onChange={(e) =>
                  handleInputChange("qualifications", e.target.value)
                }
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 16,
                  flex: 1,
                  color: "#222",
                }}
              />
            </div>
          </>
        )}

        {/* Student-specific fields */}
        {formData.role === "student" && (
          <>
            {/* Lớp */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f3f6fd",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <FaSchool
                style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
              />
              <input
                type="text"
                placeholder="Lớp (VD: 5A, 3B)"
                value={formData.class}
                onChange={(e) => handleInputChange("class", e.target.value)}
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 16,
                  flex: 1,
                  color: "#222",
                }}
              />
            </div>

            {/* Tên phụ huynh */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f3f6fd",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <FaUserFriends
                style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
              />
              <input
                type="text"
                placeholder="Tên phụ huynh"
                value={formData.parentName}
                onChange={(e) =>
                  handleInputChange("parentName", e.target.value)
                }
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 16,
                  flex: 1,
                  color: "#222",
                }}
              />
            </div>

            {/* Số điện thoại phụ huynh */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f3f6fd",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <FaPhone
                style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
              />
              <input
                type="tel"
                placeholder="SĐT phụ huynh"
                value={formData.parentPhone}
                onChange={(e) =>
                  handleInputChange("parentPhone", e.target.value)
                }
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 16,
                  flex: 1,
                  color: "#222",
                }}
              />
            </div>

            {/* Ngày sinh */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f3f6fd",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <FaCalendarAlt
                style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
              />
              <input
                type="date"
                placeholder="Ngày sinh"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 16,
                  flex: 1,
                  color: "#222",
                }}
              />
            </div>

            {/* Giới tính */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f3f6fd",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <FaVenusMars
                style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }}
              />
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange("gender", e.target.value)}
                disabled={loading}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 16,
                  flex: 1,
                  color: "#222",
                  cursor: "pointer",
                }}
              >
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
            </div>
          </>
        )}

        {/* Mật khẩu */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f3f6fd",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <FaLock style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }} />
          <input
            type="password"
            placeholder="Mật khẩu *"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            disabled={loading}
            required
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 16,
              flex: 1,
              color: "#222",
            }}
          />
        </div>

        {/* Xác nhận mật khẩu */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f3f6fd",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <FaLock style={{ color: "#1976d2", fontSize: 18, marginRight: 8 }} />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu *"
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            disabled={loading}
            required
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 16,
              flex: 1,
              color: "#222",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#ccc" : "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 0",
            fontWeight: 700,
            fontSize: 17,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 8,
            boxShadow: "0 2px 8px #1976d233",
            transition: "background 0.2s, box-shadow 0.2s, transform 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading && (
            <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
          )}
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        <div style={{ textAlign: "center", marginTop: 8, fontSize: 15 }}>
          Đã có tài khoản?{" "}
          <span
            style={{ color: "#1976d2", cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </span>
        </div>
      </form>

      <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .ant-select-dropdown {
                    background: white !important;
                }
            `}</style>
    </div>
  );
}
