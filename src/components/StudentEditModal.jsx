import React, { useState, useEffect } from "react";
import * as classesService from "../services/classesService";

// Reusing styles from TimetableEditModal for consistency
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  background: "white",
  padding: "30px",
  borderRadius: "12px",
  width: "90%",
  maxWidth: "550px", // A bit wider for more fields
  boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
};

const inputGroupStyle = {
  marginBottom: "18px",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "600",
  color: "#444",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "15px",
};

const buttonGroupStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "25px",
};

const buttonStyle = {
  padding: "10px 20px",
  borderRadius: "6px",
  border: "none",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const StudentEditModal = ({ isOpen, onClose, student, onSave }) => {
  const [formData, setFormData] = useState({});
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const data = await classesService.getAllClasses();
    setClasses(data);
  };

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        classId: student.classId || "",
        grade: student.grade || "",
        dob: student.dob || "",
        parentName: student.parentName || "",
        contact: student.contact || "",
        avatar: student.avatar || "",
        status: student.status || "studying",
      });
    } else {
      setFormData({
        name: "",
        classId: "",
        grade: "",
        dob: "",
        parentName: "",
        contact: "",
        avatar: "",
        status: "studying",
      });
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "classId") {
      const selectedClass = classes.find((cls) => cls.id === value);
      setFormData((prev) => ({
        ...prev,
        classId: value,
        grade: selectedClass?.grade || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isNewStudent = !student || !student.id;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: "25px", color: "#005f73" }}>
          {isNewStudent ? "Thêm học sinh mới" : "Cập nhật thông tin học sinh"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ ...inputGroupStyle, flex: 1 }}>
              <label style={labelStyle}>Họ và tên</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ ...inputGroupStyle, flex: 1 }}>
              <label style={labelStyle}>Lớp</label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                style={inputStyle}
                required
              >
                <option value="">-- Chọn lớp --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} (Khối {cls.grade})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ ...inputGroupStyle, flex: 1 }}>
              <label style={labelStyle}>Ngày sinh</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div style={{ ...inputGroupStyle, flex: 1 }}>
              <label style={labelStyle}>Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="studying">Đang học</option>
                <option value="dropped_out">Đã nghỉ học</option>
                <option value="graduated">Đã tốt nghiệp</option>
              </select>
            </div>
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Tên phụ huynh</label>
            <input
              type="text"
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Số điện thoại phụ huynh</label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>Link ảnh đại diện</label>
            <input
              type="text"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Để trống nếu muốn dùng ảnh mặc định"
            />
          </div>

          <div style={buttonGroupStyle}>
            <button
              type="button"
              onClick={onClose}
              style={{ ...buttonStyle, background: "#eee" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{ ...buttonStyle, background: "#007bff", color: "white" }}
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentEditModal;
