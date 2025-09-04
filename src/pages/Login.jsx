import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaSpinner, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { message } from "antd";
import { createDemoUsersInFirestore } from "../utils/createDemoUsers";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        // Hiển thị lỗi chi tiết từ loginUser
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
        onSubmit={handleLogin}
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 4px 32px #0002",
          padding: 40,
          minWidth: 340,
          maxWidth: 380,
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
          Đăng nhập
        </div>
        <div
          style={{
            color: "#888",
            fontSize: 15,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Quản lý trường học Anh Dương
        </div>

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
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div style={{ textAlign: "center", marginTop: 8, fontSize: 15 }}>
          Chưa có tài khoản?{" "}
          <span
            style={{ color: "#1976d2", cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/register")}
          >
            Đăng ký
          </span>
        </div>

        {/* Nút tạo demo users */}
        <button
          type="button"
          onClick={handleCreateDemoUsers}
          disabled={loading}
          style={{
            background: "#17a2b8",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <FaUsers />
          Tạo tài khoản demo
        </button>

        {/* Demo accounts info */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            padding: 12,
            marginTop: 8,
            background: "#f9f9f9",
            fontSize: 12,
            color: "#666",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Tài khoản demo:
          </div>
          <div style={{ lineHeight: 1.4 }}>
            <div>
              <strong>Admin:</strong> admin@school.vn / admin123
            </div>
            <div>
              <strong>Giáo viên:</strong> teacher@school.vn / teacher123
            </div>
            <div>
              <strong>Học sinh:</strong> student@school.vn / student123
            </div>
          </div>
        </div>
      </form>

      <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
    </div>
  );
}
