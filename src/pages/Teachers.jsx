import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaBook,
  FaCalendarAlt,
  FaFilter,
  FaDownload,
  FaEllipsisV,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import * as teacherService from "../services/adminServices/teacherService";
import {
  message,
  Modal,
  Form,
  Input,
  Select,
  Rate,
  Spin,
  Tooltip,
  Tag,
  Tabs,
  Avatar,
  Badge,
  Pagination,
} from "antd";
import { useAuth } from "../context/AuthContext";

const styles = {
  // Layout chính
  mainLayout: {
    display: "flex",
    height: "100vh",
    background: "#f8fafc",
    overflow: "hidden",
  },

  contentWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    marginLeft: "2rem", // Chiều rộng của Sidebar
  },

  container: {
    flex: 1,
    padding: "clamp(0.5rem, 2vw, 1.5rem)",
    overflow: "auto",
    maxHeight: "calc(100vh - 80px)", // Trừ height của Header
  },

  // Header styles
  header: {
    background: "#ffffff",
    borderRadius: "clamp(0.5rem, 2vw, 1rem)",
    padding: "clamp(1rem, 3vw, 1.5rem)",
    marginBottom: "clamp(0.75rem, 2vw, 1.5rem)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "clamp(0.75rem, 2vw, 1.5rem)",
    flexWrap: "wrap",
    gap: "clamp(0.5rem, 2vw, 1rem)",
  },

  headerTitle: {
    fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    minWidth: 0,
    flex: "0 0 auto",
  },

  userName: {
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    fontWeight: "600",
    color: "#1e293b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "120px",
  },

  userEmail: {
    fontSize: "clamp(0.625rem, 1.5vw, 0.75rem)",
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "150px",
  },

  // Controls
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },

  leftControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#64748b",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    minWidth: "max-content",
  },

  rightControls: {
    display: "flex",
    alignItems: "center",
    gap: "clamp(0.5rem, 1vw, 0.75rem)",
    flexWrap: "wrap",
    flex: 1,
    justifyContent: "flex-end",
    minWidth: 0,
  },

  // Search
  searchContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "300px",
    minWidth: "200px",
  },

  searchInput: {
    width: "80%",
    padding: "0.75rem 1rem 0.75rem 2.5rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
    background: "#ffffff",
    transition: "all 0.2s ease",
    outline: "none",
  },

  searchIcon: {
    position: "absolute",
    left: "0.875rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    fontSize: "0.875rem",
  },

  // Buttons
  button: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem clamp(0.75rem, 2vw, 1rem)",
    border: "1px solid #e2e8f0",
    borderRadius: "0.75rem",
    background: "#ffffff",
    color: "#374151",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    minWidth: "max-content",
  },

  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem clamp(0.75rem, 2vw, 1.25rem)",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },

  // Table
  tableContainer: {
    background: "#ffffff",
    borderRadius: "1rem",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e2e8f0",
    marginBottom: "1rem",
  },

  tableWrapper: {
    overflowX: "auto",
    maxHeight: "calc(100vh - 300px)",
    overflowY: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "0.875rem",
  },

  tableHeader: {
    background: "#f8fafc",
    padding: "clamp(0.75rem, 2vw, 1rem)",
    textAlign: "left",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },

  tableRow: {
    transition: "background-color 0.2s ease",
  },

  tableCell: {
    padding: "clamp(0.75rem, 2vw, 1rem)",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  // Teacher info
  teacherInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    minWidth: 0,
    maxWidth: "250px",
  },

  teacherAvatar: {
    width: "clamp(2rem, 4vw, 2.5rem)",
    height: "clamp(2rem, 4vw, 2.5rem)",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "clamp(0.75rem, 2vw, 1rem)",
    fontWeight: "600",
    flexShrink: 0,
  },

  teacherDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
    minWidth: 0,
    overflow: "hidden",
  },

  teacherName: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  teacherGender: {
    fontSize: "0.75rem",
    color: "#64748b",
  },

  // Contact info
  contactInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    minWidth: 0,
    maxWidth: "180px",
  },

  contactItem: {
    fontSize: "0.75rem",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  // Subject tags
  subjectTag: {
    background: "#f0f9ff",
    color: "#0369a1",
    border: "1px solid #bae6fd",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "0.6875rem",
    fontWeight: "500",
    margin: "0.125rem",
    whiteSpace: "nowrap",
    display: "inline-block",
  },

  subjectsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
    maxWidth: "150px",
    overflow: "hidden",
  },

  // Status badge
  statusBadge: {
    padding: "0.375rem 0.75rem",
    borderRadius: "1.25rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    textAlign: "center",
    minWidth: "80px",
    whiteSpace: "nowrap",
    background: "#dcfce7",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },

  // Action buttons
  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },

  actionButton: {
    width: "clamp(1.75rem, 4vw, 2rem)",
    height: "clamp(1.75rem, 4vw, 2rem)",
    border: "none",
    borderRadius: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: "0.875rem",
    flexShrink: 0,
  },

  viewButton: {
    background: "#f0f9ff",
    color: "#0369a1",
    border: "1px solid #bae6fd",
  },

  editButton: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },

  deleteButton: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },

  // Pagination
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem clamp(1rem, 3vw, 1.5rem)",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    flexWrap: "wrap",
    gap: "1rem",
    position: "sticky",
    bottom: 0,
  },

  paginationInfo: {
    fontSize: "0.875rem",
    color: "#64748b",
    minWidth: "max-content",
  },

  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },

  pageButton: {
    width: "2rem",
    height: "2rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    background: "#ffffff",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },

  pageButtonActive: {
    background: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },

  // Schedule
  scheduleContainer: {
    background: "#ffffff",
    borderRadius: "1rem",
    padding: "clamp(1rem, 3vw, 1.5rem)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e2e8f0",
    marginTop: "1rem",
    maxHeight: "60vh",
    overflow: "auto",
  },

  scheduleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    position: "sticky",
    top: 0,
    background: "#ffffff",
    zIndex: 10,
    paddingBottom: "0.5rem",
  },

  scheduleTitle: {
    fontSize: "clamp(1rem, 3vw, 1.25rem)",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },

  closeButton: {
    width: "2rem",
    height: "2rem",
    border: "none",
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Timetable
  timetableContainer: {
    overflowX: "auto",
    borderRadius: "0.75rem",
    border: "1px solid #e2e8f0",
    maxHeight: "400px",
    overflowY: "auto",
  },

  timetableTable: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#ffffff",
    minWidth: "600px",
    fontSize: "0.75rem",
  },

  timetableTh: {
    padding: "0.75rem 0.5rem",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    textAlign: "center",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#374151",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },

  timetableTd: {
    padding: "0.5rem",
    border: "1px solid #e2e8f0",
    height: "80px",
    verticalAlign: "top",
    position: "relative",
    minWidth: "100px",
    maxWidth: "150px",
  },

  timetableSlot: {
    padding: "0.375rem 0.5rem",
    borderRadius: "0.375rem",
    marginBottom: "0.25rem",
    fontSize: "0.625rem",
    background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
    color: "#0369a1",
    border: "1px solid #bae6fd",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  timetableSlotSubject: {
    fontWeight: "600",
    marginBottom: "0.125rem",
  },

  timetableSlotClass: {
    fontSize: "0.5625rem",
    color: "#64748b",
  },

  emptySlot: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#d1d5db",
    fontSize: "0.75rem",
    fontStyle: "italic",
  },

  // Responsive breakpoints
  "@media (max-width: 768px)": {
    container: {
      padding: "0.75rem",
    },

    headerTop: {
      flexDirection: "column",
      alignItems: "flex-start",
    },

    userInfo: {
      order: -1,
      alignSelf: "flex-end",
    },

    controlsRow: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: "0.75rem",
    },

    rightControls: {
      justifyContent: "flex-start",
    },

    searchContainer: {
      maxWidth: "none",
    },

    tableCell: {
      padding: "0.5rem",
      maxWidth: "120px",
    },

    actionButtons: {
      flexDirection: "column",
      gap: "0.25rem",
    },

    pagination: {
      flexDirection: "column",
      gap: "0.75rem",
    },

    timetableTd: {
      height: "60px",
      minWidth: "80px",
    },
  },

  "@media (max-width: 480px)": {
    container: {
      padding: "0.5rem",
    },

    rightControls: {
      flexDirection: "column",
      alignItems: "stretch",
    },

    button: {
      justifyContent: "center",
      padding: "0.75rem",
    },

    addButton: {
      justifyContent: "center",
      padding: "0.75rem",
    },
  },
};

// Responsive utility function
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width <= 768,
        isTablet: width > 768 && width <= 1024,
        isDesktop: width > 1024,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

export default function TeachersPage() {
  const { currentUser } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [viewSchedule, setViewSchedule] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [activeScheduleTab, setActiveScheduleTab] = useState("timetable");
  const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 5 : 10);
  const [currentPage, setCurrentPage] = useState(1);

  // Responsive table columns
  const getVisibleColumns = () => {
    if (isMobile) {
      return ["name", "actions"];
    }
    if (isTablet) {
      return ["name", "contact", "status", "actions"];
    }
    return ["name", "id", "contact", "subjects", "status", "actions"];
  };

  const visibleColumns = getVisibleColumns();

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  useEffect(() => {
    setItemsPerPage(isMobile ? 5 : 10);
    setCurrentPage(1);
  }, [isMobile]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await teacherService.getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      message.error("Có lỗi xảy ra khi tải danh sách giáo viên");
    }
    setLoading(false);
  };

  const fetchSubjects = async () => {
    try {
      const data = await teacherService.getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      message.error("Có lỗi xảy ra khi tải danh sách môn học");
    }
  };

  // Filter và pagination
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = teacher.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    let matchesSubject = true;
    if (selectedSubject) {
      const fullSubjectPath = selectedSubject.includes("/")
        ? selectedSubject
        : `subjects/${selectedSubject}`;

      matchesSubject =
        teacher.subjectIds &&
        Array.isArray(teacher.subjectIds) &&
        teacher.subjectIds.some((id) => id === fullSubjectPath);
    }

    return matchesSearch && matchesSubject;
  });

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeachers = filteredTeachers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    const normalizedSubjectIds = (teacher.subjectIds || []).map((s) => {
      if (!s) return s;
      if (typeof s === "string" && s.includes("/")) return s;
      const match = subjects.find((sub) => sub.id === s || sub.path === s);
      return match ? match.path : s;
    });

    form.setFieldsValue({
      name: teacher.name,
      avatar: teacher.avatar,
      email: teacher.email,
      phone: teacher.phone,
      gender: teacher.gender,
      facilityId: teacher.facilityId,
      subjectIds: normalizedSubjectIds,
      rating: teacher.rating,
    });
    setIsModalVisible(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!teacherId) {
      message.error("ID giáo viên không hợp lệ");
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa giáo viên này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await teacherService.deleteTeacher(teacherId);
          message.success("Xóa giáo viên thành công");
          fetchTeachers();
        } catch (error) {
          console.error("Error deleting teacher:", error);
          message.error("Không thể xóa giáo viên");
        }
      },
    });
  };

  const handleViewSchedule = async (teacherId) => {
    setLoading(true);
    try {
      const schedules = await teacherService.getTeachingSchedule(teacherId);
      setScheduleData(schedules);
      setViewSchedule(teacherId);
      setActiveScheduleTab("timetable");
    } catch (error) {
      console.error("Error fetching schedule:", error);
      message.error("Có lỗi xảy ra khi tải lịch dạy");
    }
    setLoading(false);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingTeacher) {
        await teacherService.updateTeacher(editingTeacher.id, values);
        message.success("Cập nhật giáo viên thành công");
      } else {
        await teacherService.addTeacher(values);
        message.success("Thêm giáo viên mới thành công");
      }
      setIsModalVisible(false);
      fetchTeachers();
    } catch (error) {
      console.error("Error saving teacher:", error);
      message.error("Có lỗi xảy ra khi lưu thông tin giáo viên");
    }
  };

  const getSubjectName = (subjectPath) => {
    if (!subjectPath) return "N/A";
    let subject = subjects.find((s) => s.path === subjectPath);
    if (subject) return subject.name;
    const maybeId = subjectPath.includes("/")
      ? subjectPath.split("/").pop()
      : subjectPath;
    subject = subjects.find((s) => s.id === maybeId || s.path === subjectPath);
    return subject ? subject.name : "N/A";
  };

  const organizeScheduleData = () => {
    const timetable = {
      1: {},
      2: {},
      3: {},
      4: {},
      5: {},
      6: {},
      7: {},
    };

    scheduleData.forEach((schedule) => {
      const dayOfWeek = schedule.dayOfWeek;
      const timeSlot = schedule.timeSlot;

      if (!timetable[dayOfWeek][timeSlot]) {
        timetable[dayOfWeek][timeSlot] = [];
      }

      timetable[dayOfWeek][timeSlot].push(schedule);
    });

    return timetable;
  };

  const getTimeSlotRange = (slotNumber) => {
    const timeMap = {
      1: "07:15-08:00",
      2: "08:10-08:55",
      3: "09:15-10:00",
      4: "10:10-10:55",
      5: "11:05-11:50",
      6: "13:30-14:15",
      7: "14:25-15:10",
      8: "15:20-16:05",
      9: "16:15-17:00",
    };
    return timeMap[slotNumber] || `Tiết ${slotNumber}`;
  };

  const renderTimetable = () => {
    const timetableData = organizeScheduleData();
    const days = [1, 2, 3, 4, 5, 6, 7];
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const dayNames = {
      1: "T2",
      2: "T3",
      3: "T4",
      4: "T5",
      5: "T6",
      6: "T7",
      7: "CN",
    };

    return (
      <div style={styles.timetableContainer}>
        <table style={styles.timetableTable}>
          <thead>
            <tr>
              <th style={styles.timetableTh}>Tiết</th>
              {days.map((day) => (
                <th key={day} style={styles.timetableTh}>
                  {dayNames[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td style={styles.timetableTd}>
                  <div style={{ fontWeight: "600", fontSize: "0.75rem" }}>
                    {period}
                  </div>
                  {!isMobile && (
                    <div style={{ fontSize: "0.625rem", color: "#64748b" }}>
                      {getTimeSlotRange(period)}
                    </div>
                  )}
                </td>
                {days.map((day) => (
                  <td key={`${day}-${period}`} style={styles.timetableTd}>
                    {timetableData[day][period] &&
                    timetableData[day][period].length > 0 ? (
                      timetableData[day][period].map((slot, index) => (
                        <div key={index} style={styles.timetableSlot}>
                          <div style={styles.timetableSlotSubject}>
                            {isMobile ? slot.subject.slice(0, 8) : slot.subject}
                          </div>
                          <div style={styles.timetableSlotClass}>
                            {slot.classId}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={styles.emptySlot}>-</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderScheduleList = () => {
    return (
      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Lớp</th>
                {!isMobile && <th style={styles.tableHeader}>Thời gian</th>}
                <th style={styles.tableHeader}>Ngày</th>
                {!isMobile && <th style={styles.tableHeader}>Tuần</th>}
                <th style={styles.tableHeader}>Môn học</th>
              </tr>
            </thead>
            <tbody>
              {scheduleData.map((schedule, index) => (
                <tr
                  key={schedule.id}
                  style={{
                    ...styles.tableRow,
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                  }}
                >
                  <td style={styles.tableCell}>{schedule.classId}</td>
                  {!isMobile && (
                    <td style={styles.tableCell}>Tiết {schedule.timeSlot}</td>
                  )}
                  <td style={styles.tableCell}>
                    {
                      {
                        1: "T2",
                        2: "T3",
                        3: "T4",
                        4: "T5",
                        5: "T6",
                        6: "T7",
                        7: "CN",
                      }[schedule.dayOfWeek]
                    }
                  </td>
                  {!isMobile && (
                    <td style={styles.tableCell}>{schedule.weekId}</td>
                  )}
                  <td style={styles.tableCell}>{schedule.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = isMobile ? 3 : 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 1) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages.map((page, index) => (
      <button
        key={index}
        style={{
          ...styles.pageButton,
          ...(page === currentPage ? styles.pageButtonActive : {}),
          ...(page === "..."
            ? { cursor: "default", border: "none", background: "transparent" }
            : {}),
        }}
        onClick={() => typeof page === "number" && setCurrentPage(page)}
        disabled={page === "..."}
      >
        {page}
      </button>
    ));
  };

  return (
    <div style={styles.mainLayout}>
      <Sidebar />
      <div style={styles.contentWrapper}>
        <Header title="Quản lý Giáo viên" />

        <main style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <h1 style={styles.headerTitle}>Giáo viên</h1>
              <div style={styles.userInfo}>
                <Avatar
                  size={isMobile ? 32 : 40}
                  style={{ backgroundColor: "#3b82f6" }}
                >
                  {currentUser?.name?.charAt(0) || "A"}
                </Avatar>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <div style={styles.userName}>
                    {currentUser?.name?.split("@")[0] || "Admin"}
                  </div>
                  <div style={styles.userEmail}>
                    {currentUser?.email || "admin@example.com"}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.controlsRow}>
              <div style={styles.leftControls}>
                Hiển thị
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#1e293b",
                    fontWeight: "600",
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <FaChevronDown style={{ fontSize: "0.75rem" }} />
              </div>

              <div style={styles.rightControls}>
                {!isMobile && (
                  <>
                    <button style={styles.button}>
                      <FaFilter />
                      Lọc
                    </button>
                    <button style={styles.button}>
                      <FaDownload />
                      Xuất
                    </button>
                  </>
                )}

                <div style={styles.searchContainer}>
                  <FaSearch style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={styles.searchInput}
                  />
                </div>

                <button onClick={handleAddTeacher} style={styles.addButton}>
                  <FaPlus />
                  {isMobile ? "Thêm" : "Thêm GV"}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "3rem",
              }}
            >
              <Spin size="large" />
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {visibleColumns.includes("name") && (
                        <th style={styles.tableHeader}>Giáo viên</th>
                      )}
                      {visibleColumns.includes("id") && (
                        <th style={styles.tableHeader}>ID</th>
                      )}
                      {visibleColumns.includes("contact") && (
                        <th style={styles.tableHeader}>Liên hệ</th>
                      )}
                      {visibleColumns.includes("subjects") && (
                        <th style={styles.tableHeader}>Môn dạy</th>
                      )}
                      {visibleColumns.includes("status") && (
                        <th style={styles.tableHeader}>Trạng thái</th>
                      )}
                      {visibleColumns.includes("actions") && (
                        <th style={styles.tableHeader}>Thao tác</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTeachers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={visibleColumns.length}
                          style={{
                            textAlign: "center",
                            padding: "2rem",
                            color: "#64748b",
                          }}
                        >
                          Không tìm thấy giáo viên nào
                        </td>
                      </tr>
                    ) : (
                      paginatedTeachers.map((teacher, index) => (
                        <tr
                          key={teacher.id}
                          style={styles.tableRow}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f8fafc")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#ffffff")
                          }
                        >
                          {visibleColumns.includes("name") && (
                            <td style={styles.tableCell}>
                              <div style={styles.teacherInfo}>
                                {teacher.avatar ? (
                                  <img
                                    src={teacher.avatar}
                                    alt={teacher.name}
                                    style={{
                                      width: "clamp(2rem, 4vw, 2.5rem)",
                                      height: "clamp(2rem, 4vw, 2.5rem)",
                                      borderRadius: "50%",
                                      objectFit: "cover",
                                      flexShrink: 0,
                                    }}
                                  />
                                ) : (
                                  <div style={styles.teacherAvatar}>
                                    {teacher.name.charAt(0)}
                                  </div>
                                )}
                                <div style={styles.teacherDetails}>
                                  <div style={styles.teacherName}>
                                    {teacher.name}
                                  </div>
                                  {teacher.gender && !isMobile && (
                                    <div style={styles.teacherGender}>
                                      {teacher.gender}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("id") && (
                            <td style={styles.tableCell}>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  fontFamily: "monospace",
                                }}
                              >
                                #{teacher.id?.substring(0, 6)}
                              </span>
                            </td>
                          )}

                          {visibleColumns.includes("contact") && (
                            <td style={styles.tableCell}>
                              <div style={styles.contactInfo}>
                                {teacher.email && (
                                  <div style={styles.contactItem}>
                                    <FaEnvelope />
                                    <span>{teacher.email}</span>
                                  </div>
                                )}
                                {teacher.phone && (
                                  <div style={styles.contactItem}>
                                    <FaPhone />
                                    <span>{teacher.phone}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("subjects") && (
                            <td style={styles.tableCell}>
                              {teacher.subjectIds &&
                              teacher.subjectIds.length > 0 ? (
                                <div style={styles.subjectsContainer}>
                                  {teacher.subjectIds
                                    .slice(0, isMobile ? 1 : 2)
                                    .map((subjectId, idx) => (
                                      <span key={idx} style={styles.subjectTag}>
                                        {getSubjectName(subjectId)}
                                      </span>
                                    ))}
                                  {teacher.subjectIds.length >
                                    (isMobile ? 1 : 2) && (
                                    <span style={styles.subjectTag}>
                                      +
                                      {teacher.subjectIds.length -
                                        (isMobile ? 1 : 2)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span
                                  style={{
                                    color: "#d1d5db",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Chưa có
                                </span>
                              )}
                            </td>
                          )}

                          {visibleColumns.includes("status") && (
                            <td style={styles.tableCell}>
                              <div style={styles.statusBadge}>
                                {isMobile ? "OK" : "Hoạt động"}
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("actions") && (
                            <td style={styles.tableCell}>
                              <div style={styles.actionButtons}>
                                <Tooltip title="Xem lịch">
                                  <button
                                    onClick={() =>
                                      handleViewSchedule(teacher.id)
                                    }
                                    style={{
                                      ...styles.actionButton,
                                      ...styles.viewButton,
                                    }}
                                  >
                                    <FaCalendarAlt />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Sửa">
                                  <button
                                    onClick={() => handleEditTeacher(teacher)}
                                    style={{
                                      ...styles.actionButton,
                                      ...styles.editButton,
                                    }}
                                  >
                                    <FaEdit />
                                  </button>
                                </Tooltip>
                                {!isMobile && (
                                  <Tooltip title="Xóa">
                                    <button
                                      onClick={() =>
                                        handleDeleteTeacher(teacher.id)
                                      }
                                      style={{
                                        ...styles.actionButton,
                                        ...styles.deleteButton,
                                      }}
                                    >
                                      <FaTrash />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={styles.pagination}>
                <div style={styles.paginationInfo}>
                  {isMobile
                    ? `${startIndex + 1}-${Math.min(
                        startIndex + itemsPerPage,
                        filteredTeachers.length
                      )}/${filteredTeachers.length}`
                    : `Hiển thị ${startIndex + 1} - ${Math.min(
                        startIndex + itemsPerPage,
                        filteredTeachers.length
                      )} của ${filteredTeachers.length} kết quả`}
                </div>

                <div style={styles.paginationControls}>
                  <button
                    style={styles.pageButton}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <FaChevronLeft />
                  </button>

                  {renderPageNumbers()}

                  <button
                    style={styles.pageButton}
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Schedule View */}
          {viewSchedule && (
            <div style={styles.scheduleContainer}>
              <div style={styles.scheduleHeader}>
                <h3 style={styles.scheduleTitle}>
                  {isMobile
                    ? "Lịch dạy"
                    : `Lịch: ${
                        teachers.find((t) => t.id === viewSchedule)?.name
                      }`}
                </h3>
                <button
                  onClick={() => setViewSchedule(null)}
                  style={styles.closeButton}
                >
                  ×
                </button>
              </div>

              {scheduleData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#64748b",
                  }}
                >
                  Chưa có lịch dạy
                </div>
              ) : (
                <Tabs
                  activeKey={activeScheduleTab}
                  onChange={(key) => setActiveScheduleTab(key)}
                  items={[
                    {
                      key: "timetable",
                      label: isMobile ? "TKB" : "Thời khóa biểu",
                      children: renderTimetable(),
                    },
                    {
                      key: "list",
                      label: "Danh sách",
                      children: renderScheduleList(),
                    },
                  ]}
                />
              )}
            </div>
          )}
        </main>

        {/* Modal */}
        <Modal
          title={editingTeacher ? "Cập nhật giáo viên" : "Thêm giáo viên"}
          open={isModalVisible}
          onOk={handleModalSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText={editingTeacher ? "Cập nhật" : "Thêm"}
          cancelText="Hủy"
          width={isMobile ? "95%" : isTablet ? "80%" : 600}
        >
          <Form form={form} layout="vertical">
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Form.Item
                name="name"
                label="Tên giáo viên"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Nhập tên giáo viên" />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Giới tính"
                style={{ width: isMobile ? "100%" : "120px" }}
              >
                <Select placeholder="Chọn">
                  <Select.Option value="Nam">Nam</Select.Option>
                  <Select.Option value="Nữ">Nữ</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <Form.Item name="email" label="Email" style={{ flex: 1 }}>
                <Input placeholder="email@example.com" />
              </Form.Item>

              <Form.Item name="phone" label="Điện thoại" style={{ flex: 1 }}>
                <Input placeholder="0123456789" />
              </Form.Item>
            </div>

            <Form.Item name="avatar" label="Ảnh đại diện">
              <Input placeholder="URL ảnh" />
            </Form.Item>

            <Form.Item
              name="subjectIds"
              label="Môn học"
              rules={[{ required: true, message: "Chọn ít nhất 1 môn" }]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn môn học"
                showSearch
                optionFilterProp="children"
              >
                {subjects.map((subject) => (
                  <Select.Option key={subject.id} value={subject.path}>
                    {subject.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="rating" label="Đánh giá">
              <Rate allowHalf />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
