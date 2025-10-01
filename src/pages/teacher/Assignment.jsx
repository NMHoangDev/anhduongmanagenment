import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography, // thêm
} from "antd";
import {
  FaBookReader,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaCheck,
  FaClipboardList,
  FaClock,
  FaEdit,
  FaEye,
  FaPlus,
  FaQuestionCircle,
  FaTrash,
} from "react-icons/fa";
import dayjs from "dayjs";
import { useAuth } from "../../context/AuthContext";
import { getTeacherHomeRoomClasses } from "../../services/teacherServices/classManagementService";
import { getTeacherSubjectsForClass } from "../../services/teacherServices/gradeService";
import {
  createExamTest,
  deleteExamTest,
  listExamTestsByClass,
  updateExamTest,
} from "../../services/teacherServices/examTestService";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const buildDefaultQuestion = () => ({
  question: "",
  points: 1,
  correctOption: 0,
  options: ["", ""],
});

export default function TeacherAssignment() {
  const { currentUser } = useAuth();
  const teacherId =
    currentUser?.uid ||
    currentUser?.id ||
    currentUser?.teacherId ||
    localStorage.getItem("teacherId") ||
    localStorage.getItem("uid") ||
    "teacher_demo";

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);

  const [selectedTest, setSelectedTest] = useState(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const loadClasses = useCallback(async () => {
    if (!teacherId) return;
    setLoadingClasses(true);
    try {
      const cls = await getTeacherHomeRoomClasses(teacherId);
      setClasses(cls);
      if (cls?.length) {
        setSelectedClassId((prev) => prev || cls[0].id);
      } else {
        setSelectedClassId(null);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể tải danh sách lớp.");
    } finally {
      setLoadingClasses(false);
    }
  }, [teacherId]);

  const loadSubjects = useCallback(async () => {
    if (!teacherId || !selectedClassId) {
      setSubjects([]);
      setSelectedSubjectId(null);
      return;
    }
    setLoading(true);
    try {
      const subs = await getTeacherSubjectsForClass(teacherId, selectedClassId);
      setSubjects(subs);
      if (subs?.length) {
        setSelectedSubjectId((prev) =>
          prev && subs.some((s) => s.subjectId === prev)
            ? prev
            : subs[0].subjectId
        );
      } else {
        setSelectedSubjectId(null);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể tải môn học.");
    } finally {
      setLoading(false);
    }
  }, [teacherId, selectedClassId]);

  const loadTests = useCallback(async () => {
    if (!selectedClassId) {
      setTests([]);
      return;
    }
    setLoadingTests(true);
    try {
      const list = await listExamTestsByClass({
        classId: selectedClassId,
        includeDraft: true,
        limit: 100,
      });
      setTests(list);
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể tải bài kiểm tra.");
    } finally {
      setLoadingTests(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const currentSubjectName = useMemo(() => {
    if (!selectedSubjectId) return "-";
    const match = subjects.find((s) => s.subjectId === selectedSubjectId);
    return match?.subjectName || match?.subjectId || "-";
  }, [subjects, selectedSubjectId]);

  const subjectLookup = useMemo(() => {
    const map = new Map();
    subjects.forEach((subj) => {
      if (!subj?.subjectId) return;
      map.set(subj.subjectId, subj.subjectName || subj.subjectId);
    });
    return map;
  }, [subjects]);

  const selectedTestTotalPoints = useMemo(() => {
    if (!selectedTest) return 0;
    if (typeof selectedTest.totalPoints === "number") {
      return selectedTest.totalPoints;
    }
    return (selectedTest.questions || []).reduce(
      (sum, q) => sum + (q.points ?? 1),
      0
    );
  }, [selectedTest]);

  const testsByStatus = useMemo(() => {
    const all = tests || [];
    return {
      all,
      draft: all.filter((t) => t.status === "draft"),
      published: all.filter((t) => t.status === "published"),
      closed: all.filter((t) => t.status === "closed"),
    };
  }, [tests]);

  const handleOpenCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      title: "",
      subjectId: selectedSubjectId || undefined,
      visibility: "class",
      durationMinutes: 45,
      questions: [buildDefaultQuestion()],
    });
    setCreateModal(true);
  };

  const normalizeFormPayload = (values) => {
    const base = {
      title: values.title,
      description: values.description || "",
      classId: selectedClassId,
      subjectId: values.subjectId,
      deadline: values.deadline ? values.deadline.toDate() : null,
      durationMinutes: values.durationMinutes || null,
      visibility: values.visibility || "class",
      questions: (values.questions || []).map((q, idx) => ({
        question: q.question,
        options: (q.options || []).map((opt) => opt || ""),
        correctIndexes: [
          Number.isInteger(q.correctOption) ? Number(q.correctOption) : 0,
        ],
        points:
          typeof q.points === "number" && !Number.isNaN(q.points)
            ? q.points
            : 1,
        explanation: q.explanation || "",
        id: q.id || `q_${idx + 1}`,
      })),
    };
    if (!base.questions.length) {
      throw new Error("Bài kiểm tra phải có ít nhất một câu hỏi.");
    }
    base.questions.forEach((q, idx) => {
      if (!q.question?.trim()) {
        throw new Error(`Câu hỏi ${idx + 1} chưa có nội dung.`);
      }
      if (!q.options.length) {
        throw new Error(`Câu hỏi ${idx + 1} chưa có đáp án.`);
      }
      if (q.correctIndexes[0] < 0 || q.correctIndexes[0] >= q.options.length) {
        throw new Error(`Câu hỏi ${idx + 1} chưa chọn đáp án đúng.`);
      }
    });
    return base;
  };

  const handleCreate = async (values) => {
    try {
      const payload = normalizeFormPayload(values);
      await createExamTest({
        ...payload,
        createdBy: teacherId,
      });
      message.success("Đã tạo bài kiểm tra.");
      setCreateModal(false);
      loadTests();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể tạo bài kiểm tra.");
    }
  };

  const handleOpenEdit = (test) => {
    setSelectedTest(test);
    editForm.setFieldsValue({
      title: test.title,
      subjectId: test.subjectId || undefined,
      visibility: test.visibility || "class",
      deadline: test.deadline
        ? dayjs(test.deadline.toDate?.() || test.deadline)
        : null,
      durationMinutes: test.durationMinutes || null,
      description: test.description || "",
      questions: (test.questions || []).map((q, idx) => ({
        id: q.id || `q_${idx + 1}`,
        question: q.question,
        points: q.points ?? 1,
        correctOption: q.correctIndexes?.[0] ?? 0,
        explanation: q.explanation || "",
        options:
          Array.isArray(q.options) && q.options.length ? q.options : ["", ""],
      })),
    });
    setEditModal(true);
  };

  const handleUpdate = async (values) => {
    if (!selectedTest) return;
    try {
      const payload = normalizeFormPayload(values);
      await updateExamTest(selectedTest.id, payload);
      message.success("Đã cập nhật bài kiểm tra.");
      setEditModal(false);
      setSelectedTest(null);
      loadTests();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể cập nhật bài kiểm tra.");
    }
  };

  const handleDelete = async (testId) => {
    try {
      await deleteExamTest(testId);
      message.success("Đã xoá bài kiểm tra.");
      setTests((prev) => prev.filter((t) => t.id !== testId));
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể xoá bài kiểm tra.");
    }
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
              background: "linear-gradient(135deg,#667eea,#764ba2)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            <FaClipboardList />
          </div>
          <div>
            <Text strong style={{ fontSize: 15, color: "#1f2937" }}>
              {text}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="geekblue" style={{ borderRadius: 12 }}>
                {subjectLookup.get(record.subjectId) || "Chưa có môn"}
              </Tag>
              <Tag color="purple" style={{ borderRadius: 12 }}>
                {record.questions?.length || 0} câu hỏi
              </Tag>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Tổng điểm",
      dataIndex: "totalPoints",
      key: "totalPoints",
      align: "center",
      render: (value, record) => (
        <Tag color="cyan" style={{ borderRadius: 12 }}>
          {value ??
            record.questions?.reduce((sum, q) => sum + (q.points || 1), 0) ??
            0}
        </Tag>
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
        return (
          <div>
            <Text strong style={{ color: isOver ? "#ff4d4f" : "#2563eb" }}>
              {dayjs(date).format("DD/MM/YYYY HH:mm")}
            </Text>
            <div>
              <Tag color={isOver ? "red" : "blue"} style={{ borderRadius: 10 }}>
                {isOver ? "Hết hạn" : "Còn hạn"}
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
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) => {
        const color =
          status === "published"
            ? "success"
            : status === "closed"
            ? "default"
            : "warning";
        const text =
          status === "published"
            ? "Đã phát hành"
            : status === "closed"
            ? "Đã đóng"
            : "Bản nháp";
        return (
          <Tag color={color} style={{ borderRadius: 12 }}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 160,
      align: "center",
      render: (_text, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              shape="circle"
              icon={<FaEye />}
              onClick={() => {
                setSelectedTest(record);
                setViewModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              shape="circle"
              icon={<FaEdit />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xoá bài kiểm tra này?"
            okText="Xoá"
            cancelText="Huỷ"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button shape="circle" danger icon={<FaTrash />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderQuestionList = (questions = []) => (
    <List
      size="small"
      dataSource={questions}
      renderItem={(q, idx) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space>
                <Badge count={idx + 1} style={{ backgroundColor: "#6366f1" }} />
                <Text strong>{q.question}</Text>
                <Tag color="purple" style={{ borderRadius: 10 }}>
                  {q.points ?? 1} điểm
                </Tag>
              </Space>
            }
            description={
              <div style={{ marginTop: 6 }}>
                <Paragraph style={{ marginBottom: 6 }}>
                  {q.options?.map((opt, optIdx) => (
                    <div key={optIdx} style={{ marginBottom: 4 }}>
                      <Tag
                        color={
                          q.correctIndexes?.includes(optIdx)
                            ? "success"
                            : "default"
                        }
                        style={{ borderRadius: 10 }}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </Tag>
                      <Text>{opt}</Text>
                    </div>
                  ))}
                </Paragraph>
                {q.explanation && (
                  <Tag color="geekblue" style={{ borderRadius: 10 }}>
                    Giải thích: {q.explanation}
                  </Tag>
                )}
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const renderQuestionFields = (formInstance) => (
    <Form.List name="questions">
      {(fields, { add, remove }) => (
        <Space direction="vertical" style={{ width: "100%" }}>
          {fields.map((field, idx) => {
            const optionsValue =
              formInstance.getFieldValue([
                "questions",
                field.name,
                "options",
              ]) || [];
            const selectOptions =
              optionsValue.length > 0 ? optionsValue : ["", ""];
            return (
              <Card
                key={field.key}
                type="inner"
                title={
                  <Space>
                    <FaQuestionCircle />
                    Câu hỏi {idx + 1}
                  </Space>
                }
                extra={
                  fields.length > 1 ? (
                    <Button
                      type="link"
                      danger
                      onClick={() => remove(field.name)}
                    >
                      Xoá
                    </Button>
                  ) : null
                }
                style={{ borderRadius: 12 }}
              >
                <Form.Item
                  {...field}
                  name={[field.name, "question"]}
                  fieldKey={[field.fieldKey, "question"]}
                  label="Nội dung câu hỏi"
                  rules={[{ required: true, message: "Nhập nội dung câu hỏi" }]}
                >
                  <Input.TextArea rows={3} placeholder="Nhập câu hỏi" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, "points"]}
                      fieldKey={[field.fieldKey, "points"]}
                      label="Điểm cho câu hỏi"
                    >
                      <InputNumber
                        min={0.5}
                        step={0.5}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...field}
                      name={[field.name, "correctOption"]}
                      fieldKey={[field.fieldKey, "correctOption"]}
                      label="Đáp án đúng"
                      rules={[{ required: true, message: "Chọn đáp án đúng" }]}
                    >
                      <Select placeholder="Chọn đáp án đúng">
                        {selectOptions.map((opt, optIdx) => (
                          <Option key={optIdx} value={optIdx}>
                            {String.fromCharCode(65 + optIdx)}.{" "}
                            {opt || "(trống)"}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.List name={[field.name, "options"]}>
                  {(optFields, optOps) => (
                    <>
                      {optFields.map((optField, optIdx) => (
                        <Form.Item
                          key={optField.key}
                          {...optField}
                          label={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                          rules={[
                            {
                              required: true,
                              message: "Nội dung đáp án bắt buộc",
                            },
                          ]}
                        >
                          <Input
                            placeholder="Nhập đáp án"
                            addonAfter={
                              optFields.length > 2 ? (
                                <Button
                                  type="link"
                                  danger
                                  onClick={() => optOps.remove(optField.name)}
                                >
                                  Xoá
                                </Button>
                              ) : null
                            }
                          />
                        </Form.Item>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => optOps.add("")}
                        block
                        icon={<FaPlus />}
                      >
                        Thêm đáp án
                      </Button>
                    </>
                  )}
                </Form.List>

                <Form.Item
                  {...field}
                  name={[field.name, "explanation"]}
                  fieldKey={[field.fieldKey, "explanation"]}
                  label="Giải thích (tuỳ chọn)"
                >
                  <Input.TextArea
                    rows={2}
                    placeholder="Thêm giải thích nếu cần"
                  />
                </Form.Item>
              </Card>
            );
          })}
          <Button
            type="dashed"
            onClick={() => add(buildDefaultQuestion())}
            block
            icon={<FaPlus />}
          >
            Thêm câu hỏi
          </Button>
        </Space>
      )}
    </Form.List>
  );

  return (
    <div
      style={{
        background: "linear-gradient(135deg,#f5f7fa 0%,#dbeafe 100%)",
        minHeight: "100vh",
        padding: 24,
      }}
    >
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
                <FaBookReader />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, color: "#fff" }}>
                  Ra đề trắc nghiệm
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                  Tạo bài kiểm tra trắc nghiệm cho lớp học của bạn
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size={12} wrap>
              <Select
                placeholder="Chọn lớp"
                value={selectedClassId}
                loading={loadingClasses}
                onChange={setSelectedClassId}
                style={{ minWidth: 200 }}
              >
                {classes.map((cls) => (
                  <Option key={cls.id} value={cls.id}>
                    {cls.name || cls.id}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Chọn môn"
                value={selectedSubjectId}
                loading={loading}
                onChange={setSelectedSubjectId}
                style={{ minWidth: 200 }}
              >
                {subjects.map((sub) => (
                  <Option key={sub.subjectId} value={sub.subjectId}>
                    {sub.subjectName || sub.subjectId}
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<FaPlus />}
                size="large"
                disabled={!selectedClassId}
                onClick={handleOpenCreate}
                style={{
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg,#34d399,#10b981)",
                }}
              >
                Tạo bài kiểm tra
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

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
          <Col xs={24} md={8}>
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
                <FaChalkboardTeacher />
              </div>
              <div>
                <Text type="secondary">Lớp hiện tại</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {currentClass?.name || "Chưa chọn"}
                </Title>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
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
                <FaBookReader />
              </div>
              <div>
                <Text type="secondary">Môn học</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {currentSubjectName}
                </Title>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
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
                <FaClipboardList />
              </div>
              <div>
                <Text type="secondary">Tổng bài kiểm tra</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {tests?.length || 0}
                </Title>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        style={{
          borderRadius: 16,
          border: "none",
          boxShadow: "0 12px 30px rgba(148,163,184,0.18)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Tabs defaultActiveKey="all">
          <TabPane tab={`Tất cả (${testsByStatus.all.length})`} key="all">
            <Table
              rowKey="id"
              loading={loadingTests}
              dataSource={testsByStatus.all}
              columns={tableColumns}
              pagination={{ pageSize: 6 }}
              locale={{
                emptyText: <Empty description="Chưa có bài kiểm tra" />,
              }}
            />
          </TabPane>
          <TabPane tab={`Bản nháp (${testsByStatus.draft.length})`} key="draft">
            <Table
              rowKey="id"
              dataSource={testsByStatus.draft}
              columns={tableColumns}
              pagination={{ pageSize: 6 }}
              locale={{ emptyText: <Empty description="Không có bản nháp" /> }}
            />
          </TabPane>
          <TabPane
            tab={`Đã phát hành (${testsByStatus.published.length})`}
            key="published"
          >
            <Table
              rowKey="id"
              dataSource={testsByStatus.published}
              columns={tableColumns}
              pagination={{ pageSize: 6 }}
              locale={{
                emptyText: <Empty description="Không có bài đã phát hành" />,
              }}
            />
          </TabPane>
          <TabPane
            tab={`Đã đóng (${testsByStatus.closed.length})`}
            key="closed"
          >
            <Table
              rowKey="id"
              dataSource={testsByStatus.closed}
              columns={tableColumns}
              pagination={{ pageSize: 6 }}
              locale={{
                emptyText: <Empty description="Không có bài đã đóng" />,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          <Space>
            <FaPlus />
            Tạo bài kiểm tra trắc nghiệm
          </Space>
        }
        width={900}
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={createForm}
          onFinish={handleCreate}
          initialValues={{ visibility: "class" }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tiêu đề"
                rules={[
                  { required: true, message: "Nhập tiêu đề bài kiểm tra" },
                ]}
              >
                <Input placeholder="Nhập tiêu đề" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subjectId" label="Môn học">
                <Select placeholder="Chọn môn học">
                  {subjects.map((sub) => (
                    <Option key={sub.subjectId} value={sub.subjectId}>
                      {sub.subjectName || sub.subjectId}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="deadline" label="Hạn làm bài">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  placeholder="Chọn hạn làm bài"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="durationMinutes" label="Thời lượng (phút)">
                <InputNumber min={10} step={5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="visibility" label="Phạm vi hiển thị">
                <Select>
                  <Option value="class">Trong lớp</Option>
                  <Option value="public">Công khai</Option>
                  <Option value="private">Riêng tư</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              rows={3}
              placeholder="Thông tin hướng dẫn cho học sinh"
            />
          </Form.Item>

          {renderQuestionFields(createForm)}

          <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setCreateModal(false)}>Huỷ</Button>
              <Button type="primary" htmlType="submit" icon={<FaCheck />}>
                Lưu bài kiểm tra
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <FaEdit />
            Chỉnh sửa bài kiểm tra
          </Space>
        }
        width={900}
        open={editModal}
        onCancel={() => {
          setEditModal(false);
          setSelectedTest(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" form={editForm} onFinish={handleUpdate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tiêu đề"
                rules={[
                  { required: true, message: "Nhập tiêu đề bài kiểm tra" },
                ]}
              >
                <Input placeholder="Nhập tiêu đề" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subjectId" label="Môn học">
                <Select placeholder="Chọn môn học">
                  {subjects.map((sub) => (
                    <Option key={sub.subjectId} value={sub.subjectId}>
                      {sub.subjectName || sub.subjectId}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="deadline" label="Hạn làm bài">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  placeholder="Chọn hạn làm bài"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="durationMinutes" label="Thời lượng (phút)">
                <InputNumber min={10} step={5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="visibility" label="Phạm vi hiển thị">
                <Select>
                  <Option value="class">Trong lớp</Option>
                  <Option value="public">Công khai</Option>
                  <Option value="private">Riêng tư</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              rows={3}
              placeholder="Thông tin hướng dẫn cho học sinh"
            />
          </Form.Item>

          {renderQuestionFields(editForm)}

          <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setEditModal(false);
                  setSelectedTest(null);
                }}
              >
                Huỷ
              </Button>
              <Button type="primary" htmlType="submit" icon={<FaCheck />}>
                Cập nhật
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        width={800}
        open={viewModal}
        onCancel={() => {
          setViewModal(false);
          setSelectedTest(null);
        }}
        footer={null}
        title={
          selectedTest ? (
            <Space>
              <FaEye />
              {selectedTest.title}
            </Space>
          ) : null
        }
      >
        {selectedTest ? (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <Space size={16} wrap>
                <Tag color="blue" icon={<FaBookReader />}>
                  Môn:{" "}
                  {subjectLookup.get(selectedTest.subjectId) ||
                    selectedTest.subjectId ||
                    "Chưa xác định"}
                </Tag>
                <Tag color="magenta" icon={<FaClock />}>
                  Thời lượng:{" "}
                  {selectedTest.durationMinutes
                    ? `${selectedTest.durationMinutes} phút`
                    : "Không giới hạn"}
                </Tag>
                {selectedTest.deadline && (
                  <Tag color="orange" icon={<FaCalendarAlt />}>
                    Hạn:{" "}
                    {dayjs(
                      selectedTest.deadline.toDate?.() || selectedTest.deadline
                    ).format("DD/MM/YYYY HH:mm")}
                  </Tag>
                )}
                <Tag color="purple">Tổng điểm: {selectedTestTotalPoints}</Tag>
              </Space>
            </Card>
            {selectedTest.description && (
              <Card size="small" style={{ borderRadius: 12 }}>
                <Title level={5}>Mô tả</Title>
                <Paragraph>{selectedTest.description}</Paragraph>
              </Card>
            )}
            <Card
              size="small"
              style={{ borderRadius: 12 }}
              title={
                <Space>
                  <FaQuestionCircle />
                  Danh sách câu hỏi
                </Space>
              }
            >
              {renderQuestionList(selectedTest.questions)}
            </Card>
          </Space>
        ) : (
          <Empty description="Không có dữ liệu" />
        )}
      </Modal>
    </div>
  );
}
