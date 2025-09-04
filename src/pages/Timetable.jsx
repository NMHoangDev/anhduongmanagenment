import React, { useState, useEffect, useCallback } from "react";
import { message, Tooltip } from "antd";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaPencilAlt,
  FaRobot,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TimetableEditModal from "../components/TimetableEditModal";
import * as timetableService from "../services/timetableService";
import * as classesService from "../services/classesService";
import * as teacherService from "../services/teacherService";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";

// Kích hoạt plugin weekOfYear
dayjs.extend(weekOfYear);

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const displayDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

// Định nghĩa các tiết học trong ngày
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

const Timetable = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetables, setTimetables] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentContext, setCurrentContext] = useState(null);

  // State quản lý tuần hiện tại (thứ 2 đầu tuần)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = dayjs();
    const getMonday = (date) => {
      const d = dayjs(date);
      const dayOfWeek = d.day();
      return dayOfWeek === 0
        ? d.subtract(6, "day")
        : d.subtract(dayOfWeek - 1, "day");
    };
    return getMonday(today);
  });

  // Tính toán tuần hiện tại dựa trên currentWeekStart
  const weekDates = [];
  for (let i = 0; i < 6; i++) {
    weekDates.push(currentWeekStart.add(i, "day"));
  }
  const weekId = `${currentWeekStart.year()}-W${currentWeekStart.week()}`;

  // Helper function để lấy tên giáo viên
  const getTeacherName = (teacherId, teacherName) => {
    if (teacherId && teachers.length > 0) {
      const teacher = teachers.find((t) => t.id === teacherId);
      if (teacher) return teacher.name;
    }
    return teacherName || "Chưa xác định";
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Lấy dữ liệu cơ bản
      const [classesData, teachersData] = await Promise.all([
        classesService.getAllClasses(),
        teacherService.getTeachers(),
      ]);

      // Lọc lớp học trùng lặp
      const uniqueClasses = classesData.filter(
        (cls, index, arr) => arr.findIndex((c) => c.name === cls.name) === index
      );

      setClasses(
        uniqueClasses.sort((a, b) =>
          a.name.localeCompare(b.name, "vi", { numeric: true })
        )
      );
      setTeachers(teachersData);

      // Lấy thời khóa biểu
      const timetablesData = await timetableService.getAllTimetablesByWeek(
        weekId
      );
      setTimetables(timetablesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Có lỗi xảy ra khi tải dữ liệu!");
    }
    setLoading(false);
  }, [weekId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleOpenEditModal = (session, classId, day, timeSlotId) => {
    const classInfo = classes.find((c) => c.id === classId);
    const dayIndex = days.indexOf(day);
    const sessionDate = weekDates[dayIndex]; // Lấy ngày thực tế
    const slot = timeSlots.find((t) => t.id === timeSlotId);

    setCurrentSession(session);
    setCurrentContext({
      classId,
      day,
      timeSlotId,
      className: classInfo?.name || "Không rõ",
      date: sessionDate.format("YYYY-MM-DD"), // Ngày thực tế
      dateDisplay: sessionDate.format("DD/MM/YYYY"), // Hiển thị đẹp
      dayDisplay: displayDays[dayIndex], // Thứ 2, Thứ 3, ...
      startTime: slot?.startTime,
      endTime: slot?.endTime,
      slotLabel: slot?.label,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSession(null);
    setCurrentContext(null);
  };

  const handleSaveSession = async (sessionData) => {
    try {
      // Thêm trường date lấy từ context (đã đúng ngày bạn chọn)
      const sessionToSave = {
        ...sessionData,
        classId: currentContext.classId,
        weekId: weekId,
        date: currentContext.date,
        dayOfWeek: currentContext.day,
        timeSlot: currentContext.timeSlotId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
      };

      console.log("Tiết học sẽ lưu vào Firestore:", sessionToSave);

      await timetableService.createTimetableSession(sessionToSave);

      message.success("Đã lưu tiết học thành công!");
      await fetchAllData();
      handleCloseModal();
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu tiết học!");
    }
  };

  const handleDeleteSession = async (classId, day, timeSlotId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tiết học này không?")) {
      try {
        // Tìm session cần xóa trong dữ liệu hiện tại
        const session = timetables[classId]?.[day]?.find(
          (item) => item.timeSlot === timeSlotId
        );
        if (!session) {
          message.error("Không tìm thấy tiết học để xóa!");
          return;
        }

        await timetableService.deleteTimetableSession(session.id);

        message.success("Đã xóa tiết học thành công!");
        await fetchAllData();
      } catch (error) {
        console.error("Error deleting session:", error);
        message.error("Có lỗi xảy ra khi xóa tiết học!");
      }
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f6f6fa" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(246, 246, 250, 0.9)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Header title="Quản lý Thời Khóa Biểu" />
          <div
            style={{
              padding: "10px 40px 20px 40px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Nút chuyển tuần */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() =>
                  setCurrentWeekStart(currentWeekStart.subtract(1, "week"))
                }
                style={buttonStyle}
              >
                <FaChevronLeft /> Tuần trước
              </button>
              <span
                style={{
                  fontWeight: "600",
                  fontSize: "18px",
                  color: "#004d40",
                }}
              >
                Tuần {currentWeekStart.week()} ({weekDates[0].format("DD/MM")} -{" "}
                {weekDates[5].format("DD/MM")})
              </span>
              <button
                onClick={() =>
                  setCurrentWeekStart(currentWeekStart.add(1, "week"))
                }
                style={buttonStyle}
              >
                Tuần sau <FaChevronRight />
              </button>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    style={buttonStyle}
                  >
                    <FaTimes /> Hủy
                  </button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)} style={buttonStyle}>
                  <FaEdit /> Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main style={{ padding: "20px 40px 40px 40px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px" }}>
              Đang tải...
            </div>
          ) : (
            classes.map((classItem) => (
              <div key={classItem.id} style={{ marginBottom: "32px" }}>
                <h2
                  style={{
                    fontSize: "22px",
                    color: "#1a237e",
                    margin: "0 0 16px 0",
                  }}
                >
                  Lớp: {classItem.name}
                </h2>

                <div
                  style={{
                    overflowX: "auto",
                    background: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "1200px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={headerCellStyle}>Tiết học</th>
                        {displayDays.map((day, idx) => (
                          <th key={day} style={headerCellStyle}>
                            {day}
                            <br />
                            <span style={{ color: "#1976d2", fontWeight: 400 }}>
                              {weekDates[idx].format("DD-MM")}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((timeSlot) => (
                        <tr key={timeSlot.id}>
                          <td style={timeCellStyle}>
                            <div>{timeSlot.label}</div>
                            <div style={{ fontSize: "10px", color: "#666" }}>
                              {timeSlot.startTime}-{timeSlot.endTime}
                            </div>
                          </td>
                          {days.map((day) => {
                            const session = timetables[classItem.id]?.[
                              day
                            ]?.find((item) => item.timeSlot === timeSlot.id);
                            return (
                              <td key={day} style={cellStyle}>
                                {session ? (
                                  <div style={sessionStyle}>
                                    <div
                                      style={{
                                        fontWeight: "bold",
                                        color: "#0d47a1",
                                        fontSize: "13px",
                                      }}
                                    >
                                      {session.subject}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: "11px",
                                        color: "#555",
                                        marginTop: "2px",
                                      }}
                                    >
                                      GV:{" "}
                                      {getTeacherName(
                                        session.teacherId,
                                        session.teacher
                                      )}
                                    </div>
                                    {session.room && (
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#00796b",
                                        }}
                                      >
                                        Phòng: {session.room}
                                      </div>
                                    )}
                                    {editMode && (
                                      <div style={actionButtonsStyle}>
                                        <button
                                          onClick={() =>
                                            handleOpenEditModal(
                                              session,
                                              classItem.id,
                                              day,
                                              timeSlot.id
                                            )
                                          }
                                          style={editButtonStyle}
                                        >
                                          <FaPencilAlt size={8} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteSession(
                                              classItem.id,
                                              day,
                                              timeSlot.id
                                            )
                                          }
                                          style={deleteButtonStyle}
                                        >
                                          <FaTrash size={8} />
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
                                    style={addButtonStyle}
                                    title="Thêm tiết học"
                                  >
                                    <FaPlus size={10} />
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </main>

        {/* Modal */}
        <TimetableEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          sessionData={currentSession}
          onSave={handleSaveSession}
          context={currentContext}
        />
      </div>
    </div>
  );
};

// Styles
const buttonStyle = {
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "10px 15px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "14px",
};

const headerCellStyle = {
  padding: "12px",
  border: "1px solid #e8eaf6",
  background: "#f3f6fd",
  textAlign: "center",
  fontWeight: "600",
  minWidth: "180px",
};

const timeCellStyle = {
  padding: "8px",
  border: "1px solid #e8eaf6",
  textAlign: "center",
  background: "#fafafa",
  fontWeight: "500",
  fontSize: "12px",
  width: "100px",
};

const cellStyle = {
  padding: "8px",
  border: "1px solid #e8eaf6",
  verticalAlign: "top",
  height: "60px",
  position: "relative",
};

const sessionStyle = {
  background: "#e3f2fd",
  padding: "8px",
  borderRadius: "6px",
  fontSize: "12px",
  position: "relative",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const actionButtonsStyle = {
  position: "absolute",
  top: "2px",
  right: "2px",
  display: "flex",
  gap: "2px",
};

const editButtonStyle = {
  background: "#4caf50",
  borderRadius: "50%",
  padding: "5px",
  cursor: "pointer",
  border: "none",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const deleteButtonStyle = {
  background: "#f44336",
  borderRadius: "50%",
  padding: "5px",
  cursor: "pointer",
  border: "none",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const addButtonStyle = {
  width: "100%",
  height: "100%",
  fontSize: "11px",
  padding: "4px",
  background: "transparent",
  border: "1px dashed #ccc",
  borderRadius: "4px",
  color: "#666",
  cursor: "pointer",
};

export default Timetable;
