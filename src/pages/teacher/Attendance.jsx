import React, { useState } from "react";

const classes = [
  { id: "1A", name: "Lớp 1A" },
  { id: "2A", name: "Lớp 2A" },
  { id: "3A", name: "Lớp 3A" },
];
const students = [
  { id: "HS01", name: "Nguyễn Văn An" },
  { id: "HS02", name: "Trần Thị Bích" },
  { id: "HS03", name: "Lê Minh Tuấn" },
];

export default function TeacherAttendance() {
  const [selectedClass, setSelectedClass] = useState(classes[0].id);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleCheck = (id) => {
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ padding: 40, minHeight: "100vh", background: "#f6f6fa" }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18 }}>
        Điểm danh lớp học
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
        <label style={{ fontWeight: 600 }}>Ngày:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        />
      </div>
      <table
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px #eee",
          borderCollapse: "collapse",
        }}
      >
        <thead style={{ background: "#f3f6fd" }}>
          <tr>
            <th style={{ padding: 12, textAlign: "left" }}>STT</th>
            <th style={{ padding: 12, textAlign: "left" }}>Họ tên học sinh</th>
            <th style={{ padding: 12, textAlign: "center" }}>Có mặt</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, idx) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: 10 }}>{idx + 1}</td>
              <td style={{ padding: 10 }}>{s.name}</td>
              <td style={{ padding: 10, textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={!!attendance[s.id]}
                  onChange={() => handleCheck(s.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        style={{
          marginTop: 24,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 32px",
          fontWeight: 700,
          fontSize: 17,
          cursor: "pointer",
          boxShadow: "0 2px 8px #1976d233",
        }}
      >
        Lưu điểm danh
      </button>
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>
          Lịch sử điểm danh (giả lập)
        </h2>
        <table
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 8px #eee",
            borderCollapse: "collapse",
          }}
        >
          <thead style={{ background: "#f3f6fd" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "left" }}>Ngày</th>
              <th style={{ padding: 12, textAlign: "left" }}>Lớp</th>
              <th style={{ padding: 12, textAlign: "left" }}>
                Số học sinh có mặt
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 10 }}>2024-05-20</td>
              <td style={{ padding: 10 }}>Lớp 1A</td>
              <td style={{ padding: 10 }}>28/30</td>
            </tr>
            <tr>
              <td style={{ padding: 10 }}>2024-05-19</td>
              <td style={{ padding: 10 }}>Lớp 2A</td>
              <td style={{ padding: 10 }}>29/29</td>
            </tr>
          </tbody>
        </table>
      </div>
      <button
        style={{
          marginTop: 24,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 32px",
          fontWeight: 700,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Lưu điểm danh
      </button>
    </div>
  );
}
