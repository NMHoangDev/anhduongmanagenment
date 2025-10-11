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
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { message, Select } from "antd";
import { registerUser } from "../services/authService";

const { Option } = Select;

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    address: "",
    role: "student",
    subjects: "",
    gradeLevel: "",
    teachingExperience: 0,
    qualifications: "",
    grade: "",
    class: "",
    parentName: "",
    parentPhone: "",
    dateOfBirth: "",
    gender: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { register } = useAuth();

  const totalSteps = 3;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.email.trim()) {
          newErrors.email = "Email là bắt buộc";
        } else if (!validateEmail(formData.email)) {
          newErrors.email = "Email không hợp lệ";
        }

        if (!formData.name.trim()) {
          newErrors.name = "Họ và tên là bắt buộc";
        } else if (formData.name.trim().length < 2) {
          newErrors.name = "Họ và tên phải có ít nhất 2 ký tự";
        }

        if (!formData.role) {
          newErrors.role = "Vui lòng chọn vai trò";
        }

        if (formData.phone && !validatePhone(formData.phone)) {
          newErrors.phone = "Số điện thoại không hợp lệ (10-11 số)";
        }

        break;

      case 2:
        if (formData.role === "teacher") {
          if (!formData.subjects.trim()) {
            newErrors.subjects = "Môn dạy là bắt buộc cho giáo viên";
          }

          if (!formData.gradeLevel) {
            newErrors.gradeLevel = "Vui lòng chọn khối lớp";
          }

          if (formData.teachingExperience < 0) {
            newErrors.teachingExperience = "Số năm kinh nghiệm không được âm";
          }
        }

        if (formData.role === "student") {
          if (!formData.class.trim()) {
            newErrors.class = "Lớp học là bắt buộc cho học sinh";
          }

          if (!formData.parentName.trim()) {
            newErrors.parentName = "Tên phụ huynh là bắt buộc";
          }

          if (formData.parentPhone && !validatePhone(formData.parentPhone)) {
            newErrors.parentPhone = "Số điện thoại phụ huynh không hợp lệ";
          }

          if (formData.dateOfBirth) {
            const birthDate = new Date(formData.dateOfBirth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();

            if (age < 5 || age > 18) {
              newErrors.dateOfBirth = "Tuổi học sinh phải từ 5-18 tuổi";
            }
          }
        }

        break;

      case 3:
        if (!formData.password) {
          newErrors.password = "Mật khẩu là bắt buộc";
        } else if (formData.password.length < 6) {
          newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        } else if (!/(?=.*[a-zA-Z])/.test(formData.password)) {
          newErrors.password = "Mật khẩu phải chứa ít nhất 1 chữ cái";
        }

        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }

        break;

      default:
        break;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      showError(firstError);
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    setLoading(true);

    try {
      const userData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        role: formData.role,
      };

      if (formData.role === "teacher") {
        userData.subjects = formData.subjects.trim();
        userData.gradeLevel = formData.gradeLevel;
        userData.teachingExperience =
          parseInt(formData.teachingExperience) || 0;
        userData.qualifications = formData.qualifications.trim();
        userData.gender = formData.gender || "";
      }

      if (formData.role === "student") {
        userData.grade = formData.grade;
        userData.class = formData.class.trim();
        userData.parentName = formData.parentName.trim();
        userData.parentPhone = formData.parentPhone.trim();
        userData.dateOfBirth = formData.dateOfBirth;
        userData.gender = formData.gender;
      }

      userData.password = formData.password;

      const result = await registerUser(
        formData.email.trim(),
        formData.password,
        userData
      );

      if (result.success) {
        message.success("Đăng ký thành công! Chào mừng bạn đến với hệ thống.");

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
        showError(result.error || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      if (error.code === "auth/email-already-in-use") {
        showError("Email này đã được sử dụng. Vui lòng chọn email khác.");
      } else if (error.code === "auth/weak-password") {
        showError("Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.");
      } else if (error.code === "auth/network-request-failed") {
        showError("Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.");
      } else {
        showError("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3 className="step-title">Thông tin cơ bản</h3>
            <p className="step-description">
              Nhập thông tin cá nhân và vai trò của bạn
            </p>

            <div className="input-group">
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`form-input ${errors.email ? "error" : ""}`}
                  required
                />
                {errors.email && (
                  <div className="field-error">
                    <FaExclamationTriangle />
                    {errors.email}
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Họ và tên *"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`form-input ${errors.name ? "error" : ""}`}
                  required
                />
                {errors.name && (
                  <div className="field-error">
                    <FaExclamationTriangle />
                    {errors.name}
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <FaUserTag className="input-icon" />
                <Select
                  value={formData.role}
                  onChange={(value) => handleInputChange("role", value)}
                  className={`role-select ${errors.role ? "error" : ""}`}
                  bordered={false}
                  placeholder="Chọn vai trò *"
                >
                  <Option value="student">Học sinh</Option>
                  <Option value="teacher">Giáo viên</Option>
                </Select>
                {errors.role && (
                  <div className="field-error">
                    <FaExclamationTriangle />
                    {errors.role}
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <FaPhone className="input-icon" />
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={`form-input ${errors.phone ? "error" : ""}`}
                />
                {errors.phone && (
                  <div className="field-error">
                    <FaExclamationTriangle />
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <FaMapMarkerAlt className="input-icon" />
                <input
                  type="text"
                  placeholder="Địa chỉ"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h3 className="step-title">
              {formData.role === "teacher"
                ? "Thông tin giảng dạy"
                : "Thông tin học tập"}
            </h3>
            <p className="step-description">
              {formData.role === "teacher"
                ? "Nhập thông tin về môn dạy và kinh nghiệm"
                : "Nhập thông tin về lớp học và phụ huynh"}
            </p>

            {formData.role === "teacher" ? (
              <>
                <div className="input-group">
                  <div className="input-wrapper">
                    <FaGraduationCap className="input-icon" />
                    <input
                      type="text"
                      placeholder="Môn dạy (VD: Toán, Văn, Anh) *"
                      value={formData.subjects}
                      onChange={(e) =>
                        handleInputChange("subjects", e.target.value)
                      }
                      className={`form-input ${errors.subjects ? "error" : ""}`}
                    />
                    {errors.subjects && (
                      <div className="field-error">
                        <FaExclamationTriangle />
                        {errors.subjects}
                      </div>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <FaChalkboardTeacher className="input-icon" />
                    <select
                      value={formData.gradeLevel}
                      onChange={(e) =>
                        handleInputChange("gradeLevel", e.target.value)
                      }
                      className={`form-input form-select ${
                        errors.gradeLevel ? "error" : ""
                      }`}
                    >
                      <option value="">Chọn khối lớp *</option>
                      <option value="1">Khối 1</option>
                      <option value="2">Khối 2</option>
                      <option value="3">Khối 3</option>
                      <option value="4">Khối 4</option>
                      <option value="5">Khối 5</option>
                      <option value="Tất cả">Tất cả khối</option>
                    </select>
                    {errors.gradeLevel && (
                      <div className="field-error">
                        <FaExclamationTriangle />
                        {errors.gradeLevel}
                      </div>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <FaUserTie className="input-icon" />
                    <input
                      type="number"
                      placeholder="Số năm kinh nghiệm"
                      value={formData.teachingExperience}
                      onChange={(e) =>
                        handleInputChange("teachingExperience", e.target.value)
                      }
                      min="0"
                      max="50"
                      className={`form-input ${
                        errors.teachingExperience ? "error" : ""
                      }`}
                    />
                    {errors.teachingExperience && (
                      <div className="field-error">
                        <FaExclamationTriangle />
                        {errors.teachingExperience}
                      </div>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <FaAward className="input-icon" />
                    <input
                      type="text"
                      placeholder="Bằng cấp, chứng chỉ"
                      value={formData.qualifications}
                      onChange={(e) =>
                        handleInputChange("qualifications", e.target.value)
                      }
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <FaVenusMars className="input-icon" />
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className="form-input form-select"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <div className="input-wrapper">
                    <FaSchool className="input-icon" />
                    <input
                      type="text"
                      placeholder="Lớp (VD: 5A, 3B) *"
                      value={formData.class}
                      onChange={(e) =>
                        handleInputChange("class", e.target.value)
                      }
                      className={`form-input ${errors.class ? "error" : ""}`}
                    />
                    {errors.class && (
                      <div className="field-error">
                        <FaExclamationTriangle />
                        {errors.class}
                      </div>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <FaUserFriends className="input-icon" />
                    <input
                      type="text"
                      placeholder="Tên phụ huynh *"
                      value={formData.parentName}
                      onChange={(e) =>
                        handleInputChange("parentName", e.target.value)
                      }
                      className={`form-input ${
                        errors.parentName ? "error" : ""
                      }`}
                    />
                    {errors.parentName && (
                      <div className="field-error">
                        <FaExclamationTriangle />
                        {errors.parentName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <FaPhone className="input-icon" />
                    <input
                      type="tel"
                      placeholder="SĐT phụ huynh"
                      value={formData.parentPhone}
                      onChange={(e) =>
                        handleInputChange("parentPhone", e.target.value)
                      }
                      className={`form-input ${
                        errors.parentPhone ? "error" : ""
                      }`}
                    />
                    {errors.parentPhone && (
                      <div className="field-error">
                        <FaExclamationTriangle />
                        {errors.parentPhone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <FaCalendarAlt className="input-icon" />
                    <input
                      type="date"
                      placeholder="Ngày sinh"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      className={`form-input ${
                        errors.dateOfBirth ? "error" : ""
                      }`}
                    />
                    {errors.dateOfBirth && (
                      <div className="field-error">
                        <FaExclamationTriangle />
                        {errors.dateOfBirth}
                      </div>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <FaVenusMars className="input-icon" />
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className="form-input form-select"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h3 className="step-title">Bảo mật tài khoản</h3>
            <p className="step-description">
              Tạo mật khẩu cho tài khoản của bạn
            </p>

            <div className="input-group">
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu *"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={`form-input ${errors.password ? "error" : ""}`}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                {errors.password && (
                  <div className="field-error">
                    <FaExclamationTriangle />
                    {errors.password}
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu *"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={`form-input ${
                    errors.confirmPassword ? "error" : ""
                  }`}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                {errors.confirmPassword && (
                  <div className="field-error">
                    <FaExclamationTriangle />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            <div className="password-requirements">
              <p className="requirements-title">Yêu cầu mật khẩu:</p>
              <ul className="requirements-list">
                <li className={formData.password.length >= 6 ? "valid" : ""}>
                  <FaCheck className="check-icon" />
                  Ít nhất 6 ký tự
                </li>
                <li
                  className={
                    /(?=.*[a-zA-Z])/.test(formData.password) ? "valid" : ""
                  }
                >
                  <FaCheck className="check-icon" />
                  Chứa ít nhất 1 chữ cái
                </li>
                <li
                  className={
                    formData.password === formData.confirmPassword &&
                    formData.password
                      ? "valid"
                      : ""
                  }
                >
                  <FaCheck className="check-icon" />
                  Mật khẩu xác nhận khớp
                </li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        {/* Left Side - Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Tham gia cùng
              <br />
              <span className="highlight">Trung tâm Ánh Dương</span>
            </h1>
            <p className="welcome-description">
              Đăng ký để trở thành thành viên của hệ thống quản lý trường học
              hiện đại. Kết nối với cộng đồng giáo dục và trải nghiệm công nghệ
              tiên tiến.
            </p>

            {/* Progress Steps */}
            <div className="progress-container">
              <div className="progress-steps">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="progress-step-wrapper">
                    <div
                      className={`progress-step ${
                        currentStep >= step ? "active" : ""
                      } ${currentStep > step ? "completed" : ""}`}
                    >
                      {currentStep > step ? <FaCheck /> : step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`progress-line ${
                          currentStep > step ? "completed" : ""
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="progress-labels">
                <span className={currentStep >= 1 ? "active" : ""}>Cơ bản</span>
                <span className={currentStep >= 2 ? "active" : ""}>
                  Chi tiết
                </span>
                <span className={currentStep >= 3 ? "active" : ""}>
                  Bảo mật
                </span>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="geometric-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
              <div className="shape shape-4"></div>
              <div className="shape shape-5"></div>
              <div className="shape shape-6"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="register-section">
          <div className="register-form-container">
            <div className="form-header">
              <h2 className="form-title">ĐĂNG KÝ</h2>
              <p className="form-subtitle">
                Bước {currentStep} / {totalSteps}
              </p>
            </div>

            <form onSubmit={handleRegister} className="register-form">
              {renderStepContent()}

              <div className="form-navigation">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="nav-btn prev-btn"
                  >
                    <FaArrowLeft />
                    Quay lại
                  </button>
                )}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="nav-btn next-btn"
                  >
                    Tiếp theo
                    <FaArrowRight />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className={`nav-btn register-btn ${
                      loading ? "loading" : ""
                    }`}
                  >
                    {loading && <FaSpinner className="spinner" />}
                    {loading ? "Đang đăng ký..." : "ĐĂNG KÝ"}
                  </button>
                )}
              </div>

              <div className="login-link">
                Đã có tài khoản?{" "}
                <span onClick={() => navigate("/login")} className="link">
                  Đăng nhập ngay
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="error-modal-overlay" onClick={closeErrorModal}>
          <div className="error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="error-modal-header">
              <FaExclamationTriangle className="error-icon" />
              <h3>Thông báo lỗi</h3>
              <button className="close-btn" onClick={closeErrorModal}>
                <FaTimes />
              </button>
            </div>
            <div className="error-modal-body">
              <p>{errorMessage}</p>
            </div>
            <div className="error-modal-footer">
              <button className="error-btn-ok" onClick={closeErrorModal}>
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .register-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .register-content {
          display: flex;
          background: white;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 1.25rem 3.75rem rgba(0, 0, 0, 0.15);
          max-width: 75rem;
          width: 100%;
          min-height: 37.5rem;
        }

        .welcome-section {
          flex: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 3.75rem 3.125rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .welcome-content {
          position: relative;
          z-index: 2;
        }

        .welcome-title {
          font-size: 2.625rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .highlight {
          background: linear-gradient(45deg, #ffd89b 0%, #19547b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .welcome-description {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }

        .progress-container {
          margin-bottom: 2.5rem;
        }

        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .progress-step-wrapper {
          display: flex;
          align-items: center;
        }

        .progress-step {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 0.125rem solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .progress-step.active {
          background: rgba(255, 255, 255, 0.9);
          border-color: white;
          color: #667eea;
        }

        .progress-step.completed {
          background: white;
          border-color: white;
          color: #667eea;
        }

        .progress-line {
          width: 3rem;
          height: 0.125rem;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .progress-line.completed {
          background: white;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          max-width: 12rem;
          margin: 0 auto;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .progress-labels span.active {
          color: white;
        }

        .geometric-shapes {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }

        .shape {
          position: absolute;
          border-radius: 3.125rem;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.05)
          );
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 5rem;
          height: 12.5rem;
          top: 10%;
          right: 15%;
          transform: rotate(45deg);
          animation-delay: 0s;
        }

        .shape-2 {
          width: 3.75rem;
          height: 9.375rem;
          top: 30%;
          right: 25%;
          transform: rotate(-30deg);
          animation-delay: 1s;
        }

        .shape-3 {
          width: 6.25rem;
          height: 15.625rem;
          top: 50%;
          right: 10%;
          transform: rotate(60deg);
          animation-delay: 2s;
        }

        .shape-4 {
          width: 4.375rem;
          height: 11.25rem;
          top: 70%;
          right: 30%;
          transform: rotate(-45deg);
          animation-delay: 3s;
        }

        .shape-5 {
          width: 5.625rem;
          height: 13.75rem;
          top: 20%;
          right: 5%;
          transform: rotate(30deg);
          animation-delay: 4s;
        }

        .shape-6 {
          width: 3.125rem;
          height: 7.5rem;
          top: 80%;
          right: 20%;
          transform: rotate(-60deg);
          animation-delay: 5s;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(var(--rotation, 0deg));
          }
          50% {
            transform: translateY(-1.25rem) rotate(var(--rotation, 0deg));
          }
        }

        .register-section {
          flex: 1.2;
          padding: 2.5rem;
          display: flex;
          align-items: center;
          background: #fafafa;
          overflow-y: auto;
          max-height: 100vh;
        }

        .register-form-container {
          width: 100%;
          max-width: 28rem;
          margin: 0 auto;
        }

        .form-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 0.5rem;
          letter-spacing: 0.0625rem;
        }

        .form-subtitle {
          color: #718096;
          font-size: 0.875rem;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .step-content {
          min-height: 20rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .step-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .step-description {
          color: #718096;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 0.875rem;
          color: #a0aec0;
          font-size: 1rem;
          z-index: 1;
        }

        .form-input {
          width: 100%;
          padding: 0.875rem 0.875rem 0.875rem 2.75rem;
          border: 0.125rem solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          background: white;
          transition: all 0.3s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.1875rem rgba(102, 126, 234, 0.1);
        }

        .form-input.error {
          border-color: #e53e3e;
          box-shadow: 0 0 0 0.1875rem rgba(229, 62, 62, 0.1);
        }

        .form-select {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
          appearance: none;
        }

        .role-select {
          width: 100%;
          border: 0.125rem solid #e2e8f0 !important;
          border-radius: 0.75rem !important;
          background: white !important;
          padding-left: 2.25rem !important;
        }

        .role-select.error {
          border-color: #e53e3e !important;
        }

        .role-select .ant-select-selector {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding-left: 0 !important;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 0.875rem;
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 1rem;
          z-index: 1;
        }

        .field-error {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: #e53e3e;
          font-size: 0.75rem;
          margin-top: 0.375rem;
          padding-left: 0.25rem;
        }

        .field-error svg {
          font-size: 0.75rem;
        }

        .password-requirements {
          background: #f7fafc;
          border: 0.0625rem solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 0.5rem;
        }

        .requirements-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: #4a5568;
          margin-bottom: 0.5rem;
        }

        .requirements-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .requirements-list li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #718096;
          transition: all 0.3s ease;
        }

        .requirements-list li.valid {
          color: #38a169;
        }

        .check-icon {
          font-size: 0.625rem;
          opacity: 0.3;
          transition: all 0.3s ease;
        }

        .requirements-list li.valid .check-icon {
          opacity: 1;
          color: #38a169;
        }

        .form-navigation {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 1rem;
        }

        .nav-btn {
          flex: 1;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .prev-btn {
          background: #e2e8f0;
          color: #4a5568;
        }

        .prev-btn:hover {
          background: #cbd5e0;
          transform: translateY(-0.0625rem);
        }

        .next-btn,
        .register-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.03125rem;
        }

        .next-btn:hover:not(.loading),
        .register-btn:hover:not(.loading) {
          transform: translateY(-0.125rem);
          box-shadow: 0 0.5rem 1.5625rem rgba(102, 126, 234, 0.3);
        }

        .register-btn.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .login-link {
          text-align: center;
          color: #718096;
          font-size: 0.875rem;
          margin-top: 1rem;
        }

        .link {
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
        }

        .link:hover {
          text-decoration: underline;
        }

        /* Error Modal Styles */
        .error-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .error-modal {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1.25rem 3.75rem rgba(0, 0, 0, 0.15);
          max-width: 25rem;
          width: 100%;
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-1.25rem) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .error-modal-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 0.0625rem solid #e2e8f0;
        }

        .error-icon {
          color: #e53e3e;
          font-size: 1.25rem;
        }

        .error-modal-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
          flex: 1;
        }

        .close-btn {
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          color: #718096;
          background: #f7fafc;
        }

        .error-modal-body {
          padding: 1rem 1.5rem;
        }

        .error-modal-body p {
          margin: 0;
          color: #4a5568;
          line-height: 1.5;
        }

        .error-modal-footer {
          padding: 1rem 1.5rem 1.5rem;
          display: flex;
          justify-content: flex-end;
        }

        .error-btn-ok {
          background: #e53e3e;
          color: white;
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .error-btn-ok:hover {
          background: #c53030;
          transform: translateY(-0.0625rem);
        }

        @media (max-width: 48rem) {
          .register-container {
            padding: 0.625rem;
          }

          .register-content {
            flex-direction: column;
            min-height: auto;
            max-width: none;
          }

          .welcome-section {
            padding: 2.5rem 1.875rem;
            text-align: center;
          }

          .welcome-title {
            font-size: 2rem;
          }

          .register-section {
            padding: 2.5rem 1.875rem;
            max-height: none;
          }

          .geometric-shapes {
            display: none;
          }

          .progress-steps {
            margin-bottom: 0.5rem;
          }

          .step-content {
            min-height: 15rem;
          }

          .error-modal {
            margin: 1rem;
          }
        }

        @media (max-width: 30rem) {
          .register-container {
            padding: 0.5rem;
          }

          .welcome-section {
            padding: 2rem 1.5rem;
          }

          .welcome-title {
            font-size: 1.75rem;
          }

          .register-section {
            padding: 2rem 1.5rem;
          }

          .form-title {
            font-size: 1.5rem;
          }

          .step-content {
            gap: 1rem;
            min-height: 12rem;
          }

          .form-navigation {
            flex-direction: column;
          }

          .nav-btn {
            width: 100%;
          }

          .error-modal-header {
            padding: 1rem 1rem 0.75rem;
          }

          .error-modal-body {
            padding: 0.75rem 1rem;
          }

          .error-modal-footer {
            padding: 0.75rem 1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
