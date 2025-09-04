import React, { useState } from "react";

const fakeNotifications = [
  {
    id: 1,
    title: "Lịch họp giáo viên",
    content: "Họp toàn trường vào 14h ngày 25/5.",
    date: "2024-05-20",
  },
  {
    id: 2,
    title: "Nhắc nhở nộp bài tập",
    content: "Hạn nộp bài tập Toán là 22/5.",
    date: "2024-05-18",
  },
];

export default function TeacherNotification() {
  const [notifications, setNotifications] = useState(fakeNotifications);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!title || !content) return;
    setNotifications((prev) => [
      {
        id: prev.length + 1,
        title,
        content,
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    setTitle("");
    setContent("");
  };

  return (
    <div style={{ padding: 40, minHeight: "100vh", background: "#f6f6fa" }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18 }}>
        Thông báo
      </h1>
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
          Gửi thông báo mới
        </div>
        <input
          type="text"
          placeholder="Tiêu đề"
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
          placeholder="Nội dung thông báo"
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
        <button
          onClick={handleSend}
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
      <div>
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>
          Thông báo gần đây
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
              <th style={{ padding: 12, textAlign: "left" }}>Tiêu đề</th>
              <th style={{ padding: 12, textAlign: "left" }}>Nội dung</th>
              <th style={{ padding: 12, textAlign: "left" }}>Ngày gửi</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: 10 }}>{n.title}</td>
                <td style={{ padding: 10 }}>{n.content}</td>
                <td style={{ padding: 10 }}>{n.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
