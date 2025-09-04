import React from "react";
import DefaultAvatar from "./DefaultAvatar";

const StudentTableRow = ({ student, onDetailsClick, onEdit, onDelete }) => {
  const handleActionClick = (e) => {
    e.stopPropagation();
  };

  return (
    <tr
      key={student.id}
      onClick={() => onDetailsClick && onDetailsClick(student)}
      style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
    >
      <td style={{ padding: "10px 16px" }}>
        {student.avatar ? (
          <img
            src={student.avatar}
            alt="avatar"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <DefaultAvatar name={student.name} />
        )}
      </td>
      <td style={{ padding: "10px 16px", fontWeight: 500, color: "#333" }}>
        {student.name}
      </td>
      <td style={{ padding: "10px 16px", color: "#555" }}>{student.grade}</td>
      <td style={{ padding: "10px 16px", color: "#555" }}>{student.dob}</td>
      <td style={{ padding: "10px 16px", color: "#555" }}>{student.contact}</td>
      <td style={{ padding: "10px 16px", color: "#555" }}>
        {student.parentName}
      </td>
      <td
        style={{
          padding: "10px 16px",
          color: student.status === "studying" ? "#29d117" : "#1118f5",
        }}
      >
        {student.status === "studying" && "Đã học"}
        {student.status === "graduated" && "Đã tốt nghiệp"}
      </td>
      <td
        style={{ padding: "10px 16px", textAlign: "center" }}
        onClick={handleActionClick}
      >
        <button
          onClick={() => onEdit(student)}
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
          onClick={() => onDelete(student.id)}
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

export default StudentTableRow;
