import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { message } from "antd";

const RegisterTest = () => {
  const [email] = useState("teacher.test@school.vn");
  const [password] = useState("123456");
  const [name] = useState("Giáo viên Test");
  const [role, setRole] = useState("teacher");
  const { register, currentUser, isAuthenticated } = useAuth();

  const handleTestRegister = async () => {
    console.log("Bắt đầu test đăng ký...");
    try {
      const userData = {
        name,
        role,
        phone: "0123456789",
        address: "Huế, Việt Nam",
      };

      const result = await register(email, password, userData);
      console.log("Kết quả đăng ký:", result);

      if (result.success) {
        message.success("Đăng ký thành công!");
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error("Lỗi test register:", error);
      message.error("Có lỗi xảy ra");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>Test Đăng Ký</h2>

      <div
        style={{
          marginBottom: 20,
          padding: 16,
          background: "#f0f0f0",
          borderRadius: 8,
        }}
      >
        <h3>Thông tin đăng ký:</h3>
        <div>Email: {email}</div>
        <div>Password: {password}</div>
        <div>Name: {name}</div>
        <div>Role: {role}</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Role: </label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>

      <button
        onClick={handleTestRegister}
        style={{
          padding: "10px 20px",
          background: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: 4,
          marginRight: 10,
        }}
      >
        Test Đăng Ký
      </button>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          background: "#e8f5e8",
          borderRadius: 8,
        }}
      >
        <h3>Trạng thái hiện tại:</h3>
        <p>Đã đăng nhập: {isAuthenticated ? "Có" : "Không"}</p>
        <p>User hiện tại: {JSON.stringify(currentUser, null, 2)}</p>
      </div>

      {currentUser?.role === "teacher" && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: "#fff3cd",
            borderRadius: 8,
          }}
        >
          <h3>✅ Teacher Routes Test:</h3>
          <p>Người dùng có role teacher - có thể truy cập các route teacher</p>
          <div>
            <a
              href="/teacher/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              Test /teacher/dashboard
            </a>
          </div>
          <div>
            <a
              href="/teacher/profile"
              target="_blank"
              rel="noopener noreferrer"
            >
              Test /teacher/profile
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterTest;
