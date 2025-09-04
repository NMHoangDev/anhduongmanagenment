import React from "react";

const ClassTableRow = ({ cls, onEdit, onDelete, onView }) => {
  const handleActionClick = (e) => {
    e.stopPropagation();
  };

  return (
    <tr
      key={cls.id}
      onClick={() => onView && onView(cls)}
      style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
    >
      <td style={{ padding: "10px 16px", fontWeight: 500, color: "#333" }}>
        {cls.name}
      </td>
      <td style={{ padding: "10px 16px", color: "#555" }}>{cls.grade}</td>
      <td style={{ padding: "10px 16px", color: "#555" }}>{cls.teacher}</td>
      <td style={{ padding: "10px 16px", color: "#555" }}>{cls.facility}</td>
      <td style={{ padding: "10px 16px", color: "#555" }}>
        {cls.students ? cls.students.length : 0}
      </td>
      <td
        style={{ padding: "10px 16px", textAlign: "center" }}
        onClick={handleActionClick}
      >
        <button
          onClick={() => onEdit(cls)}
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
          onClick={() => onDelete(cls.id)}
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
  );
};

export default ClassTableRow;
