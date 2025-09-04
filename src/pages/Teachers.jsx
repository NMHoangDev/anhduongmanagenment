import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaBook,
  FaCalendarAlt,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import * as teacherService from "../services/teacherService";
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
} from "antd";

// CSS Styles không thay đổi...
const styles = {
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "15px",
  },
  tableHeader: {
    background: "linear-gradient(90deg, #e3f0ff, #f8fbff)",
    color: "#1976d2",
    fontWeight: 600,
    padding: "14px 16px",
    textAlign: "left",
    borderBottom: "2px solid #e3eaf5",
  },
  tableRow: {
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#f5f9ff",
    },
  },
  tableCell: {
    padding: "12px 16px",
    borderBottom: "1px solid #edf2f7",
    color: "#333",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  },
  actionButton: {
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  viewButton: {
    backgroundColor: "#e3f0ff",
    color: "#1976d2",
  },
  editButton: {
    backgroundColor: "#e6f7e6",
    color: "#28a745",
  },
  deleteButton: {
    backgroundColor: "#ffebeb",
    color: "#dc3545",
  },
  scheduleTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    fontSize: "14px",
  },
  scheduleHeader: {
    backgroundColor: "#f5f9ff",
    color: "#1976d2",
    fontWeight: 600,
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #e0e9f5",
  },
  scheduleCell: {
    padding: "8px 10px",
    borderBottom: "1px solid #f0f0f0",
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
  },
  searchContainer: {
    position: "relative",
    flex: 1,
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#aaa",
  },
  searchInput: {
    width: "100%",
    padding: "10px 15px 10px 40px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#e3f0ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1976d2",
    fontWeight: "bold",
  },
  emptyMessage: {
    padding: "15px 0",
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  subjectTag: {
    margin: "2px",
    fontSize: "12px",
  },
  // Thêm styles cho thời khóa biểu
  timetableContainer: {
    marginTop: "20px",
    width: "100%",
    overflowX: "auto",
  },
  timetableTable: {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #e0e0e0",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  timetableTh: {
    padding: "12px 8px",
    border: "1px solid #e0e0e0",
    background: "#f0f7ff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "14px",
    color: "#1976d2",
  },
  timetableTd: {
    padding: "8px",
    border: "1px solid #e0e0e0",
    height: "90px",
    verticalAlign: "top",
    position: "relative",
  },
  timetablePeriodLabel: {
    fontWeight: "bold",
    marginBottom: "5px",
    color: "#333",
    fontSize: "13px",
  },
  timetableTimeLabel: {
    color: "#666",
    fontSize: "11px",
    marginBottom: "8px",
  },
  timetableSlot: {
    padding: "6px 8px",
    borderRadius: "4px",
    marginBottom: "4px",
    fontSize: "12px",
    background: "#e3f0ff",
    color: "#0056b3",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  timetableSlotSubject: {
    fontWeight: "600",
    marginBottom: "3px",
  },
  timetableSlotClass: {
    color: "#444",
  },
  timetableEmptySlot: {
    height: "100%",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#ccc",
    fontSize: "12px",
    fontStyle: "italic",
  },
  dayHeading: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1976d2",
  },
  periodsColumn: {
    width: "80px",
    backgroundColor: "#f9f9f9",
  },
  tabContainer: {
    marginBottom: "15px",
  },
};

export default function TeachersPage() {
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

  // Các hàm không thay đổi...
  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await teacherService.getTeachers();
      console.log("Fetched teachers:", data);
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
      console.log("Fetched subjects:", data);
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      message.error("Có lỗi xảy ra khi tải danh sách môn học");
    }
  };

  // Lọc danh sách giáo viên theo tìm kiếm và môn học
  const filteredTeachers = teachers.filter((teacher) => {
    // Tìm kiếm theo tên
    const matchesSearch = teacher.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Lọc theo môn học được chọn
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

  const handleAddTeacher = () => {
    setEditingTeacher(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    form.setFieldsValue({
      name: teacher.name,
      avatar: teacher.avatar,
      email: teacher.email,
      phone: teacher.phone,
      gender: teacher.gender,
      facilityId: teacher.facilityId,
      subjectIds: teacher.subjectIds || [],
    });
    setIsModalVisible(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
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
          message.error("Có lỗi xảy ra khi xóa giáo viên");
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
      setActiveScheduleTab("timetable"); // Mặc định hiển thị dạng thời khóa biểu
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

  const handleFilterBySubject = async (subjectId) => {
    setSelectedSubject(subjectId);
    if (subjectId) {
      setLoading(true);
      try {
        const filteredData = await teacherService.getTeachersBySubject(
          subjectId
        );
        setTeachers(filteredData);
      } catch (error) {
        console.error("Error filtering teachers:", error);
      }
      setLoading(false);
    } else {
      fetchTeachers();
    }
  };

  const getSubjectName = (subjectPath) => {
    const subject = subjects.find((s) => s.path === subjectPath);
    return subject ? subject.name : "Môn học không xác định";
  };

  // Tổ chức scheduleData thành dạng thời khóa biểu
  const organizeScheduleData = () => {
    const timetable = {
      1: {}, // Thứ hai
      2: {}, // Thứ ba
      3: {}, // Thứ tư
      4: {}, // Thứ năm
      5: {}, // Thứ sáu
      6: {}, // Thứ bảy
      7: {}, // Chủ nhật
    };

    scheduleData.forEach((schedule) => {
      const dayOfWeek = schedule.dayOfWeek;
      const timeSlot = schedule.timeSlot;

      if (!timetable[dayOfWeek]) {
        timetable[dayOfWeek] = {};
      }

      if (!timetable[dayOfWeek][timeSlot]) {
        timetable[dayOfWeek][timeSlot] = [];
      }

      timetable[dayOfWeek][timeSlot].push(schedule);
    });

    return timetable;
  };

  // Chuyển đổi số tiết học thành khung giờ
  const getTimeSlotRange = (slotNumber) => {
    const timeMap = {
      1: "07:15 - 08:00",
      2: "08:10 - 08:55",
      3: "09:15 - 10:00",
      4: "10:10 - 10:55",
      5: "11:05 - 11:50",
      6: "13:30 - 14:15",
      7: "14:25 - 15:10",
      8: "15:20 - 16:05",
      9: "16:15 - 17:00",
    };

    return timeMap[slotNumber] || `Tiết ${slotNumber}`;
  };

  // Tạo bảng thời khóa biểu
  const renderTimetable = () => {
    const timetableData = organizeScheduleData();
    const days = [1, 2, 3, 4, 5, 6, 7]; // Thứ 2 -> Chủ nhật
    const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // Tiết 1 -> Tiết 9
    const dayNames = {
      1: "Thứ hai",
      2: "Thứ ba",
      3: "Thứ tư",
      4: "Thứ năm",
      5: "Thứ sáu",
      6: "Thứ bảy",
      7: "Chủ nhật",
    };

    return (
      <div style={styles.timetableContainer}>
        <table style={styles.timetableTable}>
          <thead>
            <tr>
              <th style={{ ...styles.timetableTh, ...styles.periodsColumn }}>
                Tiết
              </th>
              {days.map((day) => (
                <th key={day} style={styles.timetableTh}>
                  <div style={styles.dayHeading}>{dayNames[day]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period}>
                <td style={{ ...styles.timetableTd, ...styles.periodsColumn }}>
                  <div style={styles.timetablePeriodLabel}>Tiết {period}</div>
                  <div style={styles.timetableTimeLabel}>
                    {getTimeSlotRange(period)}
                  </div>
                </td>
                {days.map((day) => (
                  <td key={`${day}-${period}`} style={styles.timetableTd}>
                    {timetableData[day][period] &&
                    timetableData[day][period].length > 0 ? (
                      timetableData[day][period].map((slot, index) => (
                        <div key={index} style={styles.timetableSlot}>
                          <div style={styles.timetableSlotSubject}>
                            {slot.subject}
                          </div>
                          <div style={styles.timetableSlotClass}>
                            Lớp: {slot.classId}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={styles.timetableEmptySlot}>Trống</div>
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

  // Tạo bảng dạng danh sách
  const renderScheduleList = () => {
    return (
      <table style={styles.scheduleTable}>
        <thead>
          <tr>
            <th style={styles.scheduleHeader}>Lớp</th>
            <th style={styles.scheduleHeader}>Thời gian</th>
            <th style={styles.scheduleHeader}>Ngày trong tuần</th>
            <th style={styles.scheduleHeader}>Tuần</th>
            <th style={styles.scheduleHeader}>Môn học</th>
          </tr>
        </thead>
        <tbody>
          {scheduleData.map((schedule) => (
            <tr
              key={schedule.id}
              style={{
                transition: "background-color 0.2s",
                ":hover": { backgroundColor: "#f9fbff" },
              }}
            >
              <td style={styles.scheduleCell}>{schedule.classId}</td>
              <td style={styles.scheduleCell}>
                Tiết {schedule.timeSlot} ({getTimeSlotRange(schedule.timeSlot)})
              </td>
              <td style={styles.scheduleCell}>
                {{
                  1: "Thứ hai",
                  2: "Thứ ba",
                  3: "Thứ tư",
                  4: "Thứ năm",
                  5: "Thứ sáu",
                  6: "Thứ bảy",
                  7: "Chủ nhật",
                }[schedule.dayOfWeek] || `Ngày ${schedule.dayOfWeek}`}
              </td>
              <td style={styles.scheduleCell}>{schedule.weekId}</td>
              <td style={styles.scheduleCell}>{schedule.subject}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
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
        <Header title="Quản lý Giáo viên" />
        <main style={{ padding: "20px 40px 40px 40px" }}>
          {/* Phần tiêu đề và nút thêm mới */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ color: "#333", fontSize: "24px", margin: 0 }}>
              Danh sách Giáo viên ({filteredTeachers.length})
            </h2>
            <button onClick={handleAddTeacher} style={styles.addButton}>
              <FaPlus /> Thêm giáo viên
            </button>
          </div>

          {/* Phần tìm kiếm và lọc */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            <div style={styles.searchContainer}>
              <FaSearch style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên giáo viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <Select
              placeholder="Lọc theo môn học"
              allowClear
              style={{ width: 200, height: "40px" }}
              onChange={handleFilterBySubject}
            >
              {subjects.map((subject) => (
                <Select.Option key={subject.id} value={subject.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaBook style={{ color: "#1976d2" }} /> {subject.name}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Bảng danh sách giáo viên */}
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "50px",
              }}
            >
              <Spin size="large" />
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.tableHeader, width: "50px" }}>#</th>
                    <th style={{ ...styles.tableHeader, width: "70px" }}>
                      Ảnh
                    </th>
                    <th style={styles.tableHeader}>Tên giáo viên</th>
                    <th style={styles.tableHeader}>Liên hệ</th>
                    <th style={styles.tableHeader}>Môn dạy</th>
                    <th style={{ ...styles.tableHeader, width: "180px" }}>
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        Không tìm thấy giáo viên nào.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((teacher, index) => (
                      <tr key={teacher.id} style={styles.tableRow}>
                        <td
                          style={{ ...styles.tableCell, textAlign: "center" }}
                        >
                          {index + 1}
                        </td>
                        <td style={styles.tableCell}>
                          {teacher.avatar ? (
                            <img
                              src={teacher.avatar}
                              alt={teacher.name}
                              style={styles.avatar}
                            />
                          ) : (
                            <div style={styles.avatarPlaceholder}>
                              {teacher.name.charAt(0)}
                            </div>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          <div style={{ fontWeight: "500" }}>
                            {teacher.name}
                          </div>
                          {teacher.gender && (
                            <small style={{ color: "#666" }}>
                              {teacher.gender}
                            </small>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          {teacher.email && (
                            <div style={{ fontSize: "13px" }}>
                              {teacher.email}
                            </div>
                          )}
                          {teacher.phone && (
                            <div style={{ fontSize: "13px" }}>
                              {teacher.phone}
                            </div>
                          )}
                        </td>
                        <td style={styles.tableCell}>
                          {teacher.subjects && teacher.subjects.length > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                              }}
                            >
                              {teacher.subjectIds &&
                                teacher.subjectIds.map((subjectId, idx) => (
                                  <Tag
                                    key={idx}
                                    color="blue"
                                    style={styles.subjectTag}
                                  >
                                    {getSubjectName(subjectId)}
                                  </Tag>
                                ))}
                            </div>
                          ) : (
                            <span
                              style={{ color: "#999", fontStyle: "italic" }}
                            >
                              Chưa phân công
                            </span>
                          )}
                        </td>
                        <td
                          style={{ ...styles.tableCell, textAlign: "center" }}
                        >
                          <div style={styles.actionButtons}>
                            <Tooltip title="Xem lịch dạy">
                              <button
                                onClick={() => handleViewSchedule(teacher.id)}
                                style={{
                                  ...styles.actionButton,
                                  ...styles.viewButton,
                                }}
                              >
                                <FaCalendarAlt />
                              </button>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
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
                            <Tooltip title="Xóa">
                              <button
                                onClick={() => handleDeleteTeacher(teacher.id)}
                                style={{
                                  ...styles.actionButton,
                                  ...styles.deleteButton,
                                }}
                              >
                                <FaTrash />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Hiển thị lịch dạy nếu được chọn */}
          {viewSchedule && (
            <div
              style={{
                marginTop: "30px",
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0, color: "#1976d2" }}>
                  Lịch dạy: {teachers.find((t) => t.id === viewSchedule)?.name}
                </h3>
                <button
                  onClick={() => setViewSchedule(null)}
                  style={{
                    background: "#f0f0f0",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              {scheduleData.length === 0 ? (
                <div style={styles.emptyMessage}>
                  Chưa có lịch dạy cho giáo viên này.
                </div>
              ) : (
                <>
                  {/* Tab chuyển đổi giữa dạng thời khóa biểu và dạng danh sách */}
                  <div style={styles.tabContainer}>
                    <Tabs
                      activeKey={activeScheduleTab}
                      onChange={(key) => setActiveScheduleTab(key)}
                      items={[
                        {
                          key: "timetable",
                          label: "Thời khóa biểu",
                          children: renderTimetable(),
                        },
                        {
                          key: "list",
                          label: "Danh sách",
                          children: renderScheduleList(),
                        },
                      ]}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Modal Form thêm/sửa giáo viên */}
        <Modal
          title={
            editingTeacher
              ? "Cập nhật thông tin giáo viên"
              : "Thêm giáo viên mới"
          }
          open={isModalVisible}
          onOk={handleModalSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText={editingTeacher ? "Cập nhật" : "Thêm mới"}
          cancelText="Hủy"
          maskClosable={false}
          width={600}
        >
          <Form form={form} layout="vertical">
            <div style={{ display: "flex", gap: "16px" }}>
              <Form.Item
                name="name"
                label="Tên giáo viên"
                rules={[
                  { required: true, message: "Vui lòng nhập tên giáo viên" },
                ]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Nhập tên giáo viên" />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Giới tính"
                style={{ width: "120px" }}
              >
                <Select placeholder="Chọn giới tính">
                  <Select.Option value="Nam">Nam</Select.Option>
                  <Select.Option value="Nữ">Nữ</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <Form.Item name="email" label="Email" style={{ flex: 1 }}>
                <Input placeholder="example@email.com" />
              </Form.Item>

              <Form.Item name="phone" label="Số điện thoại" style={{ flex: 1 }}>
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </div>

            <Form.Item name="avatar" label="URL ảnh đại diện">
              <Input placeholder="https://example.com/avatar.jpg" />
            </Form.Item>

            {/* Giữ trường kinh nghiệm trong form */}
            <Form.Item name="experience" label="Kinh nghiệm">
              <Input placeholder="Ví dụ: 5 năm" />
            </Form.Item>

            <Form.Item
              name="subjectIds"
              label="Môn học giảng dạy"
              rules={[
                { required: true, message: "Vui lòng chọn ít nhất 1 môn học" },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn các môn học giảng dạy"
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

            {/* Giữ trường đánh giá trong form */}
            <Form.Item name="rating" label="Đánh giá">
              <Rate allowHalf />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
