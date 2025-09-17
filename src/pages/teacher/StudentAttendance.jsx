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
  Typography,
  Tag,
  Avatar,
} from "antd";
import {
  FaCheck,
  FaTimes,
  FaClock,
  FaUserCheck,
  FaCalendarAlt,
  FaUsers,
  FaChartLine,
  FaSave,
  FaUserGraduate,
  FaClipboardList,
} from "react-icons/fa";
import {
  markStudentAttendance,
  markBulkStudentAttendance,
  getStudentAttendanceByDate,
  getClassAttendanceOverview,
} from "../../services/attendanceService";
import { getAllStudents } from "../../services/studentService";
import { getAllClasses } from "../../services/classesService";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";

const { Option } = Select;
const { Title, Text } = Typography;

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

  const fetchClasses = useCallback(async () => {
    try {
      const classData = await getAllClasses();
      setClasses(classData);
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Không thể tải danh sách lớp");
    }
  }, []);

  const fetchStudentsInClass = useCallback(async () => {
    try {
      setLoading(true);
      const studentData = await getAllStudents();
      // Filter students by selected class
      const classStudents = studentData.filter(
        (student) => student.classId === selectedClass
      );
      setStudents(classStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      message.error("Không thể tải danh sách học sinh");
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  const fetchAttendanceData = useCallback(async () => {
    try {
      const dateString = selectedDate.format("YYYY-MM-DD");
      const attendance = await getStudentAttendanceByDate(
        selectedClass,
        dateString
      );

      // Create attendance map
      const attendanceMap = {};
      attendance.forEach((record) => {
        attendanceMap[record.studentId] = record;
      });

      // Merge with student data
      const attendanceWithStudents = students.map((student) => ({
        ...student,
        attendance: attendanceMap[student.id] || null,
        status: attendanceMap[student.id]?.status || "unmarked",
        note: attendanceMap[student.id]?.note || "",
      }));

      setAttendanceData(attendanceWithStudents);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      message.error("Không thể tải dữ liệu điểm danh");
    }
  }, [selectedClass, selectedDate, students]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsInClass();
    }
  }, [selectedClass, fetchStudentsInClass]);

  useEffect(() => {
    if (selectedClass && students.length > 0) {
      fetchAttendanceData();
    }
  }, [selectedClass, selectedDate, students.length, fetchAttendanceData]);

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
      fetchAttendanceData(); // Refresh data
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
      fetchAttendanceData();
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
      const month = selectedDate.month() + 1;
      const year = selectedDate.year();
      const stats = await getClassAttendanceOverview(
        selectedClass,
        month,
        year
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
      align: "center",
      render: (_, __, index) => (
        <Text strong style={{ color: "#1890ff" }}>
          {index + 1}
        </Text>
      ),
    },
    {
      title: "Học sinh",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {record.avatar ? (
            <Avatar src={record.avatar} size={40} />
          ) : (
            <Avatar
              size={40}
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {text?.charAt(0) || "?"}
            </Avatar>
          )}
          <div>
            <Text strong style={{ fontSize: "15px", color: "#2c3e50" }}>
              {text}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }} code>
              {record.id}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (status, record) => (
        <Select
          value={status}
          onChange={(value) =>
            handleAttendanceChange(record.id, value, record.note)
          }
          style={{ width: "100%" }}
          placeholder="Chọn trạng thái"
          size="large"
          dropdownStyle={{ borderRadius: "12px" }}
        >
          <Option value="unmarked" disabled>
            <span style={{ color: "#999" }}>Chưa điểm danh</span>
          </Option>
          {statusOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              <div
                style={{
                  color: option.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 500,
                }}
              >
                {option.icon} {option.label}
              </div>
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
          rows={2}
          style={{ borderRadius: "8px", resize: "none" }}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          size="middle"
          disabled={record.status === "unmarked"}
          onClick={() =>
            handleSingleAttendance(record.id, record.status, record.note)
          }
          style={{
            borderRadius: "8px",
            background: "linear-gradient(135deg, #1890ff, #40a9ff)",
            border: "none",
            fontWeight: 500,
            boxShadow: "0 2px 8px rgba(24, 144, 255, 0.3)",
          }}
          icon={<FaSave />}
        >
          Lưu
        </Button>
      ),
    },
  ];

  const getStatusStats = () => {
    const stats = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    attendanceData.forEach((item) => {
      stats[item.status]++;
    });
    return stats;
  };

  const stats = getStatusStats();

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
                <FaUserGraduate style={{ fontSize: "24px" }} />
              </div>
              Điểm danh học sinh
            </Title>
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "16px",
                marginTop: 8,
              }}
            >
              Quản lý điểm danh hàng ngày cho học sinh
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Controls Section */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: "16px",
          border: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <Row gutter={[16, 16]} align="bottom">
          <Col lg={6} md={12} sm={24}>
            <div>
              <Text
                strong
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#2c3e50",
                  fontSize: "14px",
                }}
              >
                <FaClipboardList style={{ marginRight: 6, color: "#667eea" }} />
                Chọn lớp:
              </Text>
              <Select
                value={selectedClass}
                onChange={setSelectedClass}
                placeholder="Chọn lớp học"
                style={{ width: "100%" }}
                size="large"
                dropdownStyle={{ borderRadius: "12px" }}
              >
                {classes.map((cls) => (
                  <Option key={cls.id} value={cls.id}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#667eea",
                        }}
                      />
                      {cls.name}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col lg={6} md={12} sm={24}>
            <div>
              <Text
                strong
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#2c3e50",
                  fontSize: "14px",
                }}
              >
                <FaCalendarAlt style={{ marginRight: 6, color: "#667eea" }} />
                Ngày điểm danh:
              </Text>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                format="DD/MM/YYYY"
                style={{ width: "100%" }}
                size="large"
              />
            </div>
          </Col>
          <Col lg={12} md={24} sm={24}>
            <div>
              <Text
                strong
                style={{
                  display: "block",
                  marginBottom: 8,
                  color: "#2c3e50",
                  fontSize: "14px",
                }}
              >
                <FaUsers style={{ marginRight: 6, color: "#667eea" }} />
                Điểm danh nhanh:
              </Text>
              <Button.Group size="large">
                <Button
                  icon={<FaCheck />}
                  onClick={() => handleQuickMarkAll("present")}
                  style={{
                    color: "#52c41a",
                    borderColor: "#52c41a",
                    fontWeight: 500,
                    borderRadius: "8px 0 0 8px",
                  }}
                >
                  Tất cả có mặt
                </Button>
                <Button
                  icon={<FaTimes />}
                  onClick={() => handleQuickMarkAll("absent")}
                  style={{
                    color: "#ff4d4f",
                    borderColor: "#ff4d4f",
                    fontWeight: 500,
                    borderRadius: "0",
                  }}
                >
                  Tất cả vắng
                </Button>
                <Button
                  icon={<FaChartLine />}
                  onClick={fetchClassStats}
                  disabled={!selectedClass}
                  style={{
                    borderRadius: "0 8px 8px 0",
                    fontWeight: 500,
                  }}
                >
                  Thống kê
                </Button>
              </Button.Group>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics Section */}
      {selectedClass && (
        <Card
          style={{
            marginBottom: 24,
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <Title
            level={4}
            style={{
              marginBottom: 20,
              color: "#2c3e50",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                padding: "8px",
                borderRadius: "8px",
                color: "white",
              }}
            >
              <FaChartLine />
            </div>
            Thống kê điểm danh ngày {selectedDate.format("DD/MM/YYYY")}
          </Title>
          <Row gutter={[16, 16]}>
            <Col lg={4} md={8} sm={12} xs={24}>
              <Card
                style={{
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #f0f9fe 0%, #e6f7ff 100%)",
                }}
              >
                <Statistic
                  title="Tổng số học sinh"
                  value={attendanceData.length}
                  prefix={
                    <div
                      style={{
                        background: "linear-gradient(135deg, #1890ff, #40a9ff)",
                        padding: "8px",
                        borderRadius: "50%",
                        color: "white",
                        display: "inline-block",
                        marginRight: "8px",
                      }}
                    >
                      <FaUsers />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col lg={4} md={8} sm={12} xs={24}>
              <Card
                style={{
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #f6ffed 0%, #f0f9fe 100%)",
                }}
              >
                <Statistic
                  title="Có mặt"
                  value={stats.present}
                  valueStyle={{ color: "#52c41a" }}
                  prefix={
                    <div
                      style={{
                        background: "linear-gradient(135deg, #52c41a, #73d13d)",
                        padding: "8px",
                        borderRadius: "50%",
                        color: "white",
                        display: "inline-block",
                        marginRight: "8px",
                      }}
                    >
                      <FaCheck />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col lg={4} md={8} sm={12} xs={24}>
              <Card
                style={{
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #fff2f0 0%, #ffebee 100%)",
                }}
              >
                <Statistic
                  title="Vắng mặt"
                  value={stats.absent}
                  valueStyle={{ color: "#ff4d4f" }}
                  prefix={
                    <div
                      style={{
                        background: "linear-gradient(135deg, #ff4d4f, #ff7875)",
                        padding: "8px",
                        borderRadius: "50%",
                        color: "white",
                        display: "inline-block",
                        marginRight: "8px",
                      }}
                    >
                      <FaTimes />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col lg={4} md={8} sm={12} xs={24}>
              <Card
                style={{
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #fff7e6 0%, #fef9e7 100%)",
                }}
              >
                <Statistic
                  title="Đi muộn"
                  value={stats.late}
                  valueStyle={{ color: "#faad14" }}
                  prefix={
                    <div
                      style={{
                        background: "linear-gradient(135deg, #faad14, #ffc53d)",
                        padding: "8px",
                        borderRadius: "50%",
                        color: "white",
                        display: "inline-block",
                        marginRight: "8px",
                      }}
                    >
                      <FaClock />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col lg={4} md={8} sm={12} xs={24}>
              <Card
                style={{
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #e6f7ff 0%, #e1f5fe 100%)",
                }}
              >
                <Statistic
                  title="Vắng có phép"
                  value={stats.excused}
                  valueStyle={{ color: "#1890ff" }}
                  prefix={
                    <div
                      style={{
                        background: "linear-gradient(135deg, #1890ff, #40a9ff)",
                        padding: "8px",
                        borderRadius: "50%",
                        color: "white",
                        display: "inline-block",
                        marginRight: "8px",
                      }}
                    >
                      <FaUserCheck />
                    </div>
                  }
                />
              </Card>
            </Col>
            <Col lg={4} md={8} sm={12} xs={24}>
              <Button
                type="primary"
                size="large"
                loading={loading}
                onClick={handleBulkAttendance}
                disabled={
                  !selectedClass || stats.unmarked === attendanceData.length
                }
                style={{
                  width: "100%",
                  height: "80px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #52c41a, #73d13d)",
                  fontSize: "16px",
                  fontWeight: 600,
                  boxShadow: "0 4px 15px rgba(82, 196, 26, 0.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
                icon={<FaSave style={{ fontSize: "20px" }} />}
              >
                Lưu tất cả
                <Text
                  style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px" }}
                >
                  ({attendanceData.length - stats.unmarked} đã chọn)
                </Text>
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Attendance Table */}
      <Card
        style={{
          borderRadius: "16px",
          border: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <Title
          level={4}
          style={{
            marginBottom: 20,
            color: "#2c3e50",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              padding: "8px",
              borderRadius: "8px",
              color: "white",
            }}
          >
            <FaClipboardList />
          </div>
          Danh sách điểm danh
        </Title>
        <Table
          columns={columns}
          dataSource={attendanceData}
          rowKey="id"
          loading={loading}
          style={{
            borderRadius: "12px",
            overflow: "hidden",
          }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} học sinh`,
            style: { marginTop: 16 },
          }}
          scroll={{ x: 1000 }}
          rowClassName={(record, index) =>
            index % 2 === 0 ? "table-row-even" : "table-row-odd"
          }
        />
      </Card>

      {/* Stats Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FaChartLine style={{ color: "#667eea" }} />
            Thống kê điểm danh tháng {selectedDate.format("MM/YYYY")}
          </div>
        }
        open={statsVisible}
        onCancel={() => setStatsVisible(false)}
        footer={null}
        width={900}
        style={{ borderRadius: "16px" }}
        bodyStyle={{ padding: "24px" }}
      >
        {classStats && (
          <div>
            <Row gutter={[16, 16]}>
              {classStats.map((dayStat) => (
                <Col span={24} key={dayStat.date}>
                  <Card
                    size="small"
                    style={{
                      borderRadius: "12px",
                      border: "1px solid #f0f0f0",
                      background:
                        "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
                    }}
                    bodyStyle={{ padding: "16px" }}
                  >
                    <Row gutter={16} align="middle">
                      <Col span={4}>
                        <Text
                          strong
                          style={{ fontSize: "16px", color: "#2c3e50" }}
                        >
                          {dayjs(dayStat.date).format("DD/MM/YYYY")}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {dayjs(dayStat.date).format("dddd")}
                        </Text>
                      </Col>
                      <Col span={3}>
                        <Tag
                          color="#52c41a"
                          style={{
                            borderRadius: "12px",
                            padding: "4px 12px",
                            border: "none",
                          }}
                        >
                          <FaCheck style={{ marginRight: 4 }} />
                          Có mặt: {dayStat.present}
                        </Tag>
                      </Col>
                      <Col span={3}>
                        <Tag
                          color="#ff4d4f"
                          style={{
                            borderRadius: "12px",
                            padding: "4px 12px",
                            border: "none",
                          }}
                        >
                          <FaTimes style={{ marginRight: 4 }} />
                          Vắng: {dayStat.absent}
                        </Tag>
                      </Col>
                      <Col span={3}>
                        <Tag
                          color="#faad14"
                          style={{
                            borderRadius: "12px",
                            padding: "4px 12px",
                            border: "none",
                          }}
                        >
                          <FaClock style={{ marginRight: 4 }} />
                          Muộn: {dayStat.late}
                        </Tag>
                      </Col>
                      <Col span={4}>
                        <Tag
                          color="#1890ff"
                          style={{
                            borderRadius: "12px",
                            padding: "4px 12px",
                            border: "none",
                          }}
                        >
                          <FaUserCheck style={{ marginRight: 4 }} />
                          Có phép: {dayStat.excused}
                        </Tag>
                      </Col>
                      <Col span={4}>
                        <div
                          style={{
                            textAlign: "center",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            background:
                              "linear-gradient(135deg, #667eea, #764ba2)",
                            color: "white",
                          }}
                        >
                          <Text
                            strong
                            style={{ color: "white", fontSize: "16px" }}
                          >
                            {(
                              ((dayStat.present + dayStat.late) /
                                dayStat.total) *
                              100
                            ).toFixed(1)}
                            %
                          </Text>
                          <br />
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.8)",
                              fontSize: "12px",
                            }}
                          >
                            Tỷ lệ
                          </Text>
                        </div>
                      </Col>
                      <Col span={3}>
                        <Text type="secondary">
                          Tổng: {dayStat.total} học sinh
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .table-row-even {
          background-color: #fafafa;
        }
        .table-row-odd {
          background-color: #ffffff;
        }
        .table-row-even:hover,
        .table-row-odd:hover {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );
}
