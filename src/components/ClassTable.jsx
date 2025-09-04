import React, { useState } from "react";
import { FaEdit, FaTrash, FaUserGraduate } from "react-icons/fa";

export default function ClassTable({ classes, onEdit, onDelete, onView }) {
  const [openClass, setOpenClass] = useState(null);

  const handleRowClick = (cls) => {
    setOpenClass(cls);
    if (onView) onView(cls);
  };

  const handleCloseModal = () => setOpenClass(null);

  return (
    <div style={{ position: "relative" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          fontSize: "15px",
          background: "#f8fbff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Tên lớp</th>
            <th style={thStyle}>Khối</th>
            <th style={thStyle}>Giáo viên chủ nhiệm</th>
            <th style={thStyle}>Số học sinh</th>
            <th style={thStyle}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {classes.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  textAlign: "center",
                  padding: 32,
                  color: "#888",
                  background: "#f3f6fd",
                }}
              >
                Không tìm thấy lớp học nào.
              </td>
            </tr>
          ) : (
            classes.map((cls) => (
              <tr
                key={cls.id}
                style={{
                  background: "#fff",
                  borderBottom: "1px solid #e3eaf5",
                  cursor: "pointer",
                  transition: "background 0.2s, box-shadow 0.2s",
                  boxShadow:
                    openClass && openClass.id === cls.id
                      ? "0 2px 12px rgba(0,123,255,0.08)"
                      : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#eaf4ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    openClass && openClass.id === cls.id ? "#eaf4ff" : "#fff")
                }
                onClick={() => handleRowClick(cls)}
              >
                <td style={tdStyle}>{cls.name}</td>
                <td style={tdStyle}>{cls.grade}</td>
                <td style={tdStyle}>
                  {cls.teacher ? (
                    cls.teacher.name || cls.teacher.id || "Chưa có thông tin"
                  ) : (
                    <span style={{ color: "#999", fontStyle: "italic" }}>
                      Chưa có giáo viên
                    </span>
                  )}
                </td>
                <td style={{ ...tdStyle, fontWeight: 600, color: "#1976d2" }}>
                  <FaUserGraduate style={{ marginRight: 6 }} />
                  {cls.students ? cls.students.length : 0}
                </td>
                <td style={{ ...tdStyle, textAlign: "center" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(cls);
                    }}
                    style={{
                      background: "linear-gradient(90deg,#e3f0ff,#cce2ff)",
                      border: "none",
                      color: "#1976d2",
                      cursor: "pointer",
                      marginRight: 12,
                      fontSize: "14px",
                      fontWeight: "600",
                      borderRadius: "6px",
                      padding: "6px 16px",
                      boxShadow: "0 2px 8px rgba(25,118,210,0.08)",
                      transition: "background 0.2s",
                    }}
                  >
                    <FaEdit /> Sửa
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(cls.id);
                    }}
                    style={{
                      background: "linear-gradient(90deg,#ffe3e3,#ffd6d6)",
                      border: "none",
                      color: "#f44336",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      borderRadius: "6px",
                      padding: "6px 16px",
                      boxShadow: "0 2px 8px rgba(244,67,54,0.08)",
                      transition: "background 0.2s",
                    }}
                  >
                    <FaTrash /> Xóa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Popup hiển thị danh sách học sinh */}
      {openClass && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              minWidth: 340,
              maxWidth: 420,
              padding: "32px 28px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 22, color: "#1976d2", marginBottom: 18 }}>
              Danh sách học sinh lớp {openClass.name}
            </h3>
            <ul style={{ paddingLeft: 0, marginBottom: 0 }}>
              {openClass.studentsDetails &&
              openClass.studentsDetails.length > 0 ? (
                openClass.studentsDetails.map((student, idx) => (
                  <li
                    key={student.id || idx}
                    style={{
                      listStyle: "none",
                      padding: "8px 0",
                      borderBottom: "1px solid #f0f0f0",
                      color: "#333",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 28,
                        height: 28,
                        background: "#e3f0ff",
                        borderRadius: "50%",
                        textAlign: "center",
                        lineHeight: "28px",
                        fontWeight: "600",
                        color: "#1976d2",
                        marginRight: 12,
                        fontSize: "15px",
                      }}
                    >
                      {idx + 1}
                    </span>
                    {student.name
                      ? `${student.name}${
                          student.grade ? ` - Lớp ${student.grade}` : ""
                        }`
                      : `Không tìm thấy thông tin cho học sinh ID: ${student.id}`}
                  </li>
                ))
              ) : (
                <li style={{ color: "#888", fontStyle: "italic" }}>
                  Không có học sinh nào trong lớp này.
                </li>
              )}
            </ul>
            <button
              onClick={handleCloseModal}
              style={{
                position: "absolute",
                top: 16,
                right: 18,
                background: "#f3f6fd",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                fontSize: 18,
                color: "#1976d2",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(25,118,210,0.08)",
              }}
              title="Đóng"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: "14px 18px",
  textAlign: "left",
  background: "linear-gradient(90deg,#e3f0ff,#f8fbff)",
  color: "#1976d2",
  fontWeight: "700",
  fontSize: "16px",
  borderBottom: "2px solid #e3eaf5",
};

const tdStyle = {
  padding: "13px 18px",
  textAlign: "left",
  borderBottom: "1px solid #e3eaf5",
  fontSize: "15px",
  background: "none",
  transition: "background 0.2s",
};
