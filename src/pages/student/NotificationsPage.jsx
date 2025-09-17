import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
// no external UI helpers needed here

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // placeholder: in real app fetch notifications from firestore or service
    setNotifications([
      {
        id: "n1",
        title: "Lịch học thay đổi",
        body: "Tuần này phòng A101 đổi sang B202",
        time: "2025-09-10",
      },
      {
        id: "n2",
        title: "Thông báo đóng tiền học",
        body: "Hạn cuối đóng học phí là 20/09",
        time: "2025-09-08",
      },
    ]);
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontWeight: 700 }}>Thông báo</h1>
      <div style={{ color: "#666", marginBottom: 12 }}>
        Dành cho: {currentUser?.name || currentUser?.email}
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: 16, background: "#fff", borderRadius: 8 }}>
          Không có thông báo
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                background: "#fff",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #eee",
              }}
            >
              <div style={{ fontWeight: 700 }}>{n.title}</div>
              <div style={{ color: "#444", marginTop: 6 }}>{n.body}</div>
              <div style={{ color: "#999", fontSize: 12, marginTop: 8 }}>
                {n.time}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
