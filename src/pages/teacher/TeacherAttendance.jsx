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
  FaPlay,
  FaStop,
} from "react-icons/fa";
import {
  teacherCheckIn,
  teacherCheckOut,
  getTeacherTodayStatus,
  getTeacherAttendanceByDateRange,
  getTeacherAttendanceStats,
} from "../../services/teacherServices/attendanceService";
import { findTeacherIdByAuthUid } from "../../services/adminServices/teacherService";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";

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
  const fetchTodayStatus = useCallback(
    async (opts = {}) => {
      try {
        // Find real teacher ID if not available
        let teacherIdToUse = realTeacherId;
        if (!teacherIdToUse) {
          teacherIdToUse = await findTeacherIdByAuthUid(currentUser.uid);
          setRealTeacherId(teacherIdToUse);
        }

        if (!teacherIdToUse) {
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
        const status = await getTeacherTodayStatus(teacherIdToUse, dateToCheck);
        setTodayStatus(status);
      } catch (error) {
        message.error("Không thể tải trạng thái ngày đã chọn");
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
    },
    [currentUser?.uid, selectedDate, realTeacherId]
  );

  const fetchMonthlyStats = useCallback(async () => {
    try {
      const teacherIdToUse = realTeacherId || currentUser.uid;
      const startDate = dayjs().startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs().endOf("month").format("YYYY-MM-DD");
      const stats = await getTeacherAttendanceStats(
        teacherIdToUse,
        startDate,
        endDate
      );
      setMonthlyStats(stats);
    } catch (error) {
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
  }, [currentUser?.uid, realTeacherId]);

  const fetchAttendanceHistory = useCallback(async () => {
    try {
      const teacherIdToUse = realTeacherId || currentUser.uid;
      const startDate = dayjs().startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs().endOf("month").format("YYYY-MM-DD");
      const history = await getTeacherAttendanceByDateRange(
        teacherIdToUse,
        startDate,
        endDate
      );
      setAttendanceHistory(history);
    } catch (error) {
      setAttendanceHistory([]);
    }
  }, [currentUser?.uid, realTeacherId]);

  // Find teacherId from auth UID when component mounts
  useEffect(() => {
    const findTeacherId = async () => {
      if (currentUser?.uid && !realTeacherId) {
        try {
          const teacherId = await findTeacherIdByAuthUid(currentUser.uid);
          setRealTeacherId(teacherId);
        } catch (error) {
          // ignore
        }
      }
    };

    findTeacherId();
  }, [currentUser?.uid, realTeacherId]);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchTodayStatus();
      fetchMonthlyStats();
      fetchAttendanceHistory();
    }
  }, [
    currentUser?.uid,
    selectedDate,
    realTeacherId,
    fetchTodayStatus,
    fetchMonthlyStats,
    fetchAttendanceHistory,
  ]);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const teacherIdToUse = realTeacherId || currentUser.uid;
      const dateToCheck = selectedDate.format("YYYY-MM-DD");

      // Determine earliest period start time for check-in
      let checkInTime = null;
      if (todayStatus?.periods?.length > 0) {
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

      const result = await teacherCheckIn(
        teacherIdToUse,
        dateToCheck,
        checkInTime
      );
      message.success(result.message);
      fetchTodayStatus();
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

      // Determine latest period end time for check-out
      let checkOutTime = null;
      if (todayStatus?.periods?.length > 0) {
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

      const result = await teacherCheckOut(
        teacherIdToUse,
        dateToCheck,
        checkOutTime
      );
      message.success(
        `${result.message}. Tổng giờ làm: ${result.workingHours}h`
      );
      fetchTodayStatus();
      fetchMonthlyStats();
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
      render: (date) => (
        <Text strong style={{ color: "#2c3e50" }}>
          {dayjs(date).format("DD/MM/YYYY")}
        </Text>
      ),
    },
    {
      title: "Check-in",
      key: "checkIn",
      render: (_, record) => {
        if (record.checkInData) {
          return (
            <div style={{ textAlign: "center" }}>
              <Text strong style={{ fontSize: "14px" }}>
                {record.checkInData.actualTime}
              </Text>
              <br />
              <Tag
                color={getStatusColor(record.checkInData.status)}
                style={{ borderRadius: "12px", fontSize: "11px" }}
              >
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
            <div style={{ textAlign: "center" }}>
              <Text strong style={{ fontSize: "14px" }}>
                {record.checkOutData.actualTime}
              </Text>
              <br />
              <Tag
                color={getStatusColor(record.checkOutData.status)}
                style={{ borderRadius: "12px", fontSize: "11px" }}
              >
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
          return (
            <Text strong style={{ color: "#722ed1", fontSize: "14px" }}>
              {record.checkOutData.workingHours}h
            </Text>
          );
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
        return notes.length > 0 ? (
          <Text style={{ fontStyle: "italic", color: "#666" }}>
            {notes.join("; ")}
          </Text>
        ) : (
          "-"
        );
      },
    },
  ];

  if (!currentUser) {
    return (
      <div
        style={{
          padding: 60,
          textAlign: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "none",
          }}
          bodyStyle={{ padding: "40px" }}
        >
          <FaClock size={48} color="#667eea" />
          <Title level={4} style={{ marginTop: 16, color: "#2c3e50" }}>
            Đang xác thực người dùng...
          </Title>
        </Card>
      </div>
    );
  }

  if (!todayStatus) {
    return (
      <div
        style={{
          padding: 60,
          textAlign: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "none",
          }}
          bodyStyle={{ padding: "40px" }}
        >
          <FaClock size={48} color="#667eea" />
          <Title level={4} style={{ marginTop: 16, color: "#2c3e50" }}>
            Đang tải dữ liệu...
          </Title>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      {/* Header Section */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: "16px",
          border: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
        bodyStyle={{ padding: "32px" }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title
              level={2}
              style={{
                margin: 0,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: "12px",
                  borderRadius: "12px",
                }}
              >
                <FaClock style={{ fontSize: "24px" }} />
              </div>
              Điểm danh giáo viên
            </Title>
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "16px",
                marginTop: 8,
              }}
            >
              Quản lý check-in/check-out và theo dõi giờ làm việc
            </Text>
          </Col>
          <Col>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                padding: "16px 20px",
                borderRadius: "12px",
                backdropFilter: "blur(10px)",
              }}
            >
              <Text
                strong
                style={{ color: "#ffffff", marginRight: 8, fontSize: "16px" }}
              >
                Chọn ngày:
              </Text>
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày"
                style={{
                  width: 150,
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                }}
                dropdownStyle={{ borderRadius: "8px" }}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Main Content Section */}
      <Card
        style={{
          borderRadius: "16px",
          border: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          background: "#ffffff",
        }}
        bodyStyle={{ padding: "32px" }}
      >
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
                          {period.period} ({period.startTime} - {period.endTime}
                          )
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
                        <Text strong>
                          {todayStatus.checkOutData.actualTime}
                        </Text>
                        <br />
                        <Tag
                          color={getStatusColor(
                            todayStatus.checkOutData.status
                          )}
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
            <Button
              icon={<FaChartLine />}
              onClick={() => setStatsVisible(true)}
            >
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
      </Card>
    </div>
  );
}
