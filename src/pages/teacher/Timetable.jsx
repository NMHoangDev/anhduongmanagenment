import React, { useState, useEffect } from "react";
import { getClassTimetable } from "../../services/teacherService";

export default function TeacherTimetable() {
  const [schedule, setSchedule] = useState([]);

  const teacherName = "Cô My"; // TODO: Replace with logged-in teacher name
  const classId = "4"; // TODO: Replace with dynamic classId if needed

  useEffect(() => {
    const fetchTimetable = async () => {
      const data = await getClassTimetable(`class_${classId}`);

      let teacherLessons = [];

      data.forEach((weekEntry) => {
        const weekId = weekEntry.id;
        const schedule = weekEntry.schedule;

        Object.entries(schedule).forEach(([day, lessons]) => {
          lessons.forEach((lesson) => {
            if (lesson.teacher === teacherName) {
              teacherLessons.push({
                week: weekId,
                day,
                ...lesson,
              });
            }
          });
        });
      });

      setSchedule(teacherLessons);
      // setTimetable(data); // Removed as timetable state is not used
    };

    fetchTimetable();
  }, []);

  // Group lessons by day
  const groupByDay = (lessons) => {
    return lessons.reduce((acc, lesson) => {
      if (!acc[lesson.day]) acc[lesson.day] = [];
      acc[lesson.day].push(lesson);
      return acc;
    }, {});
  };

  const groupedSchedule = groupByDay(schedule);

  const daysOfWeek = [
    { key: "monday", label: "Thứ 2" },
    { key: "tuesday", label: "Thứ 3" },
    { key: "wednesday", label: "Thứ 4" },
    { key: "thursday", label: "Thứ 5" },
    { key: "friday", label: "Thứ 6" },
    { key: "saturday", label: "Thứ 7" },
  ];

  return (
    <div style={{ padding: 40, minHeight: "100vh", background: "#f6f6fa" }}>
      <h1
        style={{
          fontWeight: 700,
          fontSize: 28,
          marginBottom: 24,
          color: "#333",
        }}
      >
        Lịch dạy của bạn
      </h1>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3
            style={{ margin: 0, fontSize: 16, color: "#666", marginBottom: 8 }}
          >
            Tổng số tiết
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#1976d2",
            }}
          >
            {schedule.length}
          </p>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3
            style={{ margin: 0, fontSize: 16, color: "#666", marginBottom: 8 }}
          >
            Tuần hiện tại
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "#4caf50",
            }}
          >
            Tuần {schedule[0]?.week || "?"}
          </p>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <h3
            style={{ margin: 0, fontSize: 16, color: "#666", marginBottom: 8 }}
          >
            Giáo viên
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "#ff9800",
            }}
          >
            {teacherName}
          </p>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: 24,
          marginBottom: 32,
          border: "1px solid #e0e0e0",
        }}
      >
        <h2
          style={{
            fontWeight: 600,
            fontSize: 20,
            marginBottom: 20,
            color: "#333",
            borderBottom: "2px solid #1976d2",
            paddingBottom: 10,
          }}
        >
          Thời khoá biểu tuần {schedule[0]?.week || "?"}
        </h2>

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
                    padding: 16,
                    textAlign: "center",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 16,
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
                    padding: 16,
                    verticalAlign: "top",
                    backgroundColor: "#fafafa",
                    borderRight:
                      idx < daysOfWeek.length - 1
                        ? "1px solid #e0e0e0"
                        : "none",
                    minHeight: 120,
                  }}
                >
                  {groupedSchedule[day.key]?.length > 0 ? (
                    groupedSchedule[day.key].map((lesson, i) => (
                      <div
                        key={i}
                        style={{
                          background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          color: "#fff",
                          padding: "12px 16px",
                          marginBottom: 12,
                          borderRadius: 8,
                          boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                          transition: "transform 0.2s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.target.style.transform = "translateY(-2px)")
                        }
                        onMouseLeave={(e) =>
                          (e.target.style.transform = "translateY(0px)")
                        }
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            marginBottom: 4,
                          }}
                        >
                          {lesson.subject}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.9 }}>
                          {lesson.startTime} - {lesson.endTime}
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
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <button
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
            transition: "all 0.2s ease",
          }}
        >
          📋 Xem chi tiết lịch
        </button>
        <button
          style={{
            background: "#fff",
            color: "#667eea",
            border: "2px solid #667eea",
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          📊 Thống kê giờ dạy
        </button>
        <button
          style={{
            background: "#fff",
            color: "#667eea",
            border: "2px solid #667eea",
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          📅 Lịch tuần khác
        </button>
      </div>
    </div>
  );
}
