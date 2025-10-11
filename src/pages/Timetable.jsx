import React, { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTimes,
  FaPlus,
  FaTrash,
  FaPencilAlt,
  FaCalendarAlt,
  FaUsers,
  FaBook,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TimetableEditModal from "../components/TimetableEditModal";
import * as timetableService from "../services/adminServices/timetableService";
import * as classesService from "../services/adminServices/classesService";
import * as teacherService from "../services/adminServices/teacherService";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { clearAllTimetableDocuments } from "../services/deleteService";

dayjs.extend(weekOfYear);

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const displayDays = ["THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7"];

// Tiết học
const timeSlots = [
  { id: 1, label: "Tiết 1", startTime: "07:00", endTime: "07:45" },
  { id: 2, label: "Tiết 2", startTime: "07:45", endTime: "08:30" },
  { id: 3, label: "Tiết 3", startTime: "08:45", endTime: "09:30" },
  { id: 4, label: "Tiết 4", startTime: "09:30", endTime: "10:15" },
  { id: 5, label: "Tiết 5", startTime: "10:30", endTime: "11:15" },
  { id: 6, label: "Tiết 6", startTime: "11:15", endTime: "12:00" },
  { id: 7, label: "Tiết 7", startTime: "13:00", endTime: "13:45" },
  { id: 8, label: "Tiết 8", startTime: "13:45", endTime: "14:30" },
  { id: 9, label: "Tiết 9", startTime: "14:45", endTime: "15:30" },
  { id: 10, label: "Tiết 10", startTime: "15:30", endTime: "16:15" },
];

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#f8fafc",
    overflow: "hidden",
  },

  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    marginLeft: "2rem",
  },

  headerSection: {
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 20,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },

  topBar: {
    padding: "1.5rem 2rem",
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    borderBottom: "1px solid #e2e8f0",
  },

  title: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },

  titleIcon: {
    color: "#667eea",
    filter: "drop-shadow(0 2px 4px rgba(102, 126, 234, 0.2))",
  },

  controlsBar: {
    padding: "1.25rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
    background: "#ffffff",
  },

  leftControls: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    flexWrap: "wrap",
  },

  sessionControls: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    padding: "0.75rem 1.25rem",
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    borderRadius: "12px",
    border: "1px solid #bae6fd",
    boxShadow: "0 2px 8px rgba(14, 165, 233, 0.1)",
  },

  sessionLabel: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#0369a1",
  },

  select: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontWeight: "500",
  },

  input: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "80px",
    textAlign: "center",
    fontWeight: "500",
    transition: "all 0.2s ease",
  },

  sessionBadge: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#059669",
    padding: "0.375rem 0.75rem",
    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
    borderRadius: "8px",
    border: "1px solid #bbf7d0",
  },

  weekNavigation: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },

  navButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.25rem",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#475569",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  weekLabel: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    minWidth: "220px",
    padding: "0.5rem 1rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  },

  rightControls: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },

  viewToggle: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: "12px",
    padding: "0.25rem",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  viewButton: {
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  viewButtonActive: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#ffffff",
    fontWeight: "600",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
  },

  viewButtonInactive: {
    background: "transparent",
    color: "#64748b",
  },

  editButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.25rem",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
  },

  editButtonCancel: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
  },

  // Calendar Styles
  calendarSection: {
    flex: 1,
    padding: "1.5rem 2rem",
    overflow: "auto",
    background: "#f8fafc",
  },

  dateHeader: {
    display: "grid",
    gridTemplateColumns: "120px repeat(6, 1fr)",
    gap: "2px",
    marginBottom: "2rem",
    background: "#e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
  },

  timeHeaderCell: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#ffffff",
    padding: "1.25rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "0.875rem",
  },

  dateCell: {
    background: "#ffffff",
    padding: "1.25rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.3s ease",
  },

  dateNumber: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1e293b",
  },

  dayName: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  todayCell: {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#ffffff",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
  },

  todayNumber: {
    color: "#ffffff",
  },

  todayName: {
    color: "#ffffff",
    opacity: 0.9,
  },

  // Class Sections
  classSection: {
    marginBottom: "2.5rem",
  },

  classHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
    padding: "1rem 1.5rem",
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    transition: "all 0.3s ease",
  },

  className: {
    fontSize: "1.375rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },

  classStats: {
    display: "flex",
    gap: "1.5rem",
    marginLeft: "auto",
    fontSize: "0.875rem",
    color: "#64748b",
  },

  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    background: "#f1f5f9",
    borderRadius: "8px",
    fontWeight: "500",
  },

  timetableGrid: {
    display: "grid",
    gridTemplateColumns: "120px repeat(6, 1fr)",
    gap: "2px",
    background: "#e2e8f0",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
  },

  timeSlotLabel: {
    background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
    padding: "1.25rem",
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "120px",
    borderRight: "2px solid #e2e8f0",
  },

  dayColumn: {
    background: "#ffffff",
    padding: "1rem",
    minHeight: "120px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    transition: "all 0.3s ease",
  },

  sessionCard: {
    background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    border: "1px solid #86efac",
    borderRadius: "12px",
    padding: "1rem",
    position: "relative",
    transition: "all 0.3s ease",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.1)",
  },

  sessionCardSubject: {
    fontSize: "0.875rem",
    fontWeight: "700",
    color: "#15803d",
    marginBottom: "0.5rem",
  },

  sessionCardTeacher: {
    fontSize: "0.75rem",
    color: "#16a34a",
    marginBottom: "0.25rem",
    fontWeight: "500",
  },

  sessionCardRoom: {
    fontSize: "0.75rem",
    color: "#059669",
    fontWeight: "500",
  },

  sessionActions: {
    position: "absolute",
    top: "0.5rem",
    right: "0.5rem",
    display: "flex",
    gap: "0.25rem",
    opacity: 0,
    transition: "opacity 0.3s ease",
  },

  actionButton: {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    transition: "all 0.2s ease",
  },

  editActionButton: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    color: "#ffffff",
    boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
  },

  deleteActionButton: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "#ffffff",
    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
  },

  addButton: {
    width: "100%",
    height: "100%",
    minHeight: "80px",
    background: "transparent",
    border: "2px dashed #cbd5e1",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: "1.25rem",
    transition: "all 0.3s ease",
  },

  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "300px",
    fontSize: "1.125rem",
    color: "#64748b",
  },

  // Responsive
  "@media (max-width: 1024px)": {
    mainContent: {
      marginLeft: "0",
    },

    controlsBar: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: "1rem",
    },

    leftControls: {
      justifyContent: "center",
    },

    rightControls: {
      justifyContent: "center",
    },
  },

  "@media (max-width: 768px)": {
    topBar: {
      padding: "1rem",
    },

    controlsBar: {
      padding: "1rem",
    },

    calendarSection: {
      padding: "1rem",
    },

    dateHeader: {
      gridTemplateColumns: "80px repeat(6, 1fr)",
    },

    timetableGrid: {
      gridTemplateColumns: "80px repeat(6, 1fr)",
    },

    timeSlotLabel: {
      padding: "0.75rem",
      fontSize: "0.75rem",
      minHeight: "100px",
    },

    dayColumn: {
      padding: "0.75rem",
      minHeight: "100px",
    },

    sessionCard: {
      padding: "0.75rem",
    },

    addButton: {
      minHeight: "60px",
      fontSize: "1rem",
    },
  },
};

const Timetable = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetables, setTimetables] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState("daily");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSessionItem, setCurrentSessionItem] = useState(null);
  const [currentContext, setCurrentContext] = useState(null);

  // Session controls (TERM + YEAR RANGE)
  const today = dayjs();
  const defaultYearFrom = today.month() >= 7 ? today.year() : today.year() - 1;
  const [term, setTerm] = useState(1);
  const [yearFrom, setYearFrom] = useState(defaultYearFrom);
  const [yearTo, setYearTo] = useState(defaultYearFrom + 1);

  const sessionName = timetableService.buildSessionName(term, yearFrom, yearTo);

  // State tuần hiện tại (Thứ 2 đầu tuần)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const getMonday = (date) => {
      const d = dayjs(date);
      const dow = d.day();
      return dow === 0 ? d.subtract(6, "day") : d.subtract(dow - 1, "day");
    };
    return getMonday(today);
  });

  // Tính các ngày trong tuần (Mon..Sat)
  const weekDates = [];
  for (let i = 0; i < 6; i++) {
    weekDates.push(currentWeekStart.add(i, "day"));
  }

  // Helper: tên GV
  const getTeacherName = (teacherId, teacherName) => {
    if (teacherId && teachers.length > 0) {
      const t = teachers.find((x) => x.id === teacherId);
      if (t) return t.name;
    }
    return teacherName || "Chưa xác định";
  };

  // Map schedule theo cấu trúc cũ nhưng FILTER theo tuần đang chọn
  const buildWeekScheduleFromSessionDoc = (sessionDocSchedule) => {
    const out = {};
    days.forEach((day, idx) => {
      const targetDate = weekDates[idx].format("YYYY-MM-DD");
      const arr = sessionDocSchedule?.[day] ?? [];
      out[day] = arr.filter((item) => item.date === targetDate);
      out[day].sort((a, b) => a.timeSlot - b.timeSlot);
    });
    return out;
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [classesData, teachersData] = await Promise.all([
        classesService.getAllClasses(),
        teacherService.getTeachers(),
      ]);

      const uniqueClasses = classesData.filter(
        (cls, index, arr) => arr.findIndex((c) => c.name === cls.name) === index
      );

      const sorted = uniqueClasses.sort((a, b) =>
        a.name.localeCompare(b.name, "vi", { numeric: true })
      );

      setClasses(sorted);
      setTeachers(teachersData);

      const timetableMap = {};
      for (const cls of sorted) {
        const res = await timetableService.getTimetableByClassAndSession(
          cls.id,
          sessionName
        );
        timetableMap[cls.id] = buildWeekScheduleFromSessionDoc(res?.schedule);
      }

      setTimetables(timetableMap);
    } catch (err) {
      console.error("Error fetching data:", err);
      message.error("Có lỗi xảy ra khi tải dữ liệu!");
    }
    setLoading(false);
  }, [sessionName, weekDates.map((d) => d.format("YYYY-MM-DD")).join("|")]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleOpenEditModal = (sessionItem, classId, day, timeSlotId) => {
    const classInfo = classes.find((c) => c.id === classId);
    const dayIndex = days.indexOf(day);
    const sessionDate = weekDates[dayIndex];
    const slot = timeSlots.find((t) => t.id === timeSlotId);

    setCurrentSessionItem(sessionItem);
    setCurrentContext({
      classId,
      day,
      timeSlotId,
      className: classInfo?.name || "Không rõ",
      date: sessionDate.format("YYYY-MM-DD"),
      dateDisplay: sessionDate.format("DD/MM/YYYY"),
      dayDisplay: displayDays[dayIndex],
      startTime: slot?.startTime,
      endTime: slot?.endTime,
      slotLabel: slot?.label,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSessionItem(null);
    setCurrentContext(null);
  };

  const handleSaveSession = async (sessionData) => {
    try {
      const period = {
        ...sessionData,
        date: currentContext.date,
        dayOfWeek: currentContext.day,
        timeSlot: currentContext.timeSlotId,
        status: "active",
      };

      await timetableService.addTimetablePeriod(
        currentContext.classId,
        sessionName,
        period
      );

      message.success("Đã lưu tiết học thành công!");
      await fetchAllData();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra khi lưu tiết học!");
    }
  };

  const handleDeleteSession = async (classId, day, timeSlotId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tiết học này không?"))
      return;

    try {
      const sessionItem = timetables[classId]?.[day]?.find(
        (item) => item.timeSlot === timeSlotId
      );
      if (!sessionItem) {
        message.error("Không tìm thấy tiết học để xóa!");
        return;
      }

      await timetableService.deleteTimetablePeriod(
        classId,
        sessionName,
        sessionItem.id
      );

      message.success("Đã xóa tiết học thành công!");
      await fetchAllData();
    } catch (error) {
      console.error("Error deleting session:", error);
      message.error("Có lỗi xảy ra khi xóa tiết học!");
    }
  };

  const isToday = (date) => {
    return date.format("YYYY-MM-DD") === today.format("YYYY-MM-DD");
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.headerSection}>
          <div style={styles.topBar}>
            <h1 style={styles.title}>
              <FaCalendarAlt style={styles.titleIcon} />
              Thời Khóa Biểu
            </h1>
          </div>

          <div style={styles.controlsBar}>
            <div style={styles.leftControls}>
              {/* Session Controls */}
              <div style={styles.sessionControls}>
                <span style={styles.sessionLabel}>Session:</span>
                <select
                  value={term}
                  onChange={(e) => setTerm(Number(e.target.value))}
                  style={styles.select}
                >
                  <option value={1}>SESSION 1</option>
                  <option value={2}>SESSION 2</option>
                </select>
                <input
                  type="number"
                  value={yearFrom}
                  onChange={(e) => {
                    const yf = Number(e.target.value);
                    setYearFrom(yf);
                    setYearTo(yf + 1);
                  }}
                  style={styles.input}
                />
                <span>-</span>
                <input
                  type="number"
                  value={yearTo}
                  onChange={(e) => setYearTo(Number(e.target.value))}
                  style={styles.input}
                />
                <span style={styles.sessionBadge}>
                  {timetableService.buildSessionName(term, yearFrom, yearTo)}
                </span>
              </div>

              {/* Week Navigation */}
              <div style={styles.weekNavigation}>
                <button
                  onClick={() =>
                    setCurrentWeekStart(currentWeekStart.subtract(1, "week"))
                  }
                  style={styles.navButton}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#f1f5f9";
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#ffffff";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                  }}
                >
                  <FaChevronLeft />
                  Tuần trước
                </button>
                <div style={styles.weekLabel}>
                  {currentWeekStart.format("DD/MM")} -{" "}
                  {weekDates[5].format("DD/MM/YYYY")}
                </div>
                <button
                  onClick={() =>
                    setCurrentWeekStart(currentWeekStart.add(1, "week"))
                  }
                  style={styles.navButton}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#f1f5f9";
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#ffffff";
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                  }}
                >
                  Tuần sau
                  <FaChevronRight />
                </button>
              </div>
            </div>

            <div style={styles.rightControls}>
              {/* View Toggle */}
              <div style={styles.viewToggle}>
                <button
                  style={{
                    ...styles.viewButton,
                    ...(viewMode === "daily"
                      ? styles.viewButtonActive
                      : styles.viewButtonInactive),
                  }}
                  onClick={() => setViewMode("daily")}
                >
                  Daily
                </button>
                <button
                  style={{
                    ...styles.viewButton,
                    ...(viewMode === "monthly"
                      ? styles.viewButtonActive
                      : styles.viewButtonInactive),
                  }}
                  onClick={() => setViewMode("monthly")}
                >
                  Monthly
                </button>
              </div>

              {/* Edit Mode Toggle */}
              <button
                onClick={() => setEditMode(!editMode)}
                style={{
                  ...styles.editButton,
                  ...(editMode ? styles.editButtonCancel : {}),
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = editMode
                    ? "0 6px 16px rgba(239, 68, 68, 0.4)"
                    : "0 6px 16px rgba(34, 197, 94, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = editMode
                    ? "0 4px 12px rgba(239, 68, 68, 0.3)"
                    : "0 4px 12px rgba(34, 197, 94, 0.3)";
                }}
              >
                {editMode ? <FaTimes /> : <FaEdit />}
                {editMode ? "Hủy chỉnh sửa" : "Chỉnh sửa"}
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div style={styles.calendarSection}>
          {/* Date Header */}
          <div style={styles.dateHeader}>
            <div style={styles.timeHeaderCell}>
              <div>TIẾT HỌC</div>
            </div>
            {weekDates.map((date, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.dateCell,
                  ...(isToday(date) ? styles.todayCell : {}),
                }}
              >
                <div
                  style={{
                    ...styles.dateNumber,
                    ...(isToday(date) ? styles.todayNumber : {}),
                  }}
                >
                  {date.format("DD")}
                </div>
                <div
                  style={{
                    ...styles.dayName,
                    ...(isToday(date) ? styles.todayName : {}),
                  }}
                >
                  {displayDays[idx]}
                </div>
              </div>
            ))}
          </div>

          {/* Class Timetables */}
          {loading ? (
            <div style={styles.loading}>Đang tải dữ liệu...</div>
          ) : (
            classes.map((classItem) => (
              <div key={classItem.id} style={styles.classSection}>
                <div style={styles.classHeader}>
                  <div style={styles.className}>{classItem.name}</div>
                  <div style={styles.classStats}>
                    <div style={styles.statItem}>
                      <FaUsers />
                      {classItem.studentCount || 0} HS
                    </div>
                    <div style={styles.statItem}>
                      <FaBook />
                      {Object.values(timetables[classItem.id] || {}).flat()
                        .length || 0}{" "}
                      tiết
                    </div>
                  </div>
                </div>

                <div style={styles.timetableGrid}>
                  {timeSlots.map((timeSlot) => (
                    <React.Fragment key={timeSlot.id}>
                      {/* Time Slot Label */}
                      <div style={styles.timeSlotLabel}>
                        <div
                          style={{ fontWeight: "700", marginBottom: "0.25rem" }}
                        >
                          {timeSlot.label}
                        </div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                          {timeSlot.startTime}-{timeSlot.endTime}
                        </div>
                      </div>

                      {/* Day Columns */}
                      {days.map((day, dayIdx) => {
                        const sessionItem = timetables[classItem.id]?.[
                          day
                        ]?.find((i) => i.timeSlot === timeSlot.id);

                        return (
                          <div
                            key={`${day}-${timeSlot.id}`}
                            style={styles.dayColumn}
                            onMouseEnter={(e) => {
                              e.target.style.background = "#f8fafc";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "#ffffff";
                            }}
                          >
                            {sessionItem ? (
                              <div
                                style={styles.sessionCard}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform =
                                    "translateY(-2px)";
                                  e.currentTarget.style.boxShadow =
                                    "0 4px 16px rgba(34, 197, 94, 0.2)";
                                  if (editMode) {
                                    e.currentTarget.querySelector(
                                      ".session-actions"
                                    ).style.opacity = "1";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform =
                                    "translateY(0)";
                                  e.currentTarget.style.boxShadow =
                                    "0 2px 8px rgba(34, 197, 94, 0.1)";
                                  if (editMode) {
                                    e.currentTarget.querySelector(
                                      ".session-actions"
                                    ).style.opacity = "0";
                                  }
                                }}
                              >
                                <div style={styles.sessionCardSubject}>
                                  {sessionItem.subject}
                                </div>
                                <div style={styles.sessionCardTeacher}>
                                  GV:{" "}
                                  {getTeacherName(
                                    sessionItem.teacherId,
                                    sessionItem.teacher
                                  )}
                                </div>
                                {sessionItem.room && (
                                  <div style={styles.sessionCardRoom}>
                                    Phòng: {sessionItem.room}
                                  </div>
                                )}

                                {editMode && (
                                  <div
                                    className="session-actions"
                                    style={styles.sessionActions}
                                  >
                                    <button
                                      onClick={() =>
                                        handleOpenEditModal(
                                          sessionItem,
                                          classItem.id,
                                          day,
                                          timeSlot.id
                                        )
                                      }
                                      style={{
                                        ...styles.actionButton,
                                        ...styles.editActionButton,
                                      }}
                                    >
                                      <FaPencilAlt />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteSession(
                                          classItem.id,
                                          day,
                                          timeSlot.id
                                        )
                                      }
                                      style={{
                                        ...styles.actionButton,
                                        ...styles.deleteActionButton,
                                      }}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleOpenEditModal(
                                    null,
                                    classItem.id,
                                    day,
                                    timeSlot.id
                                  )
                                }
                                style={styles.addButton}
                                onMouseEnter={(e) => {
                                  e.target.style.borderColor = "#667eea";
                                  e.target.style.color = "#667eea";
                                  e.target.style.background =
                                    "rgba(102, 126, 234, 0.05)";
                                  e.target.style.transform = "scale(1.02)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.borderColor = "#cbd5e1";
                                  e.target.style.color = "#9ca3af";
                                  e.target.style.background = "transparent";
                                  e.target.style.transform = "scale(1)";
                                }}
                              >
                                <FaPlus />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        <TimetableEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          sessionData={currentSessionItem}
          onSave={handleSaveSession}
          context={currentContext}
        />
      </div>
    </div>
  );
};

export default Timetable;
