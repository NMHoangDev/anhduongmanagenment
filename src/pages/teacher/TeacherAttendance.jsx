import React, { useState, useEffect, useCallback } from "react";
import {
  message,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Modal,
  Alert,
  Divider,
  List,
  Typography,
  DatePicker,
} from "antd";
import {
  FaClock,
  FaSignInAlt,
  FaSignOutAlt,
  FaCalendarAlt,
  FaChartLine,
  FaUser,
  FaCheckCircle,
  FaBookOpen,
  FaTimesCircle,
} from "react-icons/fa";
import {
  teacherCheckIn,
  teacherCheckOut,
  getTeacherTodayStatus,
  getTeacherAttendanceByDateRange,
  getTeacherAttendanceStats,
  fixTimetableDates,
  createTimetableSessionWithCorrectDate,
} from "../../services/attendanceService";
import { findTeacherIdByAuthUid } from "../../services/teacherService";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

const { Text, Title } = Typography;

export default function TeacherAttendance() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [todayStatus, setTodayStatus] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const [realTeacherId, setRealTeacherId] = useState(null);

  // State for date selection
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Fetch today's status and schedule
  const fetchTodayStatus = useCallback(async () => {
    try {
      console.log("🔍 Fetching status for auth UID:", currentUser.uid);

      // Find real teacher ID from auth UID if not already found
      let teacherIdToUse = realTeacherId;
      if (!teacherIdToUse) {
        teacherIdToUse = await findTeacherIdByAuthUid(currentUser.uid);
        console.log("📝 Found teacher ID:", teacherIdToUse);
        setRealTeacherId(teacherIdToUse); // Save to state
      }

      if (!teacherIdToUse) {
        console.warn(
          "⚠️ Cannot find teacher ID for auth UID:",
          currentUser.uid
        );
        setTodayStatus({
          hasSchedule: false,
          expectedCheckIn: null,
          expectedCheckOut: null,
          periods: [],
          totalPeriods: 0,
          hasCheckedIn: false,
          hasCheckedOut: false,
          checkInData: null,
          checkOutData: null,
          canCheckIn: false,
          canCheckOut: false,
        });
        return;
      }

      const dateToCheck = selectedDate.format("YYYY-MM-DD");
      console.log(
        "📅 Using teacherId:",
        teacherIdToUse,
        "for date:",
        dateToCheck
      );

      // DEBUG: Manual query to check timetable data
      console.log("🔍 DEBUG: About to call getTeacherTodayStatus with:", {
        teacherId: teacherIdToUse,
        date: dateToCheck,
        authUid: currentUser.uid,
      });

      const status = await getTeacherTodayStatus(teacherIdToUse, dateToCheck);
      console.log("✅ Status loaded:", status);
      setTodayStatus(status);
    } catch (error) {
      console.error("❌ Error fetching status:", error);
      message.error("Không thể tải trạng thái ngày đã chọn");
      // Set default status to prevent infinite loading
      setTodayStatus({
        hasSchedule: false,
        expectedCheckIn: null,
        expectedCheckOut: null,
        periods: [],
        totalPeriods: 0,
        hasCheckedIn: false,
        hasCheckedOut: false,
        checkInData: null,
        checkOutData: null,
        canCheckIn: false,
        canCheckOut: false,
      });
    }
  }, [currentUser.uid, selectedDate, realTeacherId]);

  const fetchMonthlyStats = useCallback(async () => {
    try {
      // Use realTeacherId if available, otherwise fall back to UID
      const teacherIdToUse = realTeacherId || currentUser.uid;
      console.log("📊 Fetching monthly stats for teacherId:", teacherIdToUse);

      const startDate = dayjs().startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs().endOf("month").format("YYYY-MM-DD");
      const stats = await getTeacherAttendanceStats(
        teacherIdToUse,
        startDate,
        endDate
      );
      setMonthlyStats(stats);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      // Set empty stats to prevent errors
      setMonthlyStats({
        stats: {
          totalSessions: 0,
          present: 0,
          attendanceRate: 0,
          totalHoursWorked: 0,
        },
        records: [],
      });
    }
  }, [currentUser.uid, realTeacherId]);

  const fetchAttendanceHistory = useCallback(async () => {
    try {
      // Use realTeacherId if available, otherwise fall back to UID
      const teacherIdToUse = realTeacherId || currentUser.uid;
      console.log(
        "📚 Fetching attendance history for teacherId:",
        teacherIdToUse
      );

      const startDate = dayjs().startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs().endOf("month").format("YYYY-MM-DD");
      const history = await getTeacherAttendanceByDateRange(
        teacherIdToUse,
        startDate,
        endDate
      );
      setAttendanceHistory(history);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      // Set empty array to prevent errors
      setAttendanceHistory([]);
    }
  }, [currentUser.uid, realTeacherId]);

  // Find teacherId from auth UID when component mounts
  useEffect(() => {
    const findTeacherId = async () => {
      if (currentUser?.uid && !realTeacherId) {
        try {
          console.log("🔍 Finding teacherId for auth UID:", currentUser.uid);
          const teacherId = await findTeacherIdByAuthUid(currentUser.uid);
          console.log("📝 Found teacherId:", teacherId);
          setRealTeacherId(teacherId);
        } catch (error) {
          console.error("❌ Error finding teacherId:", error);
        }
      }
    };

    findTeacherId();
  }, [currentUser?.uid, realTeacherId]);

  useEffect(() => {
    console.log("🚀 Component mounted, currentUser:", currentUser?.uid);
    if (currentUser?.uid) {
      fetchTodayStatus();
      fetchMonthlyStats();
      fetchAttendanceHistory();
    }
  }, [
    currentUser?.uid,
    selectedDate, // Add selectedDate dependency
    realTeacherId, // Add realTeacherId dependency so it refetches when teacherId is found
    fetchTodayStatus,
    fetchMonthlyStats,
    fetchAttendanceHistory,
  ]);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const teacherIdToUse = realTeacherId || currentUser.uid;
      const dateToCheck = selectedDate.format("YYYY-MM-DD");

      // Lấy giờ bắt đầu tiết học sớm nhất trong ngày
      let checkInTime = null;
      if (
        todayStatus &&
        todayStatus.periods &&
        todayStatus.periods.length > 0
      ) {
        const sortedPeriods = [...todayStatus.periods].sort((a, b) => {
          const [h1, m1] = a.startTime.split(":").map(Number);
          const [h2, m2] = b.startTime.split(":").map(Number);
          return h1 * 60 + m1 - (h2 * 60 + m2);
        });
        checkInTime = sortedPeriods[0].startTime;
      }

      if (!checkInTime) {
        message.error("Không tìm thấy tiết học để lấy giờ check-in!");
        setLoading(false);
        return;
      }

      // Gọi service, truyền thêm giờ check-in mong muốn
      const result = await teacherCheckIn(
        teacherIdToUse,
        dateToCheck,
        checkInTime
      );
      message.success(result.message);
      fetchTodayStatus(); // Refresh status
    } catch (error) {
      message.error(error.message || "Lỗi khi check-in");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      const teacherIdToUse = realTeacherId || currentUser.uid;
      const dateToCheck = selectedDate.format("YYYY-MM-DD");

      // Lấy giờ kết thúc tiết học muộn nhất trong ngày
      let checkOutTime = null;
      if (
        todayStatus &&
        todayStatus.periods &&
        todayStatus.periods.length > 0
      ) {
        const sortedPeriods = [...todayStatus.periods].sort((a, b) => {
          const [h1, m1] = a.endTime.split(":").map(Number);
          const [h2, m2] = b.endTime.split(":").map(Number);
          return h1 * 60 + m1 - (h2 * 60 + m2);
        });
        checkOutTime = sortedPeriods[sortedPeriods.length - 1].endTime;
      }

      if (!checkOutTime) {
        message.error("Không tìm thấy tiết học để lấy giờ check-out!");
        setLoading(false);
        return;
      }

      // Gọi service, truyền thêm giờ check-out mong muốn
      const result = await teacherCheckOut(
        teacherIdToUse,
        dateToCheck,
        checkOutTime
      );
      message.success(
        `${result.message}. Tổng giờ làm: ${result.workingHours}h`
      );
      fetchTodayStatus(); // Refresh status
      fetchMonthlyStats(); // Refresh stats
    } catch (error) {
      message.error(error.message || "Lỗi khi check-out");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "#52c41a";
      case "late":
        return "#faad14";
      case "early_leave":
        return "#ff7a45";
      case "completed":
        return "#1890ff";
      case "absent":
        return "#ff4d4f";
      default:
        return "#d9d9d9";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "present":
        return "Đúng giờ";
      case "late":
        return "Đi muộn";
      case "early_leave":
        return "Về sớm";
      case "completed":
        return "Hoàn thành";
      case "absent":
        return "Vắng mặt";
      default:
        return "Chưa xác định";
    }
  };

  const columns = [
    {
      title: "Ngày",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Check-in",
      key: "checkIn",
      render: (_, record) => {
        if (record.checkInData) {
          return (
            <div>
              <Text strong>{record.checkInData.actualTime}</Text>
              <br />
              <Tag color={getStatusColor(record.checkInData.status)}>
                {getStatusText(record.checkInData.status)}
              </Tag>
            </div>
          );
        }
        return <Text type="secondary">Chưa check-in</Text>;
      },
    },
    {
      title: "Check-out",
      key: "checkOut",
      render: (_, record) => {
        if (record.checkOutData) {
          return (
            <div>
              <Text strong>{record.checkOutData.actualTime}</Text>
              <br />
              <Tag color={getStatusColor(record.checkOutData.status)}>
                {getStatusText(record.checkOutData.status)}
              </Tag>
            </div>
          );
        }
        return <Text type="secondary">Chưa check-out</Text>;
      },
    },
    {
      title: "Giờ làm việc",
      key: "workingHours",
      render: (_, record) => {
        if (record.checkOutData && record.checkOutData.workingHours) {
          return `${record.checkOutData.workingHours}h`;
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: "Ghi chú",
      key: "notes",
      render: (_, record) => {
        const notes = [];
        if (record.checkInData?.note) notes.push(record.checkInData.note);
        if (record.checkOutData?.note) notes.push(record.checkOutData.note);
        return notes.length > 0 ? notes.join("; ") : "-";
      },
    },
  ];

  if (!currentUser) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <FaClock size={48} color="#ccc" />
        <Title level={4}>Đang xác thực người dùng...</Title>
      </div>
    );
  }

  if (!todayStatus) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <FaClock size={48} color="#ccc" />
        <Title level={4}>Đang tải dữ liệu...</Title>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>
              <FaClock style={{ marginRight: 8, color: "#1890ff" }} />
              Điểm danh giáo viên
            </Title>
            <Text type="secondary">
              Quản lý check-in/check-out và theo dõi giờ làm việc
            </Text>
            {/* Debug info */}
            {realTeacherId && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Teacher ID: {realTeacherId}
                </Text>

                {/* Giữ lại nút sửa ngày nếu cần */}
                <Button
                  type="primary"
                  danger
                  onClick={async () => {
                    try {
                      setLoading(true);
                      message.info("Đang sửa ngày trong thời khóa biểu...");
                      const result = await fixTimetableDates();
                      console.log("🔧 Fix result:", result);
                      message.success(
                        `Đã sửa ${result.sessionsFixed ?? 0} phiên thành công`
                      );
                    } catch (error) {
                      console.error("❌ Fix failed:", error);
                      message.error(
                        "Fix failed: " + (error.message || "Lỗi không rõ")
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  loading={loading}
                  style={{ marginLeft: 8 }}
                >
                  🔧 Fix Dates
                </Button>

                {/* (TUỲ CHỌN) Nếu bạn muốn tạo 1 phiên đúng ngày thủ công:
                <Button
                  size="small"
                  type="link"
                  onClick={async () => {
                    try {
                      await createTimetableSessionWithCorrectDate(/* params ví dụ * /);
                      message.success("Đã tạo phiên mẫu");
                    } catch (e) {
                      message.error("Tạo phiên lỗi: " + e.message);
                    }
                  }}
                  style={{ marginLeft: 8 }}
                >
                  ➕ Create Session
                </Button>
                */}
              </div>
            )}
          </Col>
          <Col>
            <div style={{ textAlign: "right" }}>
              <Text strong style={{ marginRight: 8 }}>
                Chọn ngày:
              </Text>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                style={{ width: 150 }}
              />
            </div>
          </Col>
        </Row>
      </div>

      {/* Schedule Alert for Selected Date */}
      {!todayStatus.hasSchedule ? (
        <Alert
          message={`Không có lịch dạy ngày ${
            selectedDate ? selectedDate.format("DD/MM/YYYY") : ""
          }`}
          description="Không có tiết dạy nào trong lịch trình ngày đã chọn."
          type="info"
          showIcon
          icon={<FaCalendarAlt />}
          style={{ marginBottom: 24 }}
        />
      ) : (
        <Card style={{ marginBottom: 24 }}>
          <Alert
            message={`Lịch dạy ngày ${
              selectedDate ? selectedDate.format("DD/MM/YYYY") : ""
            }: ${todayStatus.totalPeriods} tiết`}
            description={
              <div>
                <Text>
                  <strong>Giờ check-in:</strong>{" "}
                  <Text code>{todayStatus.checkInTime}</Text>
                </Text>
                <Divider type="vertical" />
                <Text>
                  <strong>Giờ check-out:</strong>{" "}
                  <Text code>{todayStatus.checkOutTime}</Text>
                </Text>
              </div>
            }
            type="success"
            showIcon
            icon={<FaBookOpen />}
            style={{ marginBottom: 16 }}
          />

          {/* Chi tiết các tiết học */}
          <Title level={5} style={{ marginBottom: 12 }}>
            <FaCalendarAlt style={{ marginRight: 8 }} />
            Chi tiết các tiết học:
          </Title>
          <Row gutter={[16, 8]}>
            {todayStatus.periods?.map((period, index) => (
              <Col span={12} key={index}>
                <Card
                  size="small"
                  style={{
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #e1e1e1",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <Text strong style={{ color: "#1890ff" }}>
                        {period.period} ({period.startTime} - {period.endTime})
                      </Text>
                      <br />
                      <Text>{period.subject}</Text>
                      <br />
                      <Text type="secondary">Lớp: {period.classId}</Text>
                      {period.room && (
                        <>
                          <br />
                          <Text type="secondary">Phòng: {period.room}</Text>
                        </>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Tag color="blue">{period.timeSlot}</Tag>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Check-in/Check-out Controls */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Row align="middle">
              <Col span={4}>
                <FaSignInAlt size={32} color="#52c41a" />
              </Col>
              <Col span={14}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    Check-in
                  </Title>
                  {todayStatus.hasCheckedIn ? (
                    <div>
                      <Text strong>{todayStatus.checkInData.actualTime}</Text>
                      <br />
                      <Tag
                        color={getStatusColor(todayStatus.checkInData.status)}
                      >
                        {getStatusText(todayStatus.checkInData.status)}
                      </Tag>
                    </div>
                  ) : todayStatus.hasSchedule ? (
                    <div>
                      <Text type="secondary">
                        Dự kiến: {todayStatus.checkInTime}
                      </Text>
                      <br />
                      <Text type="secondary">Chưa check-in</Text>
                    </div>
                  ) : (
                    <Text type="secondary">Không có lịch dạy</Text>
                  )}
                </div>
              </Col>
              <Col span={6}>
                <Button
                  type="primary"
                  size="large"
                  icon={<FaSignInAlt />}
                  loading={loading}
                  disabled={!todayStatus.canCheckIn}
                  onClick={handleCheckIn}
                  style={{ width: "100%" }}
                >
                  {todayStatus.hasCheckedIn ? "Đã check-in" : "Check-in"}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={12}>
          <Card>
            <Row align="middle">
              <Col span={4}>
                <FaSignOutAlt size={32} color="#ff4d4f" />
              </Col>
              <Col span={14}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    Check-out
                  </Title>
                  {todayStatus.hasCheckedOut ? (
                    <div>
                      <Text strong>{todayStatus.checkOutData.actualTime}</Text>
                      <br />
                      <Tag
                        color={getStatusColor(todayStatus.checkOutData.status)}
                      >
                        {getStatusText(todayStatus.checkOutData.status)}
                      </Tag>
                    </div>
                  ) : todayStatus.hasSchedule ? (
                    <div>
                      <Text type="secondary">
                        Dự kiến: {todayStatus.checkOutTime}
                      </Text>
                      <br />
                      <Text type="secondary">Chưa check-out</Text>
                    </div>
                  ) : (
                    <Text type="secondary">Không có lịch dạy</Text>
                  )}
                </div>
              </Col>
              <Col span={6}>
                <Button
                  type="primary"
                  size="large"
                  icon={<FaSignOutAlt />}
                  loading={loading}
                  disabled={!todayStatus.canCheckOut}
                  onClick={handleCheckOut}
                  style={{ width: "100%" }}
                  danger
                >
                  {todayStatus.hasCheckedOut ? "Đã check-out" : "Check-out"}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Monthly Statistics */}
      {monthlyStats && (
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>
            <FaChartLine style={{ marginRight: 8 }} />
            Thống kê tháng {dayjs().format("MM/YYYY")}
          </Title>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Tổng buổi dạy"
                value={monthlyStats.stats?.totalSessions || 0}
                prefix={<FaCalendarAlt />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Có mặt"
                value={monthlyStats.stats?.present || 0}
                valueStyle={{ color: "#52c41a" }}
                prefix={<FaCheckCircle />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Tỷ lệ tham gia"
                value={monthlyStats.stats?.attendanceRate || 0}
                suffix="%"
                valueStyle={{ color: "#1890ff" }}
                prefix={<FaUser />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Tổng giờ làm"
                value={monthlyStats.stats?.totalHoursWorked || 0}
                suffix="h"
                valueStyle={{ color: "#722ed1" }}
                prefix={<FaClock />}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Attendance History */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            Lịch sử điểm danh
          </Title>
          <Button icon={<FaChartLine />} onClick={() => setStatsVisible(true)}>
            Xem chi tiết
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={attendanceHistory}
          rowKey="date"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} ngày`,
          }}
        />
      </Card>

      {/* Stats Modal */}
      <Modal
        title="Chi tiết thống kê"
        open={statsVisible}
        onCancel={() => setStatsVisible(false)}
        footer={null}
        width={800}
      >
        {monthlyStats && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Tổng buổi dạy"
                    value={monthlyStats.stats?.totalSessions || 0}
                    prefix={<FaCalendarAlt />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Buổi có mặt"
                    value={monthlyStats.stats?.present || 0}
                    valueStyle={{ color: "#52c41a" }}
                    prefix={<FaCheckCircle />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Buổi vắng mặt"
                    value={monthlyStats.stats?.absent || 0}
                    valueStyle={{ color: "#ff4d4f" }}
                    prefix={<FaTimesCircle />}
                  />
                </Card>
              </Col>
            </Row>

            <Title level={5}>Chi tiết theo ngày:</Title>
            <List
              dataSource={monthlyStats.records || []}
              renderItem={(record) => (
                <List.Item>
                  <List.Item.Meta
                    title={dayjs(record.date).format("DD/MM/YYYY")}
                    description={
                      <div>
                        <Tag color={getStatusColor(record.status)}>
                          {getStatusText(record.status)}
                        </Tag>
                        {record.note && (
                          <Text type="secondary"> - {record.note}</Text>
                        )}
                      </div>
                    }
                  />
                  <div>
                    {record.timeSlot && <Text>{record.timeSlot}</Text>}
                    {record.subject && <br />}
                    {record.subject && (
                      <Text type="secondary">{record.subject}</Text>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
