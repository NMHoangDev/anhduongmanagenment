import React, { useState, useEffect, useCallback } from "react";
import {
  message,
  Button,
  Table,
  Select,
  Input,
  Modal,
  DatePicker,
  Card,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  FaCheck,
  FaTimes,
  FaClock,
  FaUserCheck,
  FaCalendarAlt,
  FaUsers,
  FaChartLine,
} from "react-icons/fa";
import {
  markStudentAttendance,
  markBulkStudentAttendance,
  getStudentAttendanceByDate,
  getClassAttendanceOverview,
  getHomeRoomClasses,
  getHomeRoomStudentsForAttendance,
} from "../../services/teacherServices/attendanceService";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";

const { Option } = Select;

export default function StudentAttendance() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [attendanceData, setAttendanceData] = useState([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const [classStats, setClassStats] = useState(null);

  // Attendance status options
  const statusOptions = [
    { value: "present", label: "Có mặt", icon: <FaCheck />, color: "#52c41a" },
    { value: "absent", label: "Vắng mặt", icon: <FaTimes />, color: "#ff4d4f" },
    { value: "late", label: "Đi muộn", icon: <FaClock />, color: "#faad14" },
    {
      value: "excused",
      label: "Vắng có phép",
      icon: <FaUserCheck />,
      color: "#1890ff",
    },
  ];

  // fetch homeroom classes for current teacher (GVCN)
  const fetchClasses = useCallback(async () => {
    try {
      if (!currentUser?.uid) return;
      const classData = await getHomeRoomClasses(currentUser.uid);
      setClasses(classData);
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Không thể tải danh sách lớp");
    }
  }, [currentUser]);

  // fetch students + their attendance for selected class and date
  const fetchStudentsForAttendance = useCallback(async () => {
    try {
      if (!selectedClass || !currentUser?.uid) {
        setStudents([]);
        setAttendanceData([]);
        return;
      }
      setLoading(true);
      const dateString = selectedDate.format("YYYY-MM-DD");
      const res = await getHomeRoomStudentsForAttendance(
        selectedClass,
        currentUser.uid,
        dateString
      );
      const fetchedStudents = res?.students || [];
      setStudents(fetchedStudents);

      // Map to UI attendanceData shape
      const attendanceWithStudents = fetchedStudents.map((s) => ({
        ...s,
        // ensure status & note exist for UI
        status: s.status || "unmarked",
        note: s.attendance?.note || "",
      }));

      setAttendanceData(attendanceWithStudents);
    } catch (error) {
      console.error("Error fetching students for attendance:", error);
      message.error("Không thể tải danh sách học sinh / điểm danh");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate, currentUser]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchStudentsForAttendance();
    // run when class or date changes
  }, [selectedClass, selectedDate, fetchStudentsForAttendance]);

  const handleAttendanceChange = (studentId, status, note = "") => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.id === studentId ? { ...item, status, note } : item
      )
    );
  };

  const handleSingleAttendance = async (studentId, status, note) => {
    try {
      await markStudentAttendance(
        studentId,
        selectedClass,
        currentUser.uid,
        status,
        note
      );

      message.success("Điểm danh thành công");
      await fetchStudentsForAttendance(); // Refresh data
    } catch (error) {
      console.error("Error marking attendance:", error);
      message.error("Lỗi khi điểm danh");
    }
  };

  const handleBulkAttendance = async () => {
    try {
      setLoading(true);

      const attendanceList = attendanceData
        .filter((item) => item.status !== "unmarked")
        .map((item) => ({
          studentId: item.id,
          status: item.status,
          note: item.note,
        }));

      if (attendanceList.length === 0) {
        message.warning("Vui lòng điểm danh ít nhất một học sinh");
        return;
      }

      await markBulkStudentAttendance(
        attendanceList,
        selectedClass,
        currentUser.uid
      );
      message.success(
        `Điểm danh thành công cho ${attendanceList.length} học sinh`
      );
      await fetchStudentsForAttendance();
    } catch (error) {
      console.error("Error bulk attendance:", error);
      message.error("Lỗi khi điểm danh hàng loạt");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMarkAll = (status) => {
    setAttendanceData((prev) =>
      prev.map((item) => ({ ...item, status, note: "" }))
    );
  };

  const fetchClassStats = async () => {
    try {
      if (!selectedClass) return;
      const month = selectedDate.month() + 1;
      const year = selectedDate.year();
      // pass teacherId to ensure permission check on backend
      const stats = await getClassAttendanceOverview(
        selectedClass,
        month,
        year,
        currentUser.uid
      );
      setClassStats(stats);
      setStatsVisible(true);
    } catch (error) {
      console.error("Error fetching stats:", error);
      message.error("Không thể tải thống kê");
    }
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Học sinh",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {record.avatar ? (
            <img
              src={record.avatar}
              alt="avatar"
              style={{ width: 32, height: 32, borderRadius: "50%" }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#1890ff",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              {text?.charAt(0) || ""}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => (
        <Select
          value={status}
          onChange={(value) =>
            handleAttendanceChange(record.id, value, record.note)
          }
          style={{ width: "100%" }}
          placeholder="Chọn trạng thái"
        >
          <Option value="unmarked" disabled>
            <span style={{ color: "#999" }}>Chưa điểm danh</span>
          </Option>
          {statusOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              <span
                style={{
                  color: option.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {option.icon} {option.label}
              </span>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (note, record) => (
        <Input.TextArea
          value={note}
          onChange={(e) =>
            handleAttendanceChange(record.id, record.status, e.target.value)
          }
          placeholder="Ghi chú..."
          rows={1}
          style={{ minHeight: 32 }}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          disabled={record.status === "unmarked"}
          onClick={() =>
            handleSingleAttendance(record.id, record.status, record.note)
          }
        >
          Lưu
        </Button>
      ),
    },
  ];

  const getStatusStats = () => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    attendanceData.forEach((item) => {
      stats[item.status] = (stats[item.status] || 0) + 1;
    });
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: "bold",
            margin: 0,
            marginBottom: 8,
          }}
        >
          <FaCalendarAlt style={{ marginRight: 8, color: "#1890ff" }} />
          Điểm danh học sinh
        </h1>
        <p style={{ color: "#666", margin: 0 }}>
          Quản lý điểm danh hàng ngày cho học sinh
        </p>
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Chọn lớp:
            </label>
            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="Chọn lớp học"
              style={{ width: "100%" }}
            >
              {classes.map((cls) => (
                <Option key={cls.id} value={cls.id}>
                  {cls.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Ngày điểm danh:
            </label>
            <DatePicker
              value={selectedDate}
              onChange={(d) => setSelectedDate(d || dayjs())}
              format="DD/MM/YYYY"
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={12}>
            <label
              style={{ display: "block", marginBottom: 8, fontWeight: 500 }}
            >
              Điểm danh nhanh:
            </label>
            <Button.Group>
              <Button
                icon={<FaCheck />}
                onClick={() => handleQuickMarkAll("present")}
                style={{ color: "#52c41a" }}
              >
                Tất cả có mặt
              </Button>
              <Button
                icon={<FaTimes />}
                onClick={() => handleQuickMarkAll("absent")}
                style={{ color: "#ff4d4f" }}
              >
                Tất cả vắng
              </Button>
              <Button
                icon={<FaChartLine />}
                onClick={fetchClassStats}
                disabled={!selectedClass}
              >
                Thống kê
              </Button>
            </Button.Group>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      {selectedClass && (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Tổng số học sinh"
                value={attendanceData.length}
                prefix={<FaUsers />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Có mặt"
                value={stats.present}
                valueStyle={{ color: "#52c41a" }}
                prefix={<FaCheck />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Vắng mặt"
                value={stats.absent}
                valueStyle={{ color: "#ff4d4f" }}
                prefix={<FaTimes />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Đi muộn"
                value={stats.late}
                valueStyle={{ color: "#faad14" }}
                prefix={<FaClock />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Vắng có phép"
                value={stats.excused}
                valueStyle={{ color: "#1890ff" }}
                prefix={<FaUserCheck />}
              />
            </Col>
            <Col span={2}>
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={handleBulkAttendance}
                disabled={
                  !selectedClass || stats.unmarked === attendanceData.length
                }
                style={{ width: "100%", height: 60 }}
              >
                Lưu tất cả
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Attendance Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={attendanceData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} học sinh`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Stats Modal */}
      <Modal
        title="Thống kê điểm danh tháng"
        open={statsVisible}
        onCancel={() => setStatsVisible(false)}
        footer={null}
        width={800}
      >
        {classStats && (
          <div>
            {classStats.map((dayStat) => (
              <Card key={dayStat.date} size="small" style={{ marginBottom: 8 }}>
                <Row gutter={16}>
                  <Col span={6}>
                    <strong>{dayjs(dayStat.date).format("DD/MM/YYYY")}</strong>
                  </Col>
                  <Col span={3}>
                    <span style={{ color: "#52c41a" }}>
                      Có mặt: {dayStat.present}
                    </span>
                  </Col>
                  <Col span={3}>
                    <span style={{ color: "#ff4d4f" }}>
                      Vắng: {dayStat.absent}
                    </span>
                  </Col>
                  <Col span={3}>
                    <span style={{ color: "#faad14" }}>
                      Muộn: {dayStat.late}
                    </span>
                  </Col>
                  <Col span={3}>
                    <span style={{ color: "#1890ff" }}>
                      Có phép: {dayStat.excused}
                    </span>
                  </Col>
                  <Col span={6}>
                    <span>
                      Tỷ lệ:{" "}
                      {(
                        ((dayStat.present + dayStat.late) / dayStat.total) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
