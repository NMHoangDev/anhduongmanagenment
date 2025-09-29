import React, { useState } from "react";
import { FaEdit, FaTrash, FaEye, FaUser, FaUserTie } from "react-icons/fa";

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
          borderCollapse: "collapse",
          fontSize: "15px",
          background: "#f8fbff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                border: "1px solid #ddd",
                minWidth: "120px",
              }}
            >
              Tên lớp
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "center",
                border: "1px solid #ddd",
                width: "80px",
              }}
            >
              Khối
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "left",
                border: "1px solid #ddd",
                minWidth: "150px",
              }}
            >
              Giáo viên chủ nhiệm
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "center",
                border: "1px solid #ddd",
                width: "100px",
              }}
            >
              Số học sinh
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "center",
                border: "1px solid #ddd",
                width: "120px",
              }}
            >
              Cơ sở
            </th>
            <th
              style={{
                padding: "12px",
                textAlign: "center",
                border: "1px solid #ddd",
                width: "150px",
              }}
            >
              Hành động
            </th>
          </tr>
        </thead>
        <tbody>
          {classes.length === 0 ? (
            <tr>
              <td
                colSpan={6}
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
            classes.map((cls, index) => (
              <tr
                key={cls.id}
                style={{
                  background: index % 2 === 0 ? "#fff" : "#f9f9f9",
                  borderBottom: "1px solid #eee",
                }}
              >
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaUser style={{ color: "#666", fontSize: "14px" }} />
                    <strong style={{ color: "#333" }}>{cls.name}</strong>
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      background: "#e6f7ff",
                      color: "#1890ff",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {cls.grade}
                  </span>
                </td>
                <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaUserTie style={{ color: "#52c41a", fontSize: "14px" }} />
                    {cls.homeRoomTeacher ? (
                      <div>
                        <div
                          style={{
                            fontWeight: "500",
                            color: "#333",
                          }}
                        >
                          {cls.homeRoomTeacher.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          {cls.homeRoomTeacher.email}
                        </div>
                      </div>
                    ) : (
                      <span
                        style={{
                          color: "#ff4d4f",
                          fontStyle: "italic",
                        }}
                      >
                        Chưa có giáo viên chủ nhiệm
                      </span>
                    )}
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      background: "#f6ffed",
                      color: "#52c41a",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {cls.studentsDetails?.length || 0}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  {cls.facility}
                </td>
                <td
                  style={{
                    padding: "12px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={() => onView(cls)}
                      style={{
                        background: "#1890ff",
                        color: "white",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Xem chi tiết"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => onEdit(cls)}
                      style={{
                        background: "#52c41a",
                        color: "white",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Sửa thông tin"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => onDelete(cls.id)}
                      style={{
                        background: "#ff4d4f",
                        color: "white",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Xóa lớp học"
                    >
                      <FaTrash />
                    </button>
                  </div>
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
            <h3
              style={{
                fontSize: 22,
                color: "#1976d2",
                marginBottom: 18,
                textAlign: "center",
              }}
            >
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
