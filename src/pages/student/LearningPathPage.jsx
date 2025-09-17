import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function LearningPathPage() {
  const { currentUser } = useAuth();
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    setMilestones([
      { id: 1, title: "Hoàn thành chương 1 - Toán", status: "done" },
      { id: 2, title: "Luyện đọc hiểu - Văn", status: "in-progress" },
      { id: 3, title: "Bài tập Tiếng Anh - Unit 3", status: "todo" },
    ]);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontWeight: 700 }}>Lộ trình học</h1>
      <div style={{ color: "#666", marginBottom: 12 }}>
        Học sinh: {currentUser?.name || currentUser?.email}
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {milestones.map((m) => (
          <div
            key={m.id}
            style={{
              background: "#fff",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{m.title}</div>
              <div style={{ color: "#777", fontSize: 13 }}>{m.status}</div>
            </div>
            <div>
              {m.status === "done" ? (
                <span style={{ color: "#4caf50" }}>Hoàn thành</span>
              ) : m.status === "in-progress" ? (
                <span style={{ color: "#ff9800" }}>Đang học</span>
              ) : (
                <button style={{ padding: "6px 10px" }}>Bắt đầu</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
