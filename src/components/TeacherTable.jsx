import React from "react";
import DefaultAvatar from "./DefaultAvatar";

export default function TeacherTable({
  teachers,
  onRowClick,
  onEdit,
  onDelete,
}) {
  // Ngăn chặn sự kiện nổi lên khi click vào nút
  const handleActionClick = (e) => {
    e.stopPropagation();
  };

  // Hiển thị các môn học dưới dạng chuỗi
  const renderSubjects = (teacher) => {
    if (teacher.subjects && teacher.subjects.length > 0) {
      return teacher.subjects.join(", ");
    }
    return "Chưa phân công";
  };

  return (
    <table
      style={{
        width: "100%",
        background: "#fff",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 2px 8px #eee",
        borderCollapse: "collapse",
        marginTop: 24,
      }}
    >
      <thead style={{ background: "#f3f6fd" }}>
        <tr>
          <th
            style={{ padding: "12px 16px", textAlign: "left", width: "60px" }}
          >
            Avatar
          </th>
          <th style={{ padding: "12px 16px", textAlign: "left" }}>Name</th>
          <th style={{ padding: "12px 16px", textAlign: "left" }}>Email</th>
          <th style={{ padding: "12px 16px", textAlign: "left" }}>Subject</th>
          <th style={{ padding: "12px 16px", textAlign: "left" }}>Phone</th>
          <th style={{ padding: "12px 16px", textAlign: "center" }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {teachers.length === 0 ? (
          <tr>
            <td
              colSpan={6}
              style={{ textAlign: "center", padding: 32, color: "#888" }}
            >
              No teachers found.
            </td>
          </tr>
        ) : (
          teachers.map((teacher) => (
            <tr
              key={teacher.id}
              onClick={() => onRowClick && onRowClick(teacher)}
              style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
            >
              <td style={{ padding: "10px 16px" }}>
                {teacher.avatar ? (
                  <img
                    src={teacher.avatar}
                    alt="avatar"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <DefaultAvatar name={teacher.name} />
                )}
              </td>
              <td
                style={{ padding: "10px 16px", fontWeight: 500, color: "#333" }}
              >
                {teacher.name}
              </td>
              <td style={{ padding: "10px 16px", color: "#555" }}>
                {teacher.email}
              </td>
              <td style={{ padding: "10px 16px", color: "#555" }}>
                {renderSubjects(teacher)}
              </td>
              <td style={{ padding: "10px 16px", color: "#555" }}>
                {teacher.phone}
              </td>
              <td
                style={{ padding: "10px 16px", textAlign: "center" }}
                onClick={handleActionClick}
              >
                <button
                  onClick={() => onEdit(teacher)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#1976d2",
                    cursor: "pointer",
                    marginRight: 16,
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Sửa
                </button>
                <button
                  onClick={() => onDelete(teacher.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f44336",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
