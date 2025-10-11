import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaLock,
  FaSpinner,
  FaUsers,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { message } from "antd";
import { createDemoUsersInFirestore } from "../utils/createDemoUsers";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const redirectPath =
        currentUser.role === "teacher"
          ? "/teacher/dashboard"
          : currentUser.role === "student"
          ? "/student/dashboard"
          : "/dashboard";

      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      message.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        message.success(`Chào mừng ${result.user.name || result.user.email}!`);

        const redirectPath =
          result.user.role === "teacher"
            ? "/teacher/dashboard"
            : result.user.role === "student"
            ? "/student/dashboard"
            : "/dashboard";

        navigate(redirectPath, { replace: true });
      } else {
        message.error(result.error || "Đăng nhập thất bại");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      message.error("Có lỗi xảy ra khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoUsers = async () => {
    if (
      !window.confirm(
        "Tạo tài khoản demo? Điều này sẽ tạo 3 tài khoản mẫu trong Firebase."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const results = await createDemoUsersInFirestore();
      const successful = results.filter((r) => r.success).length;
      const total = results.length;

      if (successful > 0) {
        message.success(`Đã tạo ${successful}/${total} tài khoản demo!`);
      } else {
        message.error("Không thể tạo tài khoản demo. Có thể đã tồn tại.");
      }
    } catch (error) {
      console.error("Lỗi tạo demo users:", error);
      message.error("Có lỗi xảy ra khi tạo tài khoản demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Left Side - Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1 className="welcome-title">
              Chào mừng đến với
              <br />
              <span className="highlight">Trung tâm Ánh Dương</span>
            </h1>
            <p className="welcome-description">
              Hệ thống quản lý trường học hiện đại, giúp kết nối giáo viên, học
              sinh và phụ huynh một cách hiệu quả nhất. Trải nghiệm giáo dục số
              hoá với công nghệ tiên tiến.
            </p>

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

        {/* Right Side - Login Form */}
        <div className="login-section">
          <div className="login-form-container">
            <div className="form-header">
              <h2 className="form-title">ĐĂNG NHẬP</h2>
              <p className="form-subtitle">Truy cập vào tài khoản của bạn</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="input-group">
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="email"
                    placeholder="Địa chỉ email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Ghi nhớ đăng nhập
                </label>
                <a href="#" className="forgot-password">
                  Quên mật khẩu?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`login-btn ${loading ? "loading" : ""}`}
              >
                {loading && <FaSpinner className="spinner" />}
                {loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
              </button>
              <div className="signup-link">
                Chưa có tài khoản?{" "}
                <span onClick={() => navigate("/register")} className="link">
                  Đăng ký ngay
                </span>
              </div>
            </form>

            {/* Demo accounts info */}
            <div className="demo-info">
              <div className="demo-header">Tài khoản demo:</div>
              <div className="demo-accounts">
                <div className="demo-account">
                  <strong>Admin:</strong> admin123test@gmail.com / 123123
                </div>
                <div className="demo-account">
                  <strong>Giáo viên:</strong> teachertest123@gmail.com / 123123
                </div>
                <div className="demo-account">
                  <strong>Học sinh:</strong> student1@school.vn / 123123
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .login-content {
          display: flex;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          max-width: 1000px;
          width: 100%;
          min-height: 600px;
        }

        .welcome-section {
          flex: 1.2;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 60px 50px;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .welcome-content {
          position: relative;
          z-index: 2;
        }

        .welcome-title {
          font-size: 42px;
          font-weight: 700;
          color: white;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .highlight {
          background: linear-gradient(45deg, #ffd89b 0%, #19547b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .welcome-description {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          margin-bottom: 40px;
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
          border-radius: 50px;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.05)
          );
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 80px;
          height: 200px;
          top: 10%;
          right: 15%;
          transform: rotate(45deg);
          animation-delay: 0s;
        }

        .shape-2 {
          width: 60px;
          height: 150px;
          top: 30%;
          right: 25%;
          transform: rotate(-30deg);
          animation-delay: 1s;
        }

        .shape-3 {
          width: 100px;
          height: 250px;
          top: 50%;
          right: 10%;
          transform: rotate(60deg);
          animation-delay: 2s;
        }

        .shape-4 {
          width: 70px;
          height: 180px;
          top: 70%;
          right: 30%;
          transform: rotate(-45deg);
          animation-delay: 3s;
        }

        .shape-5 {
          width: 90px;
          height: 220px;
          top: 20%;
          right: 5%;
          transform: rotate(30deg);
          animation-delay: 4s;
        }

        .shape-6 {
          width: 50px;
          height: 120px;
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
            transform: translateY(-20px) rotate(var(--rotation, 0deg));
          }
        }

        .login-section {
          flex: 1;
          padding: 50px 40px;
          display: flex;
          align-items: center;
          background: #fafafa;
        }

        .login-form-container {
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
        }

        .form-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .form-title {
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        .form-subtitle {
          color: #718096;
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #a0aec0;
          font-size: 16px;
          z-index: 1;
        }

        .form-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          background: white;
          transition: all 0.3s ease;
          outline: none;
        }

        .form-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          font-size: 16px;
          z-index: 1;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #4a5568;
        }

        .remember-me input[type="checkbox"] {
          display: none;
        }

        .checkmark {
          width: 18px;
          height: 18px;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          position: relative;
          transition: all 0.3s ease;
        }

        .remember-me input[type="checkbox"]:checked + .checkmark {
          background: #667eea;
          border-color: #667eea;
        }

        .remember-me input[type="checkbox"]:checked + .checkmark::after {
          content: "✓";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .forgot-password {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }

        .forgot-password:hover {
          text-decoration: underline;
        }

        .login-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .login-btn:hover:not(.loading) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .login-btn.loading {
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

        .divider {
          text-align: center;
          position: relative;
          color: #a0aec0;
          font-size: 14px;
        }

        .divider::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e2e8f0;
          z-index: 0;
        }

        .divider span {
          background: #fafafa;
          padding: 0 20px;
          position: relative;
          z-index: 1;
        }

        .demo-btn {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .demo-btn:hover {
          background: #667eea;
          color: white;
          transform: translateY(-1px);
        }

        .signup-link {
          text-align: center;
          color: #718096;
          font-size: 14px;
        }

        .link {
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
        }

        .link:hover {
          text-decoration: underline;
        }

        .demo-info {
          margin-top: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 12px;
        }

        .demo-header {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 12px;
        }

        .demo-accounts {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .demo-account {
          color: #718096;
          line-height: 1.4;
        }

        .demo-account strong {
          color: #4a5568;
        }

        @media (max-width: 768px) {
          .login-content {
            flex-direction: column;
            margin: 10px;
          }

          .welcome-section {
            padding: 40px 30px;
            text-align: center;
          }

          .welcome-title {
            font-size: 32px;
          }

          .login-section {
            padding: 40px 30px;
          }

          .geometric-shapes {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
