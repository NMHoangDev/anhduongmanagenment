import React, { useState } from "react";

const classes = [
  {
    id: "1A",
    name: "Lớp 1A",
    students: [
      { id: "HS01", name: "Nguyễn Văn An" },
      { id: "HS02", name: "Trần Thị Bích" },
    ],
  },
  {
    id: "2A",
    name: "Lớp 2A",
    students: [
      { id: "HS03", name: "Lê Minh Tuấn" },
      { id: "HS04", name: "Phạm Thị Hoa" },
    ],
  },
];

export default function TeacherClassManagement() {
  const [selectedClass, setSelectedClass] = useState(classes[0].id);
  const [showStudents, setShowStudents] = useState(false);
  const [message, setMessage] = useState("");

  const currentClass = classes.find((cls) => cls.id === selectedClass);

  return (
    <div style={{ padding: 40, minHeight: "100vh", background: "#f6f6fa" }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18 }}>
        Quản lý lớp học
      </h1>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <label style={{ fontWeight: 600 }}>Chọn lớp:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
        <button
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
          }}
          onClick={() => setShowStudents(!showStudents)}
        >
          {showStudents ? "Ẩn" : "Xem"} danh sách học sinh
        </button>
      </div>
      {showStudents && (
        <table
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 8px #eee",
            borderCollapse: "collapse",
            marginBottom: 24,
          }}
        >
          <thead style={{ background: "#f3f6fd" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "left" }}>STT</th>
              <th style={{ padding: 12, textAlign: "left" }}>
                Họ tên học sinh
              </th>
            </tr>
          </thead>
          <tbody>
            {currentClass.students.map((s, idx) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: 10 }}>{idx + 1}</td>
                <td style={{ padding: 10 }}>{s.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>
          Gửi thông báo cho lớp
        </h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Nhập nội dung thông báo..."
          style={{
            width: "100%",
            minHeight: 80,
            borderRadius: 8,
            border: "1px solid #ccc",
            padding: 12,
            fontSize: 16,
            marginBottom: 12,
          }}
        />
        <button
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
          Gửi thông báo
        </button>
      </div>
    </div>
  );
}
