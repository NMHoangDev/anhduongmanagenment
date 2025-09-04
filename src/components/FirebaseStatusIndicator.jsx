import React, { useState, useEffect } from "react";
import { Badge, Tooltip } from "antd";
import {
  FaDatabase,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const FirebaseStatusIndicator = () => {
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    // Lắng nghe console.log để track Firebase operations
    const originalLog = console.log;
    console.log = (...args) => {
      const message = args.join(" ");
      if (
        message.includes("Firebase") ||
        message.includes("timetable") ||
        message.includes("database")
      ) {
        setActivityLog((prev) => [
          {
            timestamp: new Date().toLocaleTimeString(),
            message,
            type: message.includes("Error") ? "error" : "success",
          },
          ...prev.slice(0, 4), // Keep only last 5 logs
        ]);
        setLastUpdate(new Date());
      }
      originalLog.apply(console, args);
    };

    return () => {
      console.log = originalLog;
    };
  }, []);

  const getStatusColor = () => {
    if (!isConnected) return "red";
    if (lastUpdate && Date.now() - lastUpdate.getTime() < 5000) return "green";
    return "orange";
  };

  const getStatusText = () => {
    if (!isConnected) return "Mất kết nối Firebase";
    if (lastUpdate && Date.now() - lastUpdate.getTime() < 5000)
      return "Đang đồng bộ với Firebase";
    if (lastUpdate)
      return `Cập nhật lần cuối: ${lastUpdate.toLocaleTimeString()}`;
    return "Sẵn sàng";
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        background: "white",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e8e8e8",
      }}
    >
      <Tooltip
        title={
          <div>
            <div>
              <strong>Trạng thái Firebase Database:</strong>
            </div>
            <div>{getStatusText()}</div>
            {activityLog.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <strong>Hoạt động gần đây:</strong>
                {activityLog.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      fontSize: "11px",
                      color: log.type === "error" ? "#ff4d4f" : "#52c41a",
                      marginTop: "2px",
                    }}
                  >
                    {log.timestamp}: {log.message.substring(0, 50)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        placement="topRight"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <Badge color={getStatusColor()} dot>
            <FaDatabase size={16} />
          </Badge>
          <span style={{ fontSize: "12px", fontWeight: "500" }}>Firebase</span>
          {lastUpdate && Date.now() - lastUpdate.getTime() < 5000 && (
            <FaCheckCircle size={12} style={{ color: "#52c41a" }} />
          )}
        </div>
      </Tooltip>
    </div>
  );
};

export default FirebaseStatusIndicator;
