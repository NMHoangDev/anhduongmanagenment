import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  List,
  message,
  Modal,
  Progress,
  Radio,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Alert,
  Drawer,
  Divider,
  Spin,
} from "antd";
import {
  FaCheck,
  FaClipboardCheck,
  FaClipboardList,
  FaClock,
  FaEye,
  FaFlag,
  FaGraduationCap,
  FaPlay,
  FaQuestionCircle,
  FaStopwatch,
  FaTrophy,
  FaBars,
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaSchool,
} from "react-icons/fa";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useAuth } from "../../context/AuthContext";
import {
  getExamTestsForStudent,
  getExamTestForSubmission,
  submitExamTest,
  getStudentSubmission,
} from "../../services/studentServices/examSubmissionService";

dayjs.extend(duration);

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function SubmitExamTestPage() {
  const { currentUser } = useAuth();
  const studentId = currentUser?.id;

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  // Modal làm bài
  const [testModal, setTestModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Modal xem kết quả
  const [resultModal, setResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Drawer navigation
  const [navDrawer, setNavDrawer] = useState(false);

  // Timer
  const [timerInterval, setTimerInterval] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const loadTests = useCallback(async () => {
    if (!studentId) {
      message.warning("Không tìm thấy thông tin học sinh");
      return;
    }
    setLoadingTests(true);
    try {
      const list = await getExamTestsForStudent(studentId, {
        onlyPublished: true,
      });
      setTests(list);
      if (list.length === 0) {
        message.info("Chưa có bài kiểm tra nào dành cho bạn");
      }
    } catch (err) {
      console.error("Error loading tests:", err);
      message.error(err.message || "Không thể tải danh sách bài kiểm tra.");
    } finally {
      setLoadingTests(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  // Phân loại bài test
  const testsByStatus = useMemo(() => {
    const now = dayjs();
    const all = tests || [];
    return {
      all,
      available: all.filter((t) => {
        if (t.hasSubmitted) return false;
        if (!t.deadline) return true;
        const deadline = t.deadline?.toDate
          ? t.deadline.toDate()
          : new Date(t.deadline);
        return now.isBefore(dayjs(deadline));
      }),
      submitted: all.filter((t) => t.hasSubmitted),
      expired: all.filter((t) => {
        if (t.hasSubmitted) return false;
        if (!t.deadline) return false;
        const deadline = t.deadline?.toDate
          ? t.deadline.toDate()
          : new Date(t.deadline);
        return now.isAfter(dayjs(deadline));
      }),
    };
  }, [tests]);

  // Thống kê (avgScore hiện không đọc được từ examTests vì tách collection -> để 0)
  const stats = useMemo(() => {
    return {
      total: tests.length,
      available: testsByStatus.available.length,
      submitted: testsByStatus.submitted.length,
      expired: testsByStatus.expired.length,
      avgScore: 0,
    };
  }, [tests, testsByStatus]);

  // Bắt đầu làm bài
  const handleStartTest = async (test) => {
    try {
      setLoading(true);
      const examData = await getExamTestForSubmission(test.id, studentId);

      setSelectedTest(examData);
      setTestAnswers({});
      setCurrentQuestionIndex(0);
      setStartTime(new Date());

      // Thiết lập timer nếu có thời gian giới hạn
      if (examData.durationMinutes) {
        const totalSeconds = examData.durationMinutes * 60;
        setTimeLeft(totalSeconds);

        const interval = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setTimerInterval(null);
              handleAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimerInterval(interval);
      }

      setTestModal(true);
      message.success("Bài kiểm tra đã bắt đầu. Chúc bạn làm bài tốt!");
    } catch (err) {
      console.error("Error starting test:", err);
      message.error(err.message || "Không thể bắt đầu bài kiểm tra.");
    } finally {
      setLoading(false);
    }
  };

  // Tự động nộp bài khi hết giờ
  const handleAutoSubmit = useCallback(async () => {
    if (!selectedTest) return;
    message.warning("Hết thời gian! Bài làm sẽ được nộp tự động.");
    await handleSubmitTest(true);
  }, [selectedTest]);

  // Đáp án cho câu hỏi
  const handleAnswerChange = (questionId, selectedIndexes) => {
    setTestAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, selectedIndexes },
    }));
  };

  // Nộp bài
  const handleSubmitTest = async (isAutoSubmit = false) => {
    if (!selectedTest) return;

    console.log("[SubmitExamTestPage] handleSubmitTest called", {
      isAutoSubmit,
      selectedTestId: selectedTest?.id,
    });

    const submitAction = async () => {
      try {
        setSubmitting(true);
        const answers = Object.values(testAnswers);

        console.log("[SubmitExamTestPage] submitting", {
          examId: selectedTest.id,
          studentId,
          answered: answers.length,
        });

        const result = await submitExamTest(
          selectedTest.id,
          studentId,
          answers,
          startTime
        );

        console.log("[SubmitExamTestPage] submit result", result);

        clearTimer();

        const timeSpent = startTime
          ? Math.round((new Date() - startTime) / 1000 / 60)
          : 0;

        message.success(
          <div>
            <div>Nộp bài thành công!</div>
            <div>
              Điểm: {result.totalScore}/{result.maxScore} ({result.percentage}%)
            </div>
            {timeSpent > 0 && <div>Thời gian làm bài: {timeSpent} phút</div>}
          </div>
        );

        setTestModal(false);
        setSelectedTest(null);
        setTestAnswers({});
        setTimeLeft(0);
        setStartTime(null);

        loadTests();
      } catch (err) {
        console.error("[SubmitExamTestPage] Error submitting test:", err);
        message.error(err.message || "Không thể nộp bài.");
      } finally {
        setSubmitting(false);
      }
    };

    await submitAction(); // luôn chạy thẳng, không mở Modal.confirm
  };

  // Xem kết quả
  const handleViewResult = async (test) => {
    try {
      setLoading(true);
      const result = await getStudentSubmission(test.id, studentId);
      setSelectedResult(result);
      setResultModal(true);
    } catch (err) {
      console.error("Error loading result:", err);
      message.error(err.message || "Không thể tải kết quả.");
    } finally {
      setLoading(false);
    }
  };

  // Đóng modal làm bài
  const handleCloseTestModal = () => {
    Modal.confirm({
      title: "Thoát bài kiểm tra",
      content: (
        <div>
          <p>Bạn có chắc chắn muốn thoát? Tiến trình làm bài sẽ bị mất.</p>
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: "#fff2e8",
              borderRadius: 6,
            }}
          >
            ⚠️ Bài làm chưa được lưu sẽ bị mất hoàn toàn
          </div>
        </div>
      ),
      okText: "Thoát",
      okType: "danger",
      cancelText: "Tiếp tục làm bài",
      onOk: () => {
        clearTimer();
        setTestModal(false);
        setSelectedTest(null);
        setTestAnswers({});
        setTimeLeft(0);
        setStartTime(null);
      },
    });
  };

  const tableColumns = [
    {
      title: "Bài kiểm tra",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div style={{ display: "flex", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: record.hasSubmitted
                ? "linear-gradient(135deg,#52c41a,#389e0d)"
                : "linear-gradient(135deg,#667eea,#764ba2)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            {record.hasSubmitted ? <FaCheckCircle /> : <FaClipboardList />}
          </div>
          <div>
            <Text strong style={{ fontSize: 15, color: "#1f2937" }}>
              {text}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="geekblue" style={{ borderRadius: 12 }}>
                <FaQuestionCircle style={{ marginRight: 4 }} />
                {record.questions?.length || 0} câu hỏi
              </Tag>
              <Tag color="purple" style={{ borderRadius: 12 }}>
                <FaTrophy style={{ marginRight: 4 }} />
                {record.totalPoints || 0} điểm
              </Tag>
              {record.className && (
                <Tag color="cyan" style={{ borderRadius: 12 }}>
                  <FaSchool style={{ marginRight: 4 }} />
                  {record.className}
                </Tag>
              )}
            </div>
            {record.description && (
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginTop: 4 }}
              >
                {record.description.length > 50
                  ? `${record.description.substring(0, 50)}...`
                  : record.description}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Hạn làm bài",
      dataIndex: "deadline",
      key: "deadline",
      align: "center",
      render: (value) => {
        if (!value) return <Text type="secondary">Không giới hạn</Text>;
        const date = value.toDate ? value.toDate() : new Date(value);
        const isOver = dayjs().isAfter(dayjs(date));
        const timeToDeadline = dayjs(date).diff(dayjs(), "hours");
        return (
          <div>
            <Text strong style={{ color: isOver ? "#ff4d4f" : "#2563eb" }}>
              {dayjs(date).format("DD/MM/YYYY HH:mm")}
            </Text>
            <div>
              <Tag
                color={
                  isOver ? "red" : timeToDeadline <= 24 ? "orange" : "blue"
                }
                style={{ borderRadius: 10 }}
              >
                <FaClock style={{ marginRight: 4 }} />
                {isOver
                  ? "Hết hạn"
                  : timeToDeadline <= 24
                  ? "Sắp hết hạn"
                  : "Còn hạn"}
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Thời lượng",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
      align: "center",
      render: (minutes) =>
        minutes ? (
          <Tag color="processing" style={{ borderRadius: 12 }}>
            <FaStopwatch style={{ marginRight: 4 }} />
            {minutes} phút
          </Tag>
        ) : (
          <Tag color="default" style={{ borderRadius: 12 }}>
            Không giới hạn
          </Tag>
        ),
    },
    {
      title: "Trạng thái",
      key: "status",
      align: "center",
      render: (_, record) => {
        if (record.hasSubmitted) {
          return (
            <Tag color="success" style={{ borderRadius: 12 }}>
              <FaCheckCircle style={{ marginRight: 4 }} />
              Đã nộp
            </Tag>
          );
        }
        if (record.deadline) {
          const deadline = record.deadline.toDate
            ? record.deadline.toDate()
            : new Date(record.deadline);
          const isExpired = dayjs().isAfter(dayjs(deadline));
          if (isExpired) {
            return (
              <Tag color="error" style={{ borderRadius: 12 }}>
                <FaTimesCircle style={{ marginRight: 4 }} />
                Hết hạn
              </Tag>
            );
          }
        }
        return (
          <Tag color="processing" style={{ borderRadius: 12 }}>
            <FaPlay style={{ marginRight: 4 }} />
            Có thể làm
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => {
        if (record.hasSubmitted) {
          return (
            <Tooltip title="Xem kết quả chi tiết">
              <Button
                type="primary"
                shape="circle"
                icon={<FaEye />}
                onClick={() => handleViewResult(record)}
                style={{
                  background: "linear-gradient(135deg,#1890ff,#096dd9)",
                  border: "none",
                }}
              />
            </Tooltip>
          );
        }
        const isExpired =
          record.deadline &&
          dayjs().isAfter(dayjs(record.deadline.toDate?.() || record.deadline));
        return (
          <Tooltip title={isExpired ? "Đã hết hạn" : "Bắt đầu làm bài"}>
            <Button
              type="primary"
              shape="circle"
              icon={<FaPlay />}
              disabled={isExpired}
              loading={loading}
              onClick={() => handleStartTest(record)}
              style={{
                background: isExpired
                  ? undefined
                  : "linear-gradient(135deg,#52c41a,#389e0d)",
                border: "none",
              }}
            />
          </Tooltip>
        );
      },
    },
  ];

  // Format thời gian còn lại
  const formatTimeLeft = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Tiến trình làm bài
  const testProgress = useMemo(() => {
    if (!selectedTest) return 0;
    const answered = Object.keys(testAnswers).length;
    const total = selectedTest.questions?.length || 0;
    return total > 0 ? (answered / total) * 100 : 0;
  }, [selectedTest, testAnswers]);

  // Clean up timer khi component unmount
  useEffect(() => {
    return () => clearTimer();
  }, [timerInterval]);

  return (
    <div
      style={{
        background: "linear-gradient(135deg,#f5f7fa 0%,#dbeafe 100%)",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      {/* Header */}
      <Card
        style={{
          borderRadius: 20,
          border: "none",
          marginBottom: 24,
          background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
        }}
        bodyStyle={{ padding: 28 }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space size={16}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 26,
                }}
              >
                <FaGraduationCap />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, color: "#fff" }}>
                  Bài kiểm tra trắc nghiệm
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                  Làm bài kiểm tra và xem kết quả của bạn
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button
              type="default"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
              }}
              onClick={loadTests}
              loading={loadingTests}
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Thống kê */}
      <Card
        style={{
          borderRadius: 16,
          border: "none",
          marginBottom: 24,
          boxShadow: "0 12px 30px rgba(148,163,184,0.18)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={5}>
            <Card
              style={{ borderRadius: 14 }}
              bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#eef2ff",
                  color: "#4338ca",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                <FaClipboardList />
              </div>
              <div>
                <Text type="secondary">Tổng bài kiểm tra</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {stats.total}
                </Title>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Card
              style={{ borderRadius: 14 }}
              bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#ecfdf5",
                  color: "#047857",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                <FaPlay />
              </div>
              <div>
                <Text type="secondary">Có thể làm</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {stats.available}
                </Title>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Card
              style={{ borderRadius: 14 }}
              bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#fef3c7",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                <FaCheckCircle />
              </div>
              <div>
                <Text type="secondary">Đã nộp</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {stats.submitted}
                </Title>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Card
              style={{ borderRadius: 14 }}
              bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#fef2f2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                <FaTimesCircle />
              </div>
              <div>
                <Text type="secondary">Hết hạn</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {stats.expired}
                </Title>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card
              style={{ borderRadius: 14 }}
              bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#f3e8ff",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                <FaTrophy />
              </div>
              <div>
                <Text type="secondary">Điểm TB</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {stats.avgScore}%
                </Title>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Danh sách */}
      <Card
        style={{
          borderRadius: 16,
          border: "none",
          boxShadow: "0 12px 30px rgba(148,163,184,0.18)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Spin spinning={loadingTests} tip="Đang tải danh sách bài kiểm tra...">
          <Tabs defaultActiveKey="available">
            <TabPane
              tab={
                <span>
                  <FaPlay style={{ marginRight: 6 }} />
                  Có thể làm ({testsByStatus.available.length})
                </span>
              }
              key="available"
            >
              <Table
                rowKey="id"
                dataSource={testsByStatus.available}
                columns={tableColumns}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                locale={{
                  emptyText: (
                    <Empty
                      description="Không có bài kiểm tra nào có thể làm"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <FaCheckCircle style={{ marginRight: 6 }} />
                  Đã nộp ({testsByStatus.submitted.length})
                </span>
              }
              key="submitted"
            >
              <Table
                rowKey="id"
                dataSource={testsByStatus.submitted}
                columns={tableColumns}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                locale={{
                  emptyText: (
                    <Empty
                      description="Chưa nộp bài kiểm tra nào"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <FaTimesCircle style={{ marginRight: 6 }} />
                  Hết hạn ({testsByStatus.expired.length})
                </span>
              }
              key="expired"
            >
              <Table
                rowKey="id"
                dataSource={testsByStatus.expired}
                columns={tableColumns}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                locale={{
                  emptyText: (
                    <Empty
                      description="Không có bài kiểm tra hết hạn"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            </TabPane>
          </Tabs>
        </Spin>
      </Card>

      {/* Modal làm bài */}
      <Modal
        title={
          selectedTest ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <FaClipboardCheck style={{ color: "#1890ff" }} />
              <div>
                <span>{selectedTest.title}</span>
                {selectedTest.description && (
                  <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                    {selectedTest.description}
                  </div>
                )}
              </div>
            </div>
          ) : null
        }
        width={1200}
        open={testModal}
        onCancel={handleCloseTestModal}
        footer={null}
        destroyOnClose
        maskClosable={false}
      >
        {selectedTest && (
          <div>
            {/* Header thông tin */}
            <Card size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
              <Row gutter={16} align="middle">
                <Col span={5}>
                  <Statistic
                    title="Tiến trình"
                    value={Math.round(testProgress)}
                    suffix="%"
                    prefix={<FaFlag />}
                  />
                  <Progress
                    percent={testProgress}
                    showInfo={false}
                    size="small"
                    strokeColor={{ "0%": "#108ee9", "100%": "#52c41a" }}
                  />
                </Col>
                <Col span={5}>
                  <Statistic
                    title="Câu hỏi"
                    value={`${currentQuestionIndex + 1}/${
                      selectedTest.questions?.length || 0
                    }`}
                    prefix={<FaQuestionCircle />}
                  />
                </Col>
                <Col span={5}>
                  <Statistic
                    title="Đã trả lời"
                    value={Object.keys(testAnswers).length}
                    prefix={<FaCheck />}
                  />
                </Col>
                {selectedTest.durationMinutes && (
                  <Col span={5}>
                    <Statistic
                      title="Thời gian còn lại"
                      value={formatTimeLeft(timeLeft)}
                      prefix={<FaStopwatch />}
                      valueStyle={{
                        color:
                          timeLeft < 300
                            ? "#ff4d4f"
                            : timeLeft < 600
                            ? "#fa8c16"
                            : "#52c41a",
                      }}
                    />
                  </Col>
                )}
                <Col span={4}>
                  <Button
                    icon={<FaBars />}
                    onClick={() => setNavDrawer(true)}
                    style={{ width: "100%" }}
                  >
                    Danh sách câu hỏi
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Cảnh báo thời gian */}
            {selectedTest.durationMinutes && timeLeft < 300 && timeLeft > 0 && (
              <Alert
                message={`Cảnh báo: Còn ${Math.floor(timeLeft / 60)} phút ${
                  timeLeft % 60
                } giây!`}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                action={
                  <Button size="small" onClick={() => setNavDrawer(true)}>
                    Xem câu hỏi
                  </Button>
                }
              />
            )}

            {/* Câu hỏi hiện tại */}
            {selectedTest.questions &&
              selectedTest.questions[currentQuestionIndex] && (
                <Card
                  style={{ marginBottom: 16, borderRadius: 12 }}
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Space>
                        <Badge
                          count={currentQuestionIndex + 1}
                          style={{ backgroundColor: "#6366f1" }}
                        />
                        <Text strong style={{ fontSize: 16 }}>
                          {
                            selectedTest.questions[currentQuestionIndex]
                              .question
                          }
                        </Text>
                      </Space>
                      <Tag color="purple" style={{ borderRadius: 10 }}>
                        <FaTrophy style={{ marginRight: 4 }} />
                        {selectedTest.questions[currentQuestionIndex].points ||
                          1}{" "}
                        điểm
                      </Tag>
                    </div>
                  }
                >
                  <Radio.Group
                    value={
                      testAnswers[
                        selectedTest.questions[currentQuestionIndex].id
                      ]?.selectedIndexes?.[0]
                    }
                    onChange={(e) =>
                      handleAnswerChange(
                        selectedTest.questions[currentQuestionIndex].id,
                        [e.target.value]
                      )
                    }
                    style={{ width: "100%" }}
                  >
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: "100%" }}
                    >
                      {selectedTest.questions[
                        currentQuestionIndex
                      ].options?.map((option, idx) => (
                        <Radio
                          key={idx}
                          value={idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            padding: 16,
                            border: "2px solid #f0f0f0",
                            borderRadius: 12,
                            margin: 0,
                            transition: "all 0.3s",
                          }}
                          className="answer-option"
                        >
                          <Space>
                            <Tag
                              color="blue"
                              style={{
                                borderRadius: 8,
                                fontWeight: "bold",
                                minWidth: 24,
                                textAlign: "center",
                              }}
                            >
                              {String.fromCharCode(65 + idx)}
                            </Tag>
                            <Text style={{ fontSize: 15 }}>{option}</Text>
                          </Space>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Card>
              )}

            {/* Navigation */}
            <Row justify="space-between" align="middle">
              <Col>
                <Space size={12}>
                  <Button
                    icon={<FaArrowLeft />}
                    disabled={currentQuestionIndex === 0}
                    onClick={() =>
                      setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                    }
                    style={{ borderRadius: 8 }}
                  >
                    Câu trước
                  </Button>
                  <Button
                    disabled={
                      currentQuestionIndex >=
                      (selectedTest.questions?.length || 0) - 1
                    }
                    onClick={() =>
                      setCurrentQuestionIndex((prev) =>
                        Math.min(
                          (selectedTest.questions?.length || 0) - 1,
                          prev + 1
                        )
                      )
                    }
                    style={{ borderRadius: 8 }}
                  >
                    Câu tiếp
                    <FaArrowRight />
                  </Button>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button
                    onClick={() => setNavDrawer(true)}
                    style={{ borderRadius: 8 }}
                  >
                    <FaBars /> Xem tất cả câu hỏi
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    loading={submitting}
                    onClick={() => handleSubmitTest(false)}
                    style={{
                      borderRadius: 8,
                      background: "linear-gradient(135deg,#52c41a,#389e0d)",
                      border: "none",
                      paddingLeft: 32,
                      paddingRight: 32,
                    }}
                  >
                    <FaCheck style={{ marginRight: 6 }} />
                    Nộp bài
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Drawer navigation */}
      <Drawer
        title="Danh sách câu hỏi"
        placement="right"
        onClose={() => setNavDrawer(false)}
        open={navDrawer}
        width={400}
      >
        {selectedTest && (
          <div>
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                background: "#f5f5f5",
                borderRadius: 8,
              }}
            >
              <Text strong>
                Tiến trình: {Object.keys(testAnswers).length}/
                {selectedTest.questions?.length || 0}
              </Text>
              <Progress
                percent={testProgress}
                size="small"
                style={{ marginTop: 8 }}
                strokeColor={{ "0%": "#108ee9", "100%": "#52c41a" }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 8,
              }}
            >
              {selectedTest.questions?.map((q, idx) => (
                <Button
                  key={q.id}
                  size="large"
                  type={currentQuestionIndex === idx ? "primary" : "default"}
                  style={{
                    borderRadius: 8,
                    background: testAnswers[q.id]
                      ? currentQuestionIndex === idx
                        ? undefined
                        : "#f6ffed"
                      : undefined,
                    borderColor: testAnswers[q.id] ? "#52c41a" : undefined,
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => {
                    setCurrentQuestionIndex(idx);
                    setNavDrawer(false);
                  }}
                >
                  <div>
                    <div>{idx + 1}</div>
                    {testAnswers[q.id] && (
                      <FaCheck style={{ fontSize: 10, color: "#52c41a" }} />
                    )}
                  </div>
                </Button>
              ))}
            </div>

            <Divider />

            <div style={{ textAlign: "center" }}>
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setNavDrawer(false);
                  handleSubmitTest(false);
                }}
                style={{
                  borderRadius: 8,
                  background: "linear-gradient(135deg,#52c41a,#389e0d)",
                  border: "none",
                  width: "100%",
                }}
              >
                <FaCheck style={{ marginRight: 6 }} />
                Nộp bài
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal xem kết quả */}
      <Modal
        title={
          selectedResult ? (
            <Space>
              <FaTrophy style={{ color: "#faad14" }} />
              Kết quả: {selectedResult.examTitle}
            </Space>
          ) : null
        }
        width={900}
        open={resultModal}
        onCancel={() => {
          setResultModal(false);
          setSelectedResult(null);
        }}
        footer={null}
      >
        {selectedResult && (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Điểm số"
                    value={selectedResult.totalScore}
                    suffix={`/${selectedResult.maxScore}`}
                    prefix={<FaTrophy />}
                    valueStyle={{
                      color:
                        selectedResult.percentage >= 80
                          ? "#52c41a"
                          : selectedResult.percentage >= 60
                          ? "#faad14"
                          : "#ff4d4f",
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Tỷ lệ đúng"
                    value={selectedResult.percentage}
                    suffix="%"
                    prefix={<FaCheck />}
                    valueStyle={{
                      color:
                        selectedResult.percentage >= 80
                          ? "#52c41a"
                          : selectedResult.percentage >= 60
                          ? "#faad14"
                          : "#ff4d4f",
                    }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Câu đúng"
                    value={selectedResult.correctCount}
                    suffix={`/${selectedResult.totalQuestions}`}
                    prefix={<FaQuestionCircle />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Thời gian nộp"
                    value={dayjs(
                      selectedResult.submittedAt?.toDate?.() ||
                        selectedResult.submittedAt
                    ).format("HH:mm DD/MM")}
                    prefix={<FaClock />}
                  />
                </Col>
              </Row>

              <div style={{ marginTop: 16, textAlign: "center" }}>
                <Tag
                  color={
                    selectedResult.percentage >= 80
                      ? "success"
                      : selectedResult.percentage >= 60
                      ? "warning"
                      : "error"
                  }
                  style={{
                    fontSize: 14,
                    padding: "4px 12px",
                    borderRadius: 12,
                  }}
                >
                  {selectedResult.percentage >= 80
                    ? "Xuất sắc"
                    : selectedResult.percentage >= 60
                    ? "Khá"
                    : "Cần cố gắng"}
                </Tag>
              </div>
            </Card>

            <Card
              size="small"
              title="Chi tiết bài làm"
              style={{ borderRadius: 12 }}
            >
              <List
                size="small"
                dataSource={selectedResult.answers || []}
                renderItem={(answer, idx) => (
                  <List.Item
                    style={{
                      borderLeft: `4px solid ${
                        answer.isCorrect ? "#52c41a" : "#ff4d4f"
                      }`,
                      paddingLeft: 16,
                      marginBottom: 12,
                      borderRadius: "0 8px 8px 0",
                      background: answer.isCorrect ? "#f6ffed" : "#fff2f0",
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Badge
                            count={idx + 1}
                            style={{ backgroundColor: "#6366f1" }}
                          />
                          <Text strong>{answer.questionText}</Text>
                          <Tag
                            color={answer.isCorrect ? "success" : "error"}
                            style={{ borderRadius: 10 }}
                          >
                            {answer.isCorrect ? "Đúng" : "Sai"} ({answer.score}/
                            {answer.maxScore} điểm)
                          </Tag>
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: 8 }}>
                          <div style={{ marginBottom: 8 }}>
                            <Text strong>Câu trả lời của bạn: </Text>
                            {answer.selectedIndexes?.length > 0 ? (
                              answer.selectedIndexes.map((i) => (
                                <Tag
                                  key={i}
                                  color={answer.isCorrect ? "success" : "error"}
                                  style={{ borderRadius: 8 }}
                                >
                                  {String.fromCharCode(65 + i)}
                                </Tag>
                              ))
                            ) : (
                              <Text type="secondary" italic>
                                Chưa trả lời
                              </Text>
                            )}
                          </div>
                          <div>
                            <Text strong>Đáp án đúng: </Text>
                            {answer.correctIndexes?.map((i) => (
                              <Tag
                                key={i}
                                color="success"
                                style={{ borderRadius: 8 }}
                              >
                                {String.fromCharCode(65 + i)}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        )}
      </Modal>

      <style jsx>{`
        .answer-option:hover {
          border-color: #1890ff !important;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
        }
        .answer-option.ant-radio-wrapper-checked {
          border-color: #52c41a !important;
          background-color: #f6ffed !important;
        }
      `}</style>
    </div>
  );
}
