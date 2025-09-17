import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getClassTimetable } from "../../services/teacherService";

export default function TimetableStudent() {
  const { currentUser } = useAuth();
  const [weeksData, setWeeksData] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [loading, setLoading] = useState(false);

  // For students, classId may be stored as classId or class in user doc
  const classId = currentUser?.classId || currentUser?.class || "1";

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!classId) return;
      setLoading(true);
      try {
        const data = await getClassTimetable(`class_${classId}`);
        // data expected: [{ id: weekId, schedule: { monday: [...], ... } }, ...]
        setWeeksData(data || []);
        if ((data || []).length > 0) {
          // choose the first week returned as default (latest/current)
          setSelectedWeek(data[0].id);
        }
      } catch (err) {
        console.error("Lỗi khi lấy thời khoá biểu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [classId]);

  // find schedule for selected week
  const scheduleForWeek =
    weeksData.find((w) => w.id === selectedWeek)?.schedule || {};

  const groupByDay = (scheduleObj) => {
    const acc = {};
    Object.entries(scheduleObj).forEach(([day, lessons]) => {
      acc[day] = (lessons || []).slice().sort((a, b) => {
        // sort by startTime if available (HH:MM)
        const tA = a.startTime || "";
        const tB = b.startTime || "";
        return tA.localeCompare(tB);
      });
    });
    return acc;
  };

  const groupedSchedule = groupByDay(scheduleForWeek);

  const daysOfWeek = [
    { key: "monday", label: "Thứ 2" },
    { key: "tuesday", label: "Thứ 3" },
    { key: "wednesday", label: "Thứ 4" },
    { key: "thursday", label: "Thứ 5" },
    { key: "friday", label: "Thứ 6" },
    { key: "saturday", label: "Thứ 7" },
  ];

  const allLessonsThisWeek = Object.values(groupedSchedule).flat() || [];

  const handlePrevWeek = () => {
    if (!weeksData.length || !selectedWeek) return;
    const idx = weeksData.findIndex((w) => w.id === selectedWeek);
    if (idx < 0) return;
    const next =
      idx + 1 < weeksData.length ? weeksData[idx + 1] : weeksData[idx];
    setSelectedWeek(next.id);
  };

  const handleNextWeek = () => {
    if (!weeksData.length || !selectedWeek) return;
    const idx = weeksData.findIndex((w) => w.id === selectedWeek);
    if (idx <= 0) return;
    const next = weeksData[idx - 1];
    setSelectedWeek(next.id);
  };

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#f6f6fa" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h1
            style={{ fontWeight: 700, fontSize: 28, margin: 0, color: "#333" }}
          >
            Thời khoá biểu lớp {classId}
          </h1>
          <div style={{ color: "#666", marginTop: 6 }}>
            Học sinh: {currentUser?.name || currentUser?.email || "—"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handlePrevWeek}
            disabled={!weeksData.length}
            style={{ padding: "8px 12px" }}
          >
            Tuần trước
          </button>
          <select
            value={selectedWeek || ""}
            onChange={(e) => setSelectedWeek(e.target.value)}
          >
            {weeksData.map((w) => (
              <option key={w.id} value={w.id}>
                Tuần {w.id}
              </option>
            ))}
          </select>
          <button
            onClick={handleNextWeek}
            disabled={!weeksData.length}
            style={{ padding: "8px 12px" }}
          >
            Tuần sau
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 18,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3
            style={{ margin: 0, fontSize: 14, color: "#666", marginBottom: 8 }}
          >
            Tổng số tiết trong tuần
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#1976d2",
            }}
          >
            {allLessonsThisWeek.length}
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 18,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3
            style={{ margin: 0, fontSize: 14, color: "#666", marginBottom: 8 }}
          >
            Tuần hiện tại
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#4caf50",
            }}
          >
            {selectedWeek || "?"}
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 18,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3
            style={{ margin: 0, fontSize: 14, color: "#666", marginBottom: 8 }}
          >
            Lớp
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "#ff9800",
            }}
          >
            {classId}
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: 20,
          marginBottom: 24,
          border: "1px solid #e0e0e0",
        }}
      >
        <h2
          style={{
            fontWeight: 600,
            fontSize: 18,
            marginBottom: 12,
            color: "#333",
            borderBottom: "2px solid #1976d2",
            paddingBottom: 8,
          }}
        >
          Thời khoá biểu tuần {selectedWeek || "?"}
        </h2>

        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <thead
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <tr>
                {daysOfWeek.map((day, idx) => (
                  <th
                    key={idx}
                    style={{
                      padding: 12,
                      textAlign: "center",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      borderRight:
                        idx < daysOfWeek.length - 1
                          ? "1px solid rgba(255,255,255,0.2)"
                          : "none",
                    }}
                  >
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {daysOfWeek.map((day, idx) => (
                  <td
                    key={idx}
                    style={{
                      padding: 12,
                      verticalAlign: "top",
                      backgroundColor: "#fafafa",
                      borderRight:
                        idx < daysOfWeek.length - 1
                          ? "1px solid #e0e0e0"
                          : "none",
                      minHeight: 120,
                    }}
                  >
                    {groupedSchedule[day.key] &&
                    groupedSchedule[day.key].length > 0 ? (
                      groupedSchedule[day.key].map((lesson, i) => (
                        <div
                          key={i}
                          style={{
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "#fff",
                            padding: "10px 12px",
                            marginBottom: 10,
                            borderRadius: 8,
                            boxShadow: "0 2px 8px rgba(102, 126, 234, 0.25)",
                            cursor: "default",
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {lesson.subject || lesson.name || "—"}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.95 }}>
                            {lesson.startTime || ""} - {lesson.endTime || ""}
                          </div>
                          <div
                            style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}
                          >
                            {lesson.teacher
                              ? `Giáo viên: ${lesson.teacher}`
                              : ""}{" "}
                            {lesson.room ? ` • Phòng: ${lesson.room}` : ""}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          color: "#999",
                          textAlign: "center",
                          fontStyle: "italic",
                          padding: "20px 0",
                          backgroundColor: "#f9f9f9",
                          borderRadius: 8,
                          border: "2px dashed #ddd",
                        }}
                      >
                        Không có tiết học
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontWeight: 600,
          }}
        >
          Chi tiết tuần
        </button>
        <button
          style={{
            background: "#fff",
            color: "#1976d2",
            border: "2px solid #1976d2",
            borderRadius: 8,
            padding: "10px 16px",
            fontWeight: 600,
          }}
        >
          Xuất PDF
        </button>
      </div>
    </div>
  );
}
