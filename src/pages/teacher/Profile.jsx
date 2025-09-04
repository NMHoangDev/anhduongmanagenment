import React, { useState } from "react";
import { updateTeacher } from "../../services/teacherService";
import { useAuth } from "../../context/AuthContext";

export default function TeacherProfile() {
  const { currentUser } = useAuth();

  // Debug log để kiểm tra currentUser
  console.log("🔍 TeacherProfile - currentUser:", currentUser);

  // Initialize profile từ currentUser hoặc fallback về fake data
  const [profile, setProfile] = useState({
    id: currentUser?.uid || "1",
    name: currentUser?.name || "Nguyễn Văn Bình",
    email: currentUser?.email || "binh.nguyen@tieuhoc.edu.vn",
    phone: currentUser?.phone || "0912345678",
    gender: currentUser?.gender || "Nam",
    age: currentUser?.age || 38,
    subject: currentUser?.subjects || "Toán",
    gradeLevel: currentUser?.gradeLevel || "",
    teachingExperience: currentUser?.teachingExperience || 0,
    qualifications: currentUser?.qualifications || "",
    address: currentUser?.address || "",
    avatar:
      currentUser?.avatar ||
      "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=facearea&w=256&h=256&facepad=2",
  });

  const [showChangePw, setShowChangePw] = useState(false);
  const [pw, setPw] = useState({ old: "", new1: "", new2: "" });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleChangePw = (e) => {
    e.preventDefault();
    // Fake change password
    setShowChangePw(false);
    setPw({ old: "", new1: "", new2: "" });
  };

  const handleSaveChanges = async () => {
    try {
      await updateTeacher(profile.id, profile);
      alert("Thông tin đã được cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin giáo viên: ", error);
      alert("Có lỗi xảy ra khi cập nhật thông tin.");
    }
  };

  return (
    <div
      style={{
        padding: 40,
        minHeight: "100vh",
        background: "#f6f6fa",
      }}
    >
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18 }}>
        Thông tin cá nhân
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 2px 8px #eee",
          padding: 32,
          display: "flex",
          gap: 32,
          alignItems: "center",
          marginBottom: 32,
          maxWidth: "100%",
        }}
      >
        <img
          src={profile.avatar}
          alt="avatar"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow: "0 2px 8px #4f8cff22",
            border: "3px solid #fff",
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
            {profile.name}
          </div>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 4 }}>
            Bộ môn: {profile.subject}
          </div>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 4 }}>
            Email: {profile.email}
          </div>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 4 }}>
            Điện thoại: {profile.phone}
          </div>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 4 }}>
            Giới tính: {profile.gender}
          </div>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 4 }}>
            Khối lớp: {profile.gradeLevel || "Chưa cập nhật"}
          </div>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 4 }}>
            Kinh nghiệm: {profile.teachingExperience} năm
          </div>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 4 }}>
            Bằng cấp: {profile.qualifications || "Chưa cập nhật"}
          </div>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 4 }}>
            Địa chỉ: {profile.address || "Chưa cập nhật"}
          </div>
          <div style={{ color: "#888", fontSize: 15, marginBottom: 4 }}>
            Tuổi: {profile.age}
          </div>
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 2px 8px #eee",
          padding: 32,
          marginBottom: 32,
          maxWidth: "100%",
        }}
      >
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>
          Cập nhật thông tin
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            name="name"
            value={profile.name}
            onChange={handleChange}
            placeholder="Họ tên"
            style={{
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 10,
              fontSize: 16,
            }}
          />
          <input
            name="email"
            value={profile.email}
            onChange={handleChange}
            placeholder="Email"
            style={{
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 10,
              fontSize: 16,
            }}
          />
          <input
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            placeholder="Điện thoại"
            style={{
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 10,
              fontSize: 16,
            }}
          />
          <input
            name="subject"
            value={profile.subject}
            onChange={handleChange}
            placeholder="Bộ môn"
            style={{
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 10,
              fontSize: 16,
            }}
          />
          <select
            name="gradeLevel"
            value={profile.gradeLevel}
            onChange={handleChange}
            style={{
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 10,
              fontSize: 16,
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
          <input
            name="teachingExperience"
            type="number"
            value={profile.teachingExperience}
            onChange={handleChange}
            placeholder="Số năm kinh nghiệm"
            min="0"
            style={{
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 10,
              fontSize: 16,
            }}
          />
          <input
            name="qualifications"
            value={profile.qualifications}
            onChange={handleChange}
            placeholder="Bằng cấp, chứng chỉ"
            style={{
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 10,
              fontSize: 16,
            }}
          />
          <input
            name="address"
            value={profile.address}
            onChange={handleChange}
            placeholder="Địa chỉ"
            style={{
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 10,
              fontSize: 16,
            }}
          />
          <select
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            style={{
              borderRadius: 8,
              border: "1px solid #ccc",
              padding: 10,
              fontSize: 16,
            }}
          >
            <option value="">Chọn giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
        <button
          onClick={handleSaveChanges}
          style={{
            marginTop: 18,
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Lưu thay đổi
        </button>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 2px 8px #eee",
          padding: 32,
          maxWidth: "100%",
        }}
      >
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>
          Đổi mật khẩu
        </h2>
        {!showChangePw ? (
          <button
            onClick={() => setShowChangePw(true)}
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 32px",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Đổi mật khẩu
          </button>
        ) : (
          <form
            onSubmit={handleChangePw}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              marginTop: 12,
            }}
          >
            <input
              type="password"
              placeholder="Mật khẩu cũ"
              value={pw.old}
              onChange={(e) => setPw({ ...pw, old: e.target.value })}
              style={{
                borderRadius: 8,
                border: "1px solid #ccc",
                padding: 10,
                fontSize: 16,
              }}
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={pw.new1}
              onChange={(e) => setPw({ ...pw, new1: e.target.value })}
              style={{
                borderRadius: 8,
                border: "1px solid #ccc",
                padding: 10,
                fontSize: 16,
              }}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={pw.new2}
              onChange={(e) => setPw({ ...pw, new2: e.target.value })}
              style={{
                borderRadius: 8,
                border: "1px solid #ccc",
                padding: 10,
                fontSize: 16,
              }}
            />
            <button
              type="submit"
              style={{
                background: "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 32px",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Lưu mật khẩu
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
