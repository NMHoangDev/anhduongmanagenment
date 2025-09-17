import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Avatar,
  Tag,
  Statistic,
  Progress,
  Tabs,
  Switch,
  List,
  Tooltip,
  Rate,
} from "antd";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaUserGraduate,
  FaBell,
  FaEnvelope,
  FaCalendarAlt,
  FaChartLine,
  FaExclamationTriangle,
  FaTasks,
  FaComments,
  FaStar,
  FaAward,
  FaUserCheck,
  FaTrash,
  FaPlus,
  FaPaperPlane,
  FaEye,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Mock data - replace with real API calls
const mockClasses = [
  {
    id: "1A",
    name: "Lớp 1A",
    grade: "Lớp 1",
    totalStudents: 30,
    presentToday: 28,
    averageGrade: 8.5,
    students: [
      {
        id: "HS01",
        name: "Nguyễn Văn An",
        avatar: null,
        attendance: 95,
        grade: 8.5,
        behavior: "good",
        phone: "0123456789",
        parentPhone: "0987654321",
      },
      {
        id: "HS02",
        name: "Trần Thị Bích",
        avatar: null,
        attendance: 92,
        grade: 9.0,
        behavior: "excellent",
        phone: "0123456788",
        parentPhone: "0987654322",
      },
      {
        id: "HS03",
        name: "Lê Minh Tuấn",
        avatar: null,
        attendance: 88,
        grade: 7.5,
        behavior: "average",
        phone: "0123456787",
        parentPhone: "0987654323",
      },
    ],
    announcements: [
      {
        id: 1,
        title: "Thông báo nghỉ học",
        content: "Lớp nghỉ học vào thứ 6 tuần này",
        date: "2025-09-14",
        type: "important",
        read: 25,
      },
    ],
    schedule: [
      { day: "Thứ 2", periods: ["Toán", "Văn", "Anh", "Thể dục"] },
      { day: "Thứ 3", periods: ["Văn", "Toán", "Khoa học", "Âm nhạc"] },
    ],
  },
  {
    id: "2A",
    name: "Lớp 2A",
    grade: "Lớp 2",
    totalStudents: 32,
    presentToday: 30,
    averageGrade: 8.2,
    students: [
      {
        id: "HS04",
        name: "Phạm Thị Hoa",
        avatar: null,
        attendance: 97,
        grade: 8.8,
        behavior: "excellent",
        phone: "0123456786",
        parentPhone: "0987654324",
      },
    ],
    announcements: [],
    schedule: [],
  },
];

export default function ClassManagement() {
  const [classes] = useState(mockClasses);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [messageModal, setMessageModal] = useState(false);
  // const [studentModal, setStudentModal] = useState(false);
  const [announcementModal, setAnnouncementModal] = useState(false);
  const [reminderModal, setReminderModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [form] = Form.useForm();
  const { currentUser } = useAuth();

  // Evaluations state (demo). Each evaluation: { id, studentId, teacher, date, rating, comment }
  const [evaluations, setEvaluations] = useState([]);
  const [evalModal, setEvalModal] = useState(false);
  const [selectedEvalStudent, setSelectedEvalStudent] = useState(null);
  const [evalForm] = Form.useForm();
  const [editingEvalId, setEditingEvalId] = useState(null);
  // Badges (award) state
  const [classBadges, setClassBadges] = useState([]);
  const [studentBadges, setStudentBadges] = useState([]);
  const [badgeModal, setBadgeModal] = useState(false);
  const [selectedBadgeStudent, setSelectedBadgeStudent] = useState(null);
  const [badgeForm] = Form.useForm();

  const currentClass = classes.find((cls) => cls.id === selectedClassId);

  const getBehaviorColor = (behavior) => {
    switch (behavior) {
      case "excellent":
        return "#52c41a";
      case "good":
        return "#1890ff";
      case "average":
        return "#faad14";
      case "poor":
        return "#ff4d4f";
      default:
        return "#d9d9d9";
    }
  };

  const getBehaviorText = (behavior) => {
    switch (behavior) {
      case "excellent":
        return "Xuất sắc";
      case "good":
        return "Tốt";
      case "average":
        return "Trung bình";
      case "poor":
        return "Kém";
      default:
        return "Chưa đánh giá";
    }
  };

  const studentColumns = [
    {
      title: "STT",
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
          <Avatar
            size={40}
            src={record.avatar}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {text?.charAt(0) || "?"}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: "15px", color: "#2c3e50" }}>
              {text}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.id}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Điểm TB",
      dataIndex: "grade",
      key: "grade",
      align: "center",
      render: (grade) => (
        <Tag
          color={grade >= 8 ? "green" : grade >= 6.5 ? "blue" : "red"}
          style={{ borderRadius: "12px", fontWeight: "bold" }}
        >
          {grade}
        </Tag>
      ),
    },
    {
      title: "Tỷ lệ tham gia",
      dataIndex: "attendance",
      key: "attendance",
      align: "center",
      render: (attendance) => (
        <div style={{ width: 80 }}>
          <Progress
            percent={attendance}
            size="small"
            strokeColor={
              attendance >= 90
                ? "#52c41a"
                : attendance >= 80
                ? "#faad14"
                : "#ff4d4f"
            }
          />
          <Text style={{ fontSize: "12px", color: "#666" }}>{attendance}%</Text>
        </div>
      ),
    },
    {
      title: "Hạnh kiểm",
      dataIndex: "behavior",
      key: "behavior",
      align: "center",
      render: (behavior) => (
        <Tag
          color={getBehaviorColor(behavior)}
          style={{ borderRadius: "12px", fontWeight: "500" }}
        >
          {getBehaviorText(behavior)}
        </Tag>
      ),
    },
    {
      title: "Huy hiệu",
      dataIndex: "id",
      key: "badges",
      align: "center",
      width: 120,
      render: (studentId) => {
        const cnt = studentBadges.filter(
          (b) => b.studentId === studentId
        ).length;
        return <Tag color={cnt > 0 ? "gold" : "default"}>{cnt} huy hiệu</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              type="primary"
              icon={<FaEye />}
              style={{ borderRadius: "6px" }}
              onClick={() => showStudentDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Nhắn tin">
            <Button
              size="small"
              icon={<FaEnvelope />}
              style={{ borderRadius: "6px" }}
              onClick={() => sendMessageToStudent(record)}
            />
          </Tooltip>
          <Tooltip title="Trao huy hiệu">
            <Button
              size="small"
              icon={<FaAward />}
              style={{ borderRadius: "6px" }}
              onClick={() => openBadgeModal(record)}
            />
          </Tooltip>
          <Tooltip title="Đánh giá">
            <Button
              size="small"
              icon={<FaStar />}
              style={{ borderRadius: "6px" }}
              onClick={() => openEvalModal(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const showStudentDetail = (student) => {
    Modal.info({
      title: (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            size={40}
            src={student.avatar}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
            }}
          >
            {student.name?.charAt(0)}
          </Avatar>
          <div>
            <Text strong>{student.name}</Text>
            <br />
            <Text type="secondary">{student.id}</Text>
          </div>
        </div>
      ),
      content: (
        <div style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: "8px" }}>
                <Statistic
                  title="Điểm trung bình"
                  value={student.grade}
                  suffix="/10"
                  valueStyle={{
                    color:
                      student.grade >= 8
                        ? "#52c41a"
                        : student.grade >= 6.5
                        ? "#1890ff"
                        : "#ff4d4f",
                  }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: "8px" }}>
                <Statistic
                  title="Tỷ lệ tham gia"
                  value={student.attendance}
                  suffix="%"
                  valueStyle={{
                    color: student.attendance >= 90 ? "#52c41a" : "#faad14",
                  }}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Text strong>Hạnh kiểm: </Text>
              <Tag
                color={getBehaviorColor(student.behavior)}
                style={{ borderRadius: "12px" }}
              >
                {getBehaviorText(student.behavior)}
              </Tag>
            </Col>
            <Col span={12}>
              <Text strong>SĐT học sinh: </Text>
              <Text code>{student.phone}</Text>
            </Col>
            <Col span={12}>
              <Text strong>SĐT phụ huynh: </Text>
              <Text code>{student.parentPhone}</Text>
            </Col>
          </Row>
        </div>
      ),
      width: 600,
    });
  };

  const sendMessageToStudent = (student) => {
    setSelectedStudents([student]);
    setMessageModal(true);
  };

  const handleSendMessage = async (values) => {
    try {
      // API call to send message
      message.success(
        `Đã gửi tin nhắn đến ${selectedStudents.length} học sinh`
      );
      setMessageModal(false);
      form.resetFields();
      setSelectedStudents([]);
    } catch (error) {
      message.error("Lỗi khi gửi tin nhắn");
    }
  };

  const handleSendAnnouncement = async (values) => {
    try {
      // API call to send announcement
      message.success("Đã gửi thông báo thành công");
      setAnnouncementModal(false);
      form.resetFields();
    } catch (error) {
      message.error("Lỗi khi gửi thông báo");
    }
  };

  // Evaluations handlers
  useEffect(() => {
    // demo evals
    setEvaluations([
      {
        id: "ev1",
        studentId: "HS01",
        teacher: "Cô Trần Mai",
        date: "2025-09-10",
        rating: 4,
        comment: "Em có tiến bộ tốt, tiếp tục phát huy.",
      },
      {
        id: "ev2",
        studentId: "HS02",
        teacher: "Thầy Phạm Hùng",
        date: "2025-08-20",
        rating: 3,
        comment: "Cần tham gia tích cực hơn trong giờ học.",
      },
    ]);
    // demo badges available for this class
    setClassBadges([
      { id: "b1", name: "Chăm học", description: "Hoàn thành 10 bài tập" },
      {
        id: "b2",
        name: "Ngôi sao tuần",
        description: "Học sinh xuất sắc của tuần",
      },
      {
        id: "b3",
        name: "Giúp bạn",
        description: "Hỗ trợ bạn bè trong học tập",
      },
    ]);
  }, []);

  const openEvalModal = (student) => {
    setSelectedEvalStudent(student);
    setEditingEvalId(null);
    evalForm.resetFields();
    setEvalModal(true);
  };

  const openBadgeModal = (student) => {
    setSelectedBadgeStudent(student);
    badgeForm.resetFields();
    setBadgeModal(true);
  };

  const handleAwardBadge = async () => {
    try {
      const values = await badgeForm.validateFields();
      if (!selectedBadgeStudent) return message.error("Chưa chọn học sinh");
      const badgeMeta = classBadges.find((b) => b.id === values.badgeId);
      const newBadge = {
        id: `${selectedBadgeStudent.id}_${values.badgeId}_${Date.now()}`,
        studentId: selectedBadgeStudent.id,
        badgeId: values.badgeId,
        badgeName: badgeMeta?.name || "Huy hiệu",
        teacher: currentUser?.name || currentUser?.email || "Giáo viên",
        comment: values.comment || "",
        date: dayjs().format("YYYY-MM-DD"),
      };
      setStudentBadges((prev) => [newBadge, ...prev]);
      setBadgeModal(false);
      message.success("Đã trao huy hiệu");
    } catch (err) {
      // validation failed
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      const values = await evalForm.validateFields();
      if (!selectedEvalStudent) return message.error("Chưa chọn học sinh");
      const newEval = {
        id: editingEvalId || `${Date.now()}`,
        studentId: selectedEvalStudent.id,
        teacher: currentUser?.name || currentUser?.email || "Giáo viên",
        date: dayjs().format("YYYY-MM-DD"),
        rating: values.rating,
        comment: values.comment,
      };
      setEvaluations((prev) => [
        newEval,
        ...prev.filter((e) => e.id !== newEval.id),
      ]);
      setEvalModal(false);
      evalForm.resetFields();
      message.success("Lưu đánh giá thành công");
    } catch (err) {
      // validation
    }
  };

  const handleDeleteEvaluation = (id) => {
    Modal.confirm({
      title: "Xác nhận xóa đánh giá",
      content: "Bạn có chắc muốn xóa đánh giá này?",
      okText: "Xóa",
      okType: "danger",
      onOk: () => {
        setEvaluations((prev) => prev.filter((e) => e.id !== id));
        message.success("Đã xóa đánh giá");
      },
    });
  };

  const getAvgRatingForStudent = (studentId) => {
    const items = evaluations.filter((e) => e.studentId === studentId);
    if (items.length === 0) return null;
    const avg = items.reduce((s, r) => s + r.rating, 0) / items.length;
    return Math.round(avg * 10) / 10;
  };

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
                <FaChalkboardTeacher style={{ fontSize: "24px" }} />
              </div>
              Quản lý lớp học
            </Title>
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "16px",
                marginTop: 8,
              }}
            >
              Quản lý thông tin lớp học, học sinh và hoạt động giảng dạy
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
                style={{ marginRight: 12, color: "#ffffff", fontSize: "14px" }}
              >
                Chọn lớp:
              </Text>
              <Select
                value={selectedClassId}
                onChange={setSelectedClassId}
                style={{ width: 160 }}
                size="large"
                dropdownStyle={{ borderRadius: "12px" }}
              >
                {classes.map((cls) => (
                  <Option key={cls.id} value={cls.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
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
        </Row>
      </Card>

      {/* Class Overview Stats */}
      {currentClass && (
        <Card
          style={{
            marginBottom: 24,
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <Row gutter={[16, 16]}>
            <Col xl={6} lg={12} md={12} sm={12} xs={24}>
              <Card
                style={{
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #f0f9fe 0%, #e6f7ff 100%)",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                bodyStyle={{ padding: "16px" }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        background: "linear-gradient(135deg, #1890ff, #40a9ff)",
                        padding: "8px",
                        borderRadius: "50%",
                        color: "white",
                        marginRight: "8px",
                      }}
                    >
                      <FaUsers />
                    </div>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        fontWeight: 500,
                      }}
                    >
                      Tổng số học sinh
                    </Text>
                  </div>
                  <Text
                    style={{
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: "#1890ff",
                      lineHeight: 1,
                    }}
                  >
                    {currentClass.totalStudents}
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xl={6} lg={12} md={12} sm={12} xs={24}>
              <Card
                style={{
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #f6ffed 0%, #f0f9fe 100%)",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                bodyStyle={{ padding: "16px" }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        background: "linear-gradient(135deg, #52c41a, #73d13d)",
                        padding: "8px",
                        borderRadius: "50%",
                        color: "white",
                        marginRight: "8px",
                      }}
                    >
                      <FaUserCheck />
                    </div>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        fontWeight: 500,
                      }}
                    >
                      Có mặt hôm nay
                    </Text>
                  </div>
                  <Text
                    style={{
                      fontSize: "32px",
                      fontWeight: "bold",
                      color: "#52c41a",
                      lineHeight: 1,
                    }}
                  >
                    {currentClass.presentToday}
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xl={6} lg={12} md={12} sm={12} xs={24}>
              <Card
                style={{
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #fff7e6 0%, #fef9e7 100%)",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                bodyStyle={{ padding: "16px" }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        background: "linear-gradient(135deg, #fa8c16, #ffa940)",
                        padding: "8px",
                        borderRadius: "50%",
                        color: "white",
                        marginRight: "8px",
                      }}
                    >
                      <FaStar />
                    </div>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        fontWeight: 500,
                      }}
                    >
                      Điểm TB lớp
                    </Text>
                  </div>
                  <div>
                    <Text
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#fa8c16",
                        lineHeight: 1,
                      }}
                    >
                      {currentClass.averageGrade}
                    </Text>
                    <Text
                      style={{
                        fontSize: "16px",
                        color: "#999",
                        marginLeft: "2px",
                      }}
                    >
                      /10
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xl={6} lg={12} md={12} sm={12} xs={24}>
              <Card
                style={{
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                bodyStyle={{ padding: "16px" }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        background: "linear-gradient(135deg, #722ed1, #9254de)",
                        padding: "8px",
                        borderRadius: "50%",
                        color: "white",
                        marginRight: "8px",
                      }}
                    >
                      <FaChartLine />
                    </div>
                    <Text
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Tỷ lệ tham gia
                    </Text>
                  </div>
                  <div>
                    <Text
                      style={{
                        fontSize: "32px",
                        fontWeight: "bold",
                        color: "#722ed1",
                        lineHeight: 1,
                      }}
                    >
                      {(
                        (currentClass.presentToday /
                          currentClass.totalStudents) *
                        100
                      ).toFixed(1)}
                    </Text>
                    <Text
                      style={{
                        fontSize: "16px",
                        color: "#999",
                        marginLeft: "2px",
                      }}
                    >
                      %
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Card
        style={{
          borderRadius: "16px",
          border: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ marginBottom: 24 }}
        >
          <TabPane
            tab={
              <span>
                <FaChartLine style={{ marginRight: 8 }} />
                Tổng quan
              </span>
            }
            key="overview"
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ marginBottom: 24 }}>
                  <Title
                    level={4}
                    style={{ marginBottom: 16, color: "#2c3e50" }}
                  >
                    <FaTasks style={{ marginRight: 8, color: "#667eea" }} />
                    Thao tác nhanh
                  </Title>
                  <Row gutter={[16, 16]}>
                    <Col lg={6} md={12} sm={24}>
                      <Button
                        type="primary"
                        size="large"
                        block
                        icon={<FaBell />}
                        onClick={() => setAnnouncementModal(true)}
                        style={{
                          height: "60px",
                          borderRadius: "12px",
                          background:
                            "linear-gradient(135deg, #1890ff, #40a9ff)",
                          border: "none",
                          fontSize: "16px",
                          fontWeight: 600,
                          boxShadow: "0 4px 15px rgba(24, 144, 255, 0.3)",
                        }}
                      >
                        Gửi thông báo
                      </Button>
                    </Col>
                    <Col lg={6} md={12} sm={24}>
                      <Button
                        size="large"
                        block
                        icon={<FaEnvelope />}
                        onClick={() => setMessageModal(true)}
                        style={{
                          height: "60px",
                          borderRadius: "12px",
                          fontSize: "16px",
                          fontWeight: 600,
                          borderColor: "#52c41a",
                          color: "#52c41a",
                        }}
                      >
                        Nhắn tin học sinh
                      </Button>
                    </Col>
                    <Col lg={6} md={12} sm={24}>
                      <Button
                        size="large"
                        block
                        icon={<FaExclamationTriangle />}
                        onClick={() => setReminderModal(true)}
                        style={{
                          height: "60px",
                          borderRadius: "12px",
                          fontSize: "16px",
                          fontWeight: 600,
                          borderColor: "#faad14",
                          color: "#faad14",
                        }}
                      >
                        Gửi nhắc nhở
                      </Button>
                    </Col>
                    <Col lg={6} md={12} sm={24}>
                      <Button
                        size="large"
                        block
                        icon={<FaAward />}
                        style={{
                          height: "60px",
                          borderRadius: "12px",
                          fontSize: "16px",
                          fontWeight: 600,
                          borderColor: "#722ed1",
                          color: "#722ed1",
                        }}
                      >
                        Khen thưởng
                      </Button>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>

            {/* Recent Announcements */}
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={4} style={{ marginBottom: 16, color: "#2c3e50" }}>
                  <FaBell style={{ marginRight: 8, color: "#667eea" }} />
                  Thông báo gần đây
                </Title>
                <List
                  dataSource={currentClass?.announcements || []}
                  locale={{ emptyText: "Chưa có thông báo nào" }}
                  renderItem={(item) => (
                    <List.Item
                      style={{
                        background: "#fafafa",
                        borderRadius: "12px",
                        marginBottom: "12px",
                        padding: "16px",
                        border: "1px solid #f0f0f0",
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background:
                                item.type === "important"
                                  ? "linear-gradient(135deg, #ff4d4f, #ff7875)"
                                  : "linear-gradient(135deg, #1890ff, #40a9ff)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                            }}
                          >
                            <FaBell />
                          </div>
                        }
                        title={
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <Text strong style={{ fontSize: "16px" }}>
                              {item.title}
                            </Text>
                            {item.type === "important" && (
                              <Tag color="red" style={{ borderRadius: "12px" }}>
                                Quan trọng
                              </Tag>
                            )}
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {dayjs(item.date).format("DD/MM/YYYY")}
                            </Text>
                          </div>
                        }
                        description={
                          <div>
                            <Text>{item.content}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              <FaEye style={{ marginRight: 4 }} />
                              Đã xem: {item.read}/{currentClass.totalStudents}{" "}
                              học sinh
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Col>
            </Row>
          </TabPane>

          <TabPane
            tab={
              <span>
                <FaUserGraduate style={{ marginRight: 8 }} />
                Danh sách học sinh
              </span>
            }
            key="students"
          >
            <div style={{ marginBottom: 16 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={4} style={{ margin: 0, color: "#2c3e50" }}>
                    Danh sách học sinh lớp {currentClass?.name}
                  </Title>
                </Col>
                <Col>
                  <Button.Group>
                    <Button
                      icon={<FaEnvelope />}
                      onClick={() => {
                        if (currentClass?.students) {
                          setSelectedStudents(currentClass.students);
                          setMessageModal(true);
                        }
                      }}
                    >
                      Nhắn tin tất cả
                    </Button>
                    <Button
                      type="primary"
                      icon={<FaPlus />}
                      style={{
                        background: "linear-gradient(135deg, #52c41a, #73d13d)",
                        border: "none",
                      }}
                    >
                      Thêm học sinh
                    </Button>
                  </Button.Group>
                </Col>
              </Row>
            </div>

            <Table
              columns={studentColumns}
              dataSource={currentClass?.students || []}
              rowKey="id"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} của ${total} học sinh`,
              }}
              rowSelection={{
                type: "checkbox",
                onChange: (selectedRowKeys, selectedRows) => {
                  setSelectedStudents(selectedRows);
                },
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FaComments style={{ marginRight: 8 }} />
                Đánh giá học sinh
              </span>
            }
            key="evaluations"
          >
            <Title level={4} style={{ marginBottom: 16, color: "#2c3e50" }}>
              Đánh giá học sinh lớp {currentClass?.name}
            </Title>

            <List
              dataSource={currentClass?.students || []}
              renderItem={(student) => (
                <List.Item
                  actions={[
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <div style={{ textAlign: "right", marginRight: 12 }}>
                        <Text type="secondary">Điểm TB</Text>
                        <br />
                        <Text strong>{student.grade}</Text>
                      </div>
                      <div style={{ textAlign: "right", marginRight: 12 }}>
                        <Text type="secondary">Hạnh kiểm</Text>
                        <br />
                        <Tag color={getBehaviorColor(student.behavior)}>
                          {getBehaviorText(student.behavior)}
                        </Tag>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <Text type="secondary">TB đánh giá</Text>
                        <Text strong>
                          {getAvgRatingForStudent(student.id) ?? "-"}
                        </Text>
                      </div>
                      <Button
                        onClick={() => openEvalModal(student)}
                        icon={<FaStar />}
                      >
                        Đánh giá
                      </Button>
                      <Button
                        danger
                        icon={<FaTrash />}
                        onClick={() => handleDeleteEvaluation(student.id)}
                      >
                        Xóa đánh giá
                      </Button>
                    </div>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar src={student.avatar}>{student.name?.[0]}</Avatar>
                    }
                    title={<Text strong>{student.name}</Text>}
                    description={
                      <div>
                        <Text type="secondary">Mã: {student.id}</Text>
                        <br />
                        <Text type="secondary">
                          Số đánh giá:{" "}
                          {
                            evaluations.filter(
                              (e) => e.studentId === student.id
                            ).length
                          }
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <FaCalendarAlt style={{ marginRight: 8 }} />
                Thời khóa biểu
              </span>
            }
            key="schedule"
          >
            <Title level={4} style={{ marginBottom: 20, color: "#2c3e50" }}>
              Thời khóa biểu lớp {currentClass?.name}
            </Title>

            <Row gutter={[16, 16]}>
              {currentClass?.schedule?.map((day, index) => (
                <Col lg={12} md={24} sm={24} key={index}>
                  <Card
                    title={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <FaCalendarAlt style={{ color: "#667eea" }} />
                        {day.day}
                      </div>
                    }
                    style={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                    headStyle={{
                      background:
                        "linear-gradient(135deg, #f0f9fe 0%, #e6f7ff 100%)",
                      borderRadius: "12px 12px 0 0",
                    }}
                  >
                    <List
                      dataSource={day.periods}
                      renderItem={(period, periodIndex) => (
                        <List.Item style={{ padding: "8px 0" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              width: "100%",
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, #667eea, #764ba2)",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                fontWeight: "bold",
                              }}
                            >
                              {periodIndex + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Text
                                strong
                                style={{ fontSize: "15px", color: "#2c3e50" }}
                              >
                                {period}
                              </Text>
                              <br />
                              <Text
                                type="secondary"
                                style={{ fontSize: "12px" }}
                              >
                                Tiết {periodIndex + 1}
                              </Text>
                            </div>
                            <Tag
                              color="blue"
                              style={{
                                borderRadius: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {7 + periodIndex}:00 - {8 + periodIndex}:00
                            </Tag>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              )) || (
                <Col span={24}>
                  <Card
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      borderRadius: "12px",
                    }}
                  >
                    <FaCalendarAlt size={48} color="#ccc" />
                    <Title level={4} style={{ marginTop: 16, color: "#999" }}>
                      Chưa có thời khóa biểu
                    </Title>
                    <Button type="primary" style={{ marginTop: 16 }}>
                      Thêm thời khóa biểu
                    </Button>
                  </Card>
                </Col>
              )}
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Message Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FaEnvelope style={{ color: "#667eea" }} />
            Gửi tin nhắn đến học sinh
          </div>
        }
        open={messageModal}
        onCancel={() => {
          setMessageModal(false);
          setSelectedStudents([]);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSendMessage}>
          <Form.Item label="Người nhận" style={{ marginBottom: 16 }}>
            <div
              style={{
                background: "#f5f5f5",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              {selectedStudents.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedStudents.map((student) => (
                    <Tag
                      key={student.id}
                      color="blue"
                      style={{
                        borderRadius: "12px",
                        padding: "4px 12px",
                      }}
                    >
                      {student.name}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Text type="secondary">Chọn học sinh từ danh sách</Text>
              )}
            </div>
          </Form.Item>

          <Form.Item
            name="subject"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Nhập tiêu đề tin nhắn" size="large" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <TextArea
              rows={4}
              placeholder="Nhập nội dung tin nhắn..."
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button
              onClick={() => {
                setMessageModal(false);
                setSelectedStudents([]);
                form.resetFields();
              }}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<FaPaperPlane />}
              style={{
                background: "linear-gradient(135deg, #52c41a, #73d13d)",
                border: "none",
                borderRadius: "8px",
              }}
            >
              Gửi tin nhắn
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Announcement Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FaBell style={{ color: "#667eea" }} />
            Gửi thông báo cho lớp
          </div>
        }
        open={announcementModal}
        onCancel={() => {
          setAnnouncementModal(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSendAnnouncement}>
          <Form.Item
            name="title"
            label="Tiêu đề thông báo"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Nhập tiêu đề thông báo" size="large" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <TextArea
              rows={5}
              placeholder="Nhập nội dung thông báo..."
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item name="important" valuePropName="checked">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Switch />
              <Text>Đánh dấu là thông báo quan trọng</Text>
              <Tooltip title="Thông báo quan trọng sẽ được ưu tiên hiển thị">
                <FaExclamationTriangle style={{ color: "#faad14" }} />
              </Tooltip>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button
              onClick={() => {
                setAnnouncementModal(false);
                form.resetFields();
              }}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<FaPaperPlane />}
              style={{
                background: "linear-gradient(135deg, #1890ff, #40a9ff)",
                border: "none",
                borderRadius: "8px",
              }}
            >
              Gửi thông báo
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reminder Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FaExclamationTriangle style={{ color: "#faad14" }} />
            Gửi nhắc nhở
          </div>
        }
        open={reminderModal}
        onCancel={() => setReminderModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Loại nhắc nhở">
            <Select placeholder="Chọn loại nhắc nhở" size="large">
              <Option value="homework">Bài tập về nhà</Option>
              <Option value="exam">Kiểm tra sắp tới</Option>
              <Option value="attendance">Tỷ lệ tham gia thấp</Option>
              <Option value="behavior">Hạnh kiểm</Option>
              <Option value="other">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Nội dung nhắc nhở">
            <TextArea
              rows={4}
              placeholder="Nhập nội dung nhắc nhở..."
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Button
              onClick={() => setReminderModal(false)}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              icon={<FaPaperPlane />}
              style={{
                background: "linear-gradient(135deg, #faad14, #ffc53d)",
                border: "none",
                borderRadius: "8px",
              }}
            >
              Gửi nhắc nhở
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Evaluation Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FaStar style={{ color: "#fa8c16" }} />
            Đánh giá học sinh
          </div>
        }
        open={evalModal}
        onCancel={() => {
          setEvalModal(false);
          setSelectedEvalStudent(null);
          evalForm.resetFields();
          setEditingEvalId(null);
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong>Học sinh:</Text>
          <div style={{ marginTop: 8 }}>
            {selectedEvalStudent ? (
              <Tag color="blue">{selectedEvalStudent.name}</Tag>
            ) : (
              <Text type="secondary">Chưa chọn học sinh</Text>
            )}
          </div>
        </div>

        <Form form={evalForm} layout="vertical" onFinish={handleSaveEvaluation}>
          <Form.Item
            name="rating"
            label="Đánh giá (sao)"
            rules={[{ required: true, message: "Chọn số sao" }]}
          >
            <Rate />
          </Form.Item>

          <Form.Item
            name="comment"
            label="Nhận xét"
            rules={[{ required: true, message: "Nhập nhận xét" }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <div style={{ textAlign: "right" }}>
            <Button
              onClick={() => {
                setEvalModal(false);
                evalForm.resetFields();
                setSelectedEvalStudent(null);
              }}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button type="primary" onClick={() => evalForm.submit()}>
              Lưu đánh giá
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Badge Award Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FaAward style={{ color: "#faad14" }} /> Trao huy hiệu
          </div>
        }
        open={badgeModal}
        onCancel={() => {
          setBadgeModal(false);
          setSelectedBadgeStudent(null);
          badgeForm.resetFields();
        }}
        footer={null}
        width={560}
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong>Học sinh:</Text>
          <div style={{ marginTop: 8 }}>
            {selectedBadgeStudent ? (
              <Tag color="blue">{selectedBadgeStudent.name}</Tag>
            ) : (
              <Text type="secondary">Chưa chọn học sinh</Text>
            )}
          </div>
        </div>

        <Form form={badgeForm} layout="vertical" onFinish={handleAwardBadge}>
          <Form.Item
            name="badgeId"
            label="Chọn huy hiệu"
            rules={[{ required: true, message: "Chọn huy hiệu để trao" }]}
          >
            <Select placeholder="Chọn huy hiệu">
              {classBadges.map((b) => (
                <Select.Option key={b.id} value={b.id}>
                  {b.name} - {b.description}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="comment" label="Ghi chú (tuỳ chọn)">
            <Input placeholder="Ghi chú khi trao huy hiệu" />
          </Form.Item>

          <div style={{ textAlign: "right" }}>
            <Button
              onClick={() => {
                setBadgeModal(false);
                badgeForm.resetFields();
                setSelectedBadgeStudent(null);
              }}
              style={{ marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button type="primary" onClick={() => badgeForm.submit()}>
              Trao huy hiệu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
