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
const subjects = ["Toán", "Văn", "Anh"];

export default function TeacherGrade() {
  const [selectedClass, setSelectedClass] = useState(classes[0].id);
  const [grades, setGrades] = useState({});

  const currentClass = classes.find((cls) => cls.id === selectedClass);

  const handleChange = (studentId, subject, value) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subject]: value,
      },
    }));
  };

  return (
    <div style={{ padding: 40, minHeight: "100vh", background: "#f6f6fa" }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18 }}>
        Nhập điểm học sinh
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
            {subjects.map((sub) => (
              <th key={sub} style={{ padding: 12, textAlign: "center" }}>
                {sub}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentClass.students.map((s, idx) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td style={{ padding: 10 }}>{idx + 1}</td>
              <td style={{ padding: 10 }}>{s.name}</td>
              {subjects.map((sub) => (
                <td key={sub} style={{ padding: 10, textAlign: "center" }}>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={grades[s.id]?.[sub] || ""}
                    onChange={(e) => handleChange(s.id, sub, e.target.value)}
                    style={{
                      width: 60,
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      padding: 6,
                      fontSize: 15,
                      textAlign: "center",
                    }}
                  />
                </td>
              ))}
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
        Lưu điểm
      </button>
    </div>
  );
}
