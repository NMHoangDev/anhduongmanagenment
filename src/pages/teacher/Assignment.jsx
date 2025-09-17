import React, { useState } from "react";
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
  DatePicker,
  message,
  Tag,
  Space,
  Tooltip,
  Progress,
  Statistic,
  Tabs,
  Upload,
  Switch,
  List,
  Avatar,
  Divider,
  Popconfirm,
} from "antd";
import {
  FaBookOpen,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaUpload,
  FaClock,
  FaUsers,
  FaClipboardList,
  FaChartLine,
  FaFileAlt,
  FaTasks,
  FaCheck,
  FaExclamationTriangle,
  FaPaperPlane,
  FaCalendarAlt,
  FaStar,
} from "react-icons/fa";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const classes = [
  { id: "1A", name: "Lớp 1A", studentCount: 30 },
  { id: "2A", name: "Lớp 2A", studentCount: 32 },
  { id: "3A", name: "Lớp 3A", studentCount: 28 },
];

const fakeAssignments = [
  {
    id: 1,
    classId: "1A",
    title: "Bài tập Toán tuần 1",
    content: "Làm các bài tập từ 1 đến 10 trong sách giáo khoa",
    subject: "Toán",
    deadline: "2025-09-25",
    createdAt: "2025-09-15",
    status: "active",
    totalStudents: 30,
    submitted: 25,
    graded: 20,
    type: "homework",
    difficulty: "medium",
    attachments: [],
  },
  {
    id: 2,
    classId: "2A",
    title: "Bài kiểm tra Văn giữa kì",
    content: "Kiểm tra 15 phút về bài thơ Quê hương",
    subject: "Văn",
    deadline: "2025-09-26",
    createdAt: "2025-09-14",
    status: "active",
    totalStudents: 32,
    submitted: 30,
    graded: 28,
    type: "test",
    difficulty: "hard",
    attachments: ["test_questions.pdf"],
  },
  {
    id: 3,
    classId: "1A",
    title: "Thực hành Khoa học",
    content: "Quan sát và mô tả các hiện tượng thiên nhiên",
    subject: "Khoa học",
    deadline: "2025-09-20",
    createdAt: "2025-09-10",
    status: "completed",
    totalStudents: 30,
    submitted: 30,
    graded: 30,
    type: "project",
    difficulty: "easy",
    attachments: [],
  },
];

export default function TeacherAssignment() {
  const [selectedClass, setSelectedClass] = useState(classes[0].id);
  const [assignments, setAssignments] = useState(fakeAssignments);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [form] = Form.useForm();

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#1890ff";
      case "completed":
        return "#52c41a";
      case "overdue":
        return "#ff4d4f";
      case "draft":
        return "#faad14";
      default:
        return "#d9d9d9";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Đang diễn ra";
      case "completed":
        return "Đã hoàn thành";
      case "overdue":
        return "Quá hạn";
      case "draft":
        return "Bản nháp";
      default:
        return "Không xác định";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "homework":
        return <FaTasks />;
      case "test":
        return <FaClipboardList />;
      case "project":
        return <FaFileAlt />;
      default:
        return <FaBookOpen />;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case "homework":
        return "Bài tập";
      case "test":
        return "Kiểm tra";
      case "project":
        return "Dự án";
      default:
        return "Khác";
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "#52c41a";
      case "medium":
        return "#faad14";
      case "hard":
        return "#ff4d4f";
      default:
        return "#d9d9d9";
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "Dễ";
      case "medium":
        return "Trung bình";
      case "hard":
        return "Khó";
      default:
        return "Chưa xác định";
    }
  };

  const handleCreateAssignment = async (values) => {
    try {
      const newAssignment = {
        id: assignments.length + 1,
        classId: selectedClass,
        ...values,
        createdAt: dayjs().format("YYYY-MM-DD"),
        status: values.status || "active",
        totalStudents:
          classes.find((c) => c.id === selectedClass)?.studentCount || 0,
        submitted: 0,
        graded: 0,
        attachments: values.attachments || [],
      };

      setAssignments((prev) => [...prev, newAssignment]);
      message.success("Tạo bài tập thành công!");
      setCreateModal(false);
      form.resetFields();
    } catch (error) {
      message.error("Lỗi khi tạo bài tập");
    }
  };

  const handleEditAssignment = async (values) => {
    try {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === selectedAssignment.id ? { ...a, ...values } : a
        )
      );
      message.success("Cập nhật bài tập thành công!");
      setEditModal(false);
      setSelectedAssignment(null);
      form.resetFields();
    } catch (error) {
      message.error("Lỗi khi cập nhật bài tập");
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      message.success("Xóa bài tập thành công!");
    } catch (error) {
      message.error("Lỗi khi xóa bài tập");
    }
  };

  const columns = [
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
      title: "Bài tập",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "8px",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {getTypeIcon(record.type)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text
              strong
              style={{ fontSize: "15px", color: "#2c3e50", display: "block" }}
            >
              {text}
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: "13px", display: "block" }}
            >
              {record.subject} • {getTypeText(record.type)}
            </Text>
            <div
              style={{
                marginTop: 4,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Tag
                color={getStatusColor(record.status)}
                style={{ borderRadius: "12px", fontSize: "11px" }}
              >
                {getStatusText(record.status)}
              </Tag>
              <Tag
                color={getDifficultyColor(record.difficulty)}
                style={{ borderRadius: "12px", fontSize: "11px" }}
              >
                {getDifficultyText(record.difficulty)}
              </Tag>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Lớp",
      dataIndex: "classId",
      key: "classId",
      width: 100,
      render: (classId) => (
        <Tag color="blue" style={{ borderRadius: "12px", fontWeight: "500" }}>
          {classes.find((c) => c.id === classId)?.name}
        </Tag>
      ),
    },
    {
      title: "Tiến độ",
      key: "progress",
      width: 150,
      render: (_, record) => {
        const submissionRate = (record.submitted / record.totalStudents) * 100;
        const gradingRate = (record.graded / record.submitted) * 100;

        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: "12px", color: "#666" }}>
                Nộp bài: {record.submitted}/{record.totalStudents}
              </Text>
              <Progress
                percent={submissionRate}
                size="small"
                strokeColor="#1890ff"
                showInfo={false}
              />
            </div>
            <div>
              <Text style={{ fontSize: "12px", color: "#666" }}>
                Chấm điểm: {record.graded}/{record.submitted}
              </Text>
              <Progress
                percent={record.submitted > 0 ? gradingRate : 0}
                size="small"
                strokeColor="#52c41a"
                showInfo={false}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: "Hạn nộp",
      dataIndex: "deadline",
      key: "deadline",
      width: 120,
      render: (deadline) => {
        const isOverdue = dayjs().isAfter(dayjs(deadline));
        const daysLeft = dayjs(deadline).diff(dayjs(), "day");

        return (
          <div style={{ textAlign: "center" }}>
            <Text
              strong
              style={{
                color: isOverdue
                  ? "#ff4d4f"
                  : daysLeft <= 3
                  ? "#faad14"
                  : "#2c3e50",
                display: "block",
                fontSize: "14px",
              }}
            >
              {dayjs(deadline).format("DD/MM/YYYY")}
            </Text>
            <Text
              style={{
                fontSize: "12px",
                color: isOverdue
                  ? "#ff4d4f"
                  : daysLeft <= 3
                  ? "#faad14"
                  : "#666",
              }}
            >
              {isOverdue
                ? "Đã quá hạn"
                : daysLeft === 0
                ? "Hôm nay"
                : `${daysLeft} ngày nữa`}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              type="primary"
              icon={<FaEye />}
              onClick={() => {
                setSelectedAssignment(record);
                setViewModal(true);
              }}
              style={{ borderRadius: "6px" }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              icon={<FaEdit />}
              onClick={() => {
                setSelectedAssignment(record);
                form.setFieldsValue({
                  ...record,
                  deadline: dayjs(record.deadline),
                });
                setEditModal(true);
              }}
              style={{ borderRadius: "6px" }}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc muốn xóa bài tập này?"
              onConfirm={() => handleDeleteAssignment(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                size="small"
                danger
                icon={<FaTrash />}
                style={{ borderRadius: "6px" }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getFilteredAssignments = () => {
    let filtered = assignments.filter((a) => a.classId === selectedClass);

    switch (activeTab) {
      case "active":
        return filtered.filter((a) => a.status === "active");
      case "completed":
        return filtered.filter((a) => a.status === "completed");
      case "overdue":
        return filtered.filter(
          (a) => dayjs().isAfter(dayjs(a.deadline)) && a.status === "active"
        );
      default:
        return filtered;
    }
  };

  const getClassStats = () => {
    const classAssignments = assignments.filter(
      (a) => a.classId === selectedClass
    );
    return {
      total: classAssignments.length,
      active: classAssignments.filter((a) => a.status === "active").length,
      completed: classAssignments.filter((a) => a.status === "completed")
        .length,
      overdue: classAssignments.filter(
        (a) => dayjs().isAfter(dayjs(a.deadline)) && a.status === "active"
      ).length,
    };
  };

  const stats = getClassStats();

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
                <FaBookOpen style={{ fontSize: "24px" }} />
              </div>
              Ra đề/Bài tập
            </Title>
            <Text
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "16px",
                marginTop: 8,
              }}
            >
              Tạo và quản lý bài tập, kiểm tra cho học sinh
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
                value={selectedClass}
                onChange={setSelectedClass}
                style={{ width: 160 }}
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
                      {cls.name} ({cls.studentCount} HS)
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
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
                background: "linear-gradient(135deg, #f0f9fe 0%, #e6f7ff 100%)",
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
                    <FaTasks />
                  </div>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: 500,
                    }}
                  >
                    Tổng bài tập
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
                  {stats.total}
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
                background: "linear-gradient(135deg, #f6ffed 0%, #f0f9fe 100%)",
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
                    <FaCheck />
                  </div>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: 500,
                    }}
                  >
                    Đã hoàn thành
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
                  {stats.completed}
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
                background: "linear-gradient(135deg, #fff7e6 0%, #fef9e7 100%)",
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
                    <FaClock />
                  </div>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: 500,
                    }}
                  >
                    Đang diễn ra
                  </Text>
                </div>
                <Text
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#fa8c16",
                    lineHeight: 1,
                  }}
                >
                  {stats.active}
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
                background: "linear-gradient(135deg, #fff2f0 0%, #ffebee 100%)",
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
                      background: "linear-gradient(135deg, #ff4d4f, #ff7875)",
                      padding: "8px",
                      borderRadius: "50%",
                      color: "white",
                      marginRight: "8px",
                    }}
                  >
                    <FaExclamationTriangle />
                  </div>
                  <Text
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      fontWeight: 500,
                    }}
                  >
                    Quá hạn
                  </Text>
                </div>
                <Text
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: "#ff4d4f",
                    lineHeight: 1,
                  }}
                >
                  {stats.overdue}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Main Content */}
      <Card
        style={{
          borderRadius: "16px",
          border: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Title
            level={4}
            style={{
              margin: 0,
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
            Danh sách bài tập lớp{" "}
            {classes.find((c) => c.id === selectedClass)?.name}
          </Title>
          <Button
            type="primary"
            size="large"
            icon={<FaPlus />}
            onClick={() => setCreateModal(true)}
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #52c41a, #73d13d)",
              border: "none",
              fontSize: "16px",
              fontWeight: 600,
              height: "48px",
              paddingLeft: "24px",
              paddingRight: "24px",
              boxShadow: "0 4px 15px rgba(82, 196, 26, 0.3)",
            }}
          >
            Tạo bài tập mới
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ marginBottom: 20 }}
        >
          <TabPane tab={`Tất cả (${stats.total})`} key="all" />
          <TabPane tab={`Đang diễn ra (${stats.active})`} key="active" />
          <TabPane tab={`Đã hoàn thành (${stats.completed})`} key="completed" />
          <TabPane tab={`Quá hạn (${stats.overdue})`} key="overdue" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={getFilteredAssignments()}
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
              `${range[0]}-${range[1]} của ${total} bài tập`,
          }}
          locale={{ emptyText: "Chưa có bài tập nào" }}
        />
      </Card>

      {/* Create Assignment Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FaPlus style={{ color: "#667eea" }} />
            Tạo bài tập mới
          </div>
        }
        open={createModal}
        onCancel={() => {
          setCreateModal(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAssignment}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tiêu đề bài tập"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              >
                <Input placeholder="Nhập tiêu đề bài tập" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subject"
                label="Môn học"
                rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
              >
                <Select placeholder="Chọn môn học" size="large">
                  <Option value="Toán">Toán</Option>
                  <Option value="Văn">Văn</Option>
                  <Option value="Khoa học">Khoa học</Option>
                  <Option value="Anh văn">Anh văn</Option>
                  <Option value="Âm nhạc">Âm nhạc</Option>
                  <Option value="Thể dục">Thể dục</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="Loại bài tập"
                rules={[{ required: true, message: "Vui lòng chọn loại" }]}
              >
                <Select placeholder="Chọn loại" size="large">
                  <Option value="homework">Bài tập</Option>
                  <Option value="test">Kiểm tra</Option>
                  <Option value="project">Dự án</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="Độ khó"
                rules={[{ required: true, message: "Vui lòng chọn độ khó" }]}
              >
                <Select placeholder="Chọn độ khó" size="large">
                  <Option value="easy">Dễ</Option>
                  <Option value="medium">Trung bình</Option>
                  <Option value="hard">Khó</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="deadline"
                label="Hạn nộp"
                rules={[{ required: true, message: "Vui lòng chọn hạn nộp" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  size="large"
                  format="DD/MM/YYYY"
                  placeholder="Chọn hạn nộp"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="Nội dung bài tập"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <TextArea
              rows={6}
              placeholder="Nhập nội dung chi tiết bài tập..."
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item name="attachments" label="Tài liệu đính kèm">
            <Upload.Dragger
              multiple
              beforeUpload={() => false}
              style={{ borderRadius: "8px" }}
            >
              <p className="ant-upload-drag-icon">
                <FaUpload style={{ fontSize: 48, color: "#1890ff" }} />
              </p>
              <p className="ant-upload-text">
                Kéo thả file vào đây hoặc click để chọn file
              </p>
              <p className="ant-upload-hint">
                Hỗ trợ các định dạng: PDF, DOC, DOCX, PPT, PPTX, IMG
              </p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setCreateModal(false);
                  form.resetFields();
                }}
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
                Tạo bài tập
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Assignment Modal */}
      <Modal
        title={
          selectedAssignment && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {getTypeIcon(selectedAssignment.type)}
              </div>
              <div>
                <Text strong style={{ fontSize: "16px" }}>
                  {selectedAssignment.title}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {selectedAssignment.subject} •{" "}
                  {getTypeText(selectedAssignment.type)}
                </Text>
              </div>
            </div>
          )
        }
        open={viewModal}
        onCancel={() => {
          setViewModal(false);
          setSelectedAssignment(null);
        }}
        footer={null}
        width={800}
      >
        {selectedAssignment && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Card
                    size="small"
                    style={{ textAlign: "center", borderRadius: "8px" }}
                  >
                    <Statistic
                      title="Đã nộp"
                      value={selectedAssignment.submitted}
                      suffix={`/${selectedAssignment.totalStudents}`}
                      valueStyle={{ color: "#1890ff" }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    size="small"
                    style={{ textAlign: "center", borderRadius: "8px" }}
                  >
                    <Statistic
                      title="Đã chấm"
                      value={selectedAssignment.graded}
                      suffix={`/${selectedAssignment.submitted}`}
                      valueStyle={{ color: "#52c41a" }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card
                    size="small"
                    style={{ textAlign: "center", borderRadius: "8px" }}
                  >
                    <Statistic
                      title="Hạn nộp"
                      value={dayjs(selectedAssignment.deadline).format("DD/MM")}
                      valueStyle={{
                        color: dayjs().isAfter(
                          dayjs(selectedAssignment.deadline)
                        )
                          ? "#ff4d4f"
                          : "#fa8c16",
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Title level={5}>Nội dung bài tập:</Title>
              <div
                style={{
                  background: "#f5f5f5",
                  padding: "16px",
                  borderRadius: "8px",
                  whiteSpace: "pre-wrap",
                }}
              >
                <Text>{selectedAssignment.content}</Text>
              </div>
            </div>

            {selectedAssignment.attachments &&
              selectedAssignment.attachments.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Title level={5}>Tài liệu đính kèm:</Title>
                  <List
                    size="small"
                    dataSource={selectedAssignment.attachments}
                    renderItem={(file) => (
                      <List.Item
                        actions={[
                          <Button
                            size="small"
                            icon={<FaDownload />}
                            type="link"
                          >
                            Tải xuống
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <FaFileAlt
                              style={{ color: "#1890ff", fontSize: "16px" }}
                            />
                          }
                          title={file}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag
                color={getStatusColor(selectedAssignment.status)}
                style={{ borderRadius: "12px" }}
              >
                {getStatusText(selectedAssignment.status)}
              </Tag>
              <Tag
                color={getDifficultyColor(selectedAssignment.difficulty)}
                style={{ borderRadius: "12px" }}
              >
                {getDifficultyText(selectedAssignment.difficulty)}
              </Tag>
              <Tag style={{ borderRadius: "12px" }}>
                Tạo: {dayjs(selectedAssignment.createdAt).format("DD/MM/YYYY")}
              </Tag>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Assignment Modal - Similar to Create Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <FaEdit style={{ color: "#667eea" }} />
            Chỉnh sửa bài tập
          </div>
        }
        open={editModal}
        onCancel={() => {
          setEditModal(false);
          setSelectedAssignment(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleEditAssignment}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tiêu đề bài tập"
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
              >
                <Input placeholder="Nhập tiêu đề bài tập" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subject"
                label="Môn học"
                rules={[{ required: true, message: "Vui lòng chọn môn học" }]}
              >
                <Select placeholder="Chọn môn học" size="large">
                  <Option value="Toán">Toán</Option>
                  <Option value="Văn">Văn</Option>
                  <Option value="Khoa học">Khoa học</Option>
                  <Option value="Anh văn">Anh văn</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="Loại bài tập">
                <Select placeholder="Chọn loại" size="large">
                  <Option value="homework">Bài tập</Option>
                  <Option value="test">Kiểm tra</Option>
                  <Option value="project">Dự án</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="difficulty" label="Độ khó">
                <Select placeholder="Chọn độ khó" size="large">
                  <Option value="easy">Dễ</Option>
                  <Option value="medium">Trung bình</Option>
                  <Option value="hard">Khó</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="deadline"
                label="Hạn nộp"
                rules={[{ required: true, message: "Vui lòng chọn hạn nộp" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  size="large"
                  format="DD/MM/YYYY"
                  placeholder="Chọn hạn nộp"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="Nội dung bài tập"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <TextArea
              rows={6}
              placeholder="Nhập nội dung chi tiết bài tập..."
              style={{ borderRadius: "8px" }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setEditModal(false);
                  setSelectedAssignment(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<FaCheck />}
                style={{
                  background: "linear-gradient(135deg, #1890ff, #40a9ff)",
                  border: "none",
                  borderRadius: "8px",
                }}
              >
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
