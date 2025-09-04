import React, { useState } from "react";

const classes = [
  { id: "1A", name: "Lớp 1A" },
  { id: "2A", name: "Lớp 2A" },
];
const fakeAssignments = [
  {
    id: 1,
    classId: "1A",
    title: "Bài tập Toán tuần 1",
    deadline: "2024-05-25",
  },
  { id: 2, classId: "2A", title: "Bài tập Văn tuần 1", deadline: "2024-05-26" },
];

export default function TeacherAssignment() {
  const [selectedClass, setSelectedClass] = useState(classes[0].id);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignments, setAssignments] = useState(fakeAssignments);

  const handleAdd = () => {
    if (!title || !content || !deadline) return;
    setAssignments((prev) => [
      ...prev,
      { id: prev.length + 1, classId: selectedClass, title, deadline },
    ]);
    setTitle("");
    setContent("");
    setDeadline("");
  };

  return (
    <div style={{ padding: 40, minHeight: "100vh", background: "#f6f6fa" }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18 }}>
        Ra đề/Bài tập cho lớp
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
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px #eee",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>
          Tạo bài tập mới
        </div>
        <input
          type="text"
          placeholder="Tiêu đề bài tập"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid #ccc",
            padding: 10,
            fontSize: 16,
            marginBottom: 12,
          }}
        />
        <textarea
          placeholder="Nội dung bài tập"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: "100%",
            borderRadius: 8,
            border: "1px solid #ccc",
            padding: 10,
            fontSize: 16,
            marginBottom: 12,
            minHeight: 60,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <label style={{ fontWeight: 500 }}>Hạn nộp:</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ccc",
              fontSize: 16,
            }}
          />
        </div>
        <button
          onClick={handleAdd}
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
          Giao bài tập
        </button>
      </div>
      <div>
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>
          Danh sách bài tập đã giao
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
              <th style={{ padding: 12, textAlign: "left" }}>Lớp</th>
              <th style={{ padding: 12, textAlign: "left" }}>Tiêu đề</th>
              <th style={{ padding: 12, textAlign: "left" }}>Hạn nộp</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: 10 }}>
                  {classes.find((c) => c.id === a.classId)?.name}
                </td>
                <td style={{ padding: 10 }}>{a.title}</td>
                <td style={{ padding: 10 }}>{a.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
