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
  Typography,
  Dropdown,
  Menu,
  Switch,
  Alert,
  Progress,
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
  FaShieldAlt,
  FaGlobe,
  FaUsers,
  FaLock,
  FaEllipsisV,
  FaHistory,
  FaBell,
  FaPlay,
  FaPause,
  FaStop,
  FaFileAlt,
  FaExclamationTriangle,
  FaInfoCircle,
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
  updateExamTestVisibility,
  getExamTestVisibilityHistory,
  updateExamTestStatus,
  getExamTestStatusHistory,
  autoCloseExpiredExamTests,
  getExamTestsNearDeadline,
  EXAM_VISIBILITY_STATUS,
  EXAM_TEST_STATUS,
  getClassesForExamCreation,
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

// Mapping visibility status để hiển thị
const VISIBILITY_CONFIG = {
  [EXAM_VISIBILITY_STATUS.PUBLIC]: {
    label: "Công khai",
    color: "success",
    icon: <FaGlobe />,
    description: "Tất cả mọi người có thể thấy và làm bài",
  },
  [EXAM_VISIBILITY_STATUS.ONLY_CLASS]: {
    label: "Chỉ lớp học",
    color: "processing",
    icon: <FaUsers />,
    description: "Chỉ học sinh trong lớp mới thấy và làm được",
  },
  [EXAM_VISIBILITY_STATUS.PRIVATE]: {
    label: "Riêng tư",
    color: "default",
    icon: <FaLock />,
    description: "Chỉ giáo viên tạo ra mới thấy được",
  },
};

// Mapping status để hiển thị
const STATUS_CONFIG = {
  [EXAM_TEST_STATUS.DRAFT]: {
    label: "Bản nháp",
    color: "default",
    icon: <FaFileAlt />,
    description: "Bài kiểm tra chưa được phát hành",
  },
  [EXAM_TEST_STATUS.PUBLISHED]: {
    label: "Đã phát hành",
    color: "success",
    icon: <FaPlay />,
    description: "Bài kiểm tra đang mở cho học sinh làm",
  },
  [EXAM_TEST_STATUS.CLOSED]: {
    label: "Đã đóng",
    color: "error",
    icon: <FaStop />,
    description: "Bài kiểm tra đã đóng, không thể làm thêm",
  },
};

export default function TeacherAssignment() {
  const { currentUser } = useAuth();
  const teacherId =
    currentUser?.uid ||
    currentUser?.id ||
    currentUser?.teacherId ||
    localStorage.getItem("teacherId") ||
    localStorage.getItem("uid") ||
    "yLIKxJID7ZgpDpfyxRF5lDBlNr72"; // Demo teacher ID

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const [tests, setTests] = useState([]);
  const [nearDeadlineTests, setNearDeadlineTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [visibilityModal, setVisibilityModal] = useState(false);
  const [visibilityHistoryModal, setVisibilityHistoryModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [statusHistoryModal, setStatusHistoryModal] = useState(false);

  const [selectedTest, setSelectedTest] = useState(null);
  const [visibilityHistory, setVisibilityHistory] = useState(null);
  const [statusHistory, setStatusHistory] = useState(null);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [visibilityForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  // Load các bài sắp hết hạn
  const loadNearDeadlineTests = useCallback(async () => {
    if (!teacherId) return;
    try {
      const nearTests = await getExamTestsNearDeadline(teacherId, 24); // 24 giờ trước
      setNearDeadlineTests(nearTests);
    } catch (err) {
      console.error("Error loading near deadline tests:", err);
    }
  }, [teacherId]);

  // Tự động đóng bài quá hạn
  const handleAutoCloseExpired = useCallback(async () => {
    try {
      const expiredTests = await autoCloseExpiredExamTests(teacherId);
      if (expiredTests.length > 0) {
        message.info(
          `Đã tự động đóng ${expiredTests.length} bài kiểm tra quá hạn`
        );
        loadTests(); // Reload để cập nhật trạng thái
      }
    } catch (err) {
      console.error("Error auto-closing expired tests:", err);
    }
  }, [teacherId]);

  const loadClasses = useCallback(async () => {
    if (!teacherId) return;
    setLoadingClasses(true);
    try {
      const cls = await getClassesForExamCreation(teacherId);
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
    loadNearDeadlineTests();
    handleAutoCloseExpired(); // Tự động check và đóng bài quá hạn
  }, [loadTests, loadNearDeadlineTests, handleAutoCloseExpired]);

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
      draft: all.filter((t) => t.status === EXAM_TEST_STATUS.DRAFT),
      published: all.filter((t) => t.status === EXAM_TEST_STATUS.PUBLISHED),
      closed: all.filter((t) => t.status === EXAM_TEST_STATUS.CLOSED),
      expired: all.filter((t) => {
        if (!t.deadline) return false;
        const deadline = t.deadline.toDate
          ? t.deadline.toDate()
          : new Date(t.deadline);
        return new Date() > deadline && t.status === EXAM_TEST_STATUS.PUBLISHED;
      }),
    };
  }, [tests]);

  const handleOpenCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      title: "",
      subjectId: selectedSubjectId || undefined,
      visibility: EXAM_VISIBILITY_STATUS.ONLY_CLASS,
      status: EXAM_TEST_STATUS.PUBLISHED,
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
      visibility: values.visibility || EXAM_VISIBILITY_STATUS.ONLY_CLASS,
      status: values.status || EXAM_TEST_STATUS.PUBLISHED,
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
      loadNearDeadlineTests();
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
      visibility: test.visibility || EXAM_VISIBILITY_STATUS.ONLY_CLASS,
      status: test.status || EXAM_TEST_STATUS.PUBLISHED,
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
      loadNearDeadlineTests();
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

  // Xử lý chỉnh sửa visibility
  const handleOpenVisibilityModal = (test) => {
    setSelectedTest(test);
    visibilityForm.setFieldsValue({
      visibility: test.visibility || EXAM_VISIBILITY_STATUS.ONLY_CLASS,
      note: "",
      sendNotification: true,
    });
    setVisibilityModal(true);
  };

  const handleUpdateVisibility = async (values) => {
    if (!selectedTest) return;
    try {
      setUpdatingVisibility(true);
      await updateExamTestVisibility(
        selectedTest.id,
        teacherId,
        values.visibility,
        {
          note: values.note,
          sendNotification: values.sendNotification,
        }
      );
      message.success("Đã cập nhật quyền truy cập bài kiểm tra.");
      setVisibilityModal(false);
      setSelectedTest(null);
      loadTests();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể cập nhật quyền truy cập.");
    } finally {
      setUpdatingVisibility(false);
    }
  };

  // Xử lý chỉnh sửa status
  const handleOpenStatusModal = (test) => {
    setSelectedTest(test);
    statusForm.setFieldsValue({
      status: test.status || EXAM_TEST_STATUS.DRAFT,
      reason: "",
      note: "",
      sendNotification: true,
    });
    setStatusModal(true);
  };

  const handleUpdateStatus = async (values) => {
    if (!selectedTest) return;
    try {
      setUpdatingStatus(true);
      await updateExamTestStatus(selectedTest.id, teacherId, values.status, {
        reason: values.reason,
        note: values.note,
        sendNotification: values.sendNotification,
      });
      message.success("Đã cập nhật trạng thái bài kiểm tra.");
      setStatusModal(false);
      setSelectedTest(null);
      loadTests();
      loadNearDeadlineTests();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể cập nhật trạng thái.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Xem lịch sử thay đổi visibility
  const handleViewVisibilityHistory = async (test) => {
    try {
      setLoading(true);
      const history = await getExamTestVisibilityHistory(test.id);
      setVisibilityHistory(history);
      setSelectedTest(test);
      setVisibilityHistoryModal(true);
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể tải lịch sử thay đổi.");
    } finally {
      setLoading(false);
    }
  };

  // Xem lịch sử thay đổi status
  const handleViewStatusHistory = async (test) => {
    try {
      setLoading(true);
      const history = await getExamTestStatusHistory(test.id);
      setStatusHistory(history);
      setSelectedTest(test);
      setStatusHistoryModal(true);
    } catch (err) {
      console.error(err);
      message.error(err.message || "Không thể tải lịch sử trạng thái.");
    } finally {
      setLoading(false);
    }
  };

  // Menu dropdown cho actions
  const getActionMenu = (record) => (
    <Menu>
      <Menu.Item
        key="view"
        icon={<FaEye />}
        onClick={() => {
          setSelectedTest(record);
          setViewModal(true);
        }}
      >
        Xem chi tiết
      </Menu.Item>
      <Menu.Item
        key="edit"
        icon={<FaEdit />}
        onClick={() => handleOpenEdit(record)}
      >
        Chỉnh sửa
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="status"
        icon={<FaPlay />}
        onClick={() => handleOpenStatusModal(record)}
      >
        Trạng thái
      </Menu.Item>
      <Menu.Item
        key="visibility"
        icon={<FaShieldAlt />}
        onClick={() => handleOpenVisibilityModal(record)}
      >
        Quyền truy cập
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="status-history"
        icon={<FaHistory />}
        onClick={() => handleViewStatusHistory(record)}
      >
        Lịch sử trạng thái
      </Menu.Item>
      <Menu.Item
        key="visibility-history"
        icon={<FaHistory />}
        onClick={() => handleViewVisibilityHistory(record)}
      >
        Lịch sử quyền truy cập
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<FaTrash />}
        danger
        onClick={() => {
          Modal.confirm({
            title: "Xoá bài kiểm tra",
            content: "Bạn có chắc chắn muốn xoá bài kiểm tra này?",
            okText: "Xoá",
            okType: "danger",
            cancelText: "Huỷ",
            onOk: () => handleDelete(record.id),
          });
        }}
      >
        Xoá bài kiểm tra
      </Menu.Item>
    </Menu>
  );

  const tableColumns = [
    {
      title: "Bài kiểm tra",
      dataIndex: "title",
      key: "title",
      render: (text, record) => {
        const isExpired =
          record.deadline &&
          new Date() >
            (record.deadline.toDate?.() || new Date(record.deadline)) &&
          record.status === EXAM_TEST_STATUS.PUBLISHED;

        return (
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: isExpired
                  ? "linear-gradient(135deg,#ef4444,#dc2626)"
                  : "linear-gradient(135deg,#667eea,#764ba2)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {isExpired ? <FaExclamationTriangle /> : <FaClipboardList />}
            </div>
            <div>
              <Text strong style={{ fontSize: 15, color: "#1f2937" }}>
                {text}
              </Text>
              {isExpired && (
                <div style={{ marginTop: 2 }}>
                  <Tag color="red" size="small">
                    Quá hạn - Cần đóng
                  </Tag>
                </div>
              )}
              <div style={{ marginTop: 4 }}>
                <Tag color="geekblue" style={{ borderRadius: 12 }}>
                  {subjectLookup.get(record.subjectId) || "Chưa có môn"}
                </Tag>
                <Tag color="purple" style={{ borderRadius: 12 }}>
                  {record.questions?.length || 0} câu hỏi
                </Tag>
                {/* Hiển thị visibility */}
                <Tag
                  color={
                    VISIBILITY_CONFIG[
                      record.visibility || EXAM_VISIBILITY_STATUS.ONLY_CLASS
                    ]?.color
                  }
                  style={{ borderRadius: 12 }}
                  icon={
                    VISIBILITY_CONFIG[
                      record.visibility || EXAM_VISIBILITY_STATUS.ONLY_CLASS
                    ]?.icon
                  }
                >
                  {
                    VISIBILITY_CONFIG[
                      record.visibility || EXAM_VISIBILITY_STATUS.ONLY_CLASS
                    ]?.label
                  }
                </Tag>
              </div>
            </div>
          </div>
        );
      },
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
        const timeLeft = dayjs(date).diff(dayjs(), "hour");
        const isNearDeadline = timeLeft <= 24 && timeLeft > 0;

        return (
          <div>
            <Text
              strong
              style={{
                color: isOver
                  ? "#ff4d4f"
                  : isNearDeadline
                  ? "#faad14"
                  : "#2563eb",
              }}
            >
              {dayjs(date).format("DD/MM/YYYY HH:mm")}
            </Text>
            <div>
              <Tag
                color={isOver ? "red" : isNearDeadline ? "orange" : "blue"}
                style={{ borderRadius: 10 }}
              >
                {isOver
                  ? "Hết hạn"
                  : isNearDeadline
                  ? `Còn ${timeLeft}h`
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
        const config =
          STATUS_CONFIG[status] || STATUS_CONFIG[EXAM_TEST_STATUS.DRAFT];
        return (
          <Tag
            color={config.color}
            style={{ borderRadius: 12 }}
            icon={config.icon}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 80,
      align: "center",
      render: (_text, record) => (
        <Dropdown
          overlay={getActionMenu(record)}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            shape="circle"
            icon={<FaEllipsisV />}
            style={{ border: "none" }}
          />
        </Dropdown>
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
      {/* Alert cho bài sắp hết hạn */}
      {nearDeadlineTests.length > 0 && (
        <Alert
          message={`Có ${nearDeadlineTests.length} bài kiểm tra sắp hết hạn trong 24h tới`}
          description={nearDeadlineTests.map((test) => test.title).join(", ")}
          type="warning"
          icon={<FaClock />}
          showIcon
          closable
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="link" onClick={loadNearDeadlineTests}>
              Làm mới
            </Button>
          }
        />
      )}

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
                    {cls.displayName || cls.name || cls.id}
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

      {/* Stats */}
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
          <Col xs={24} md={6}>
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
          <Col xs={24} md={6}>
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
          <Col xs={24} md={6}>
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
          <Col xs={24} md={6}>
            <Card
              style={{ borderRadius: 14 }}
              bodyStyle={{ display: "flex", gap: 16, alignItems: "center" }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                }}
              >
                <FaExclamationTriangle />
              </div>
              <div>
                <Text type="secondary">Sắp hết hạn</Text>
                <Title level={4} style={{ margin: 0 }}>
                  {nearDeadlineTests?.length || 0}
                </Title>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Table - đã cập nhật */}
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
          <TabPane
            tab={`Quá hạn (${testsByStatus.expired.length})`}
            key="expired"
          >
            <Table
              rowKey="id"
              dataSource={testsByStatus.expired}
              columns={tableColumns}
              pagination={{ pageSize: 6 }}
              locale={{
                emptyText: <Empty description="Không có bài quá hạn" />,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Modal tạo mới - đã cập nhật status */}
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
          initialValues={{
            visibility: EXAM_VISIBILITY_STATUS.ONLY_CLASS,
            status: EXAM_TEST_STATUS.PUBLISHED,
          }}
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
            <Col span={6}>
              <Form.Item name="deadline" label="Hạn làm bài">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  placeholder="Chọn hạn làm bài"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="durationMinutes" label="Thời lượng (phút)">
                <InputNumber min={10} step={5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <Space>
                        {config.icon}
                        {config.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="visibility" label="Quyền truy cập">
                <Select>
                  {Object.entries(VISIBILITY_CONFIG).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <Space>
                        {config.icon}
                        {config.label}
                      </Space>
                    </Option>
                  ))}
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

      {/* Modal chỉnh sửa - đã cập nhật status */}
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
            <Col span={6}>
              <Form.Item name="deadline" label="Hạn làm bài">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  placeholder="Chọn hạn làm bài"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="durationMinutes" label="Thời lượng (phút)">
                <InputNumber min={10} step={5} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Trạng thái">
                <Select>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <Space>
                        {config.icon}
                        {config.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="visibility" label="Quyền truy cập">
                <Select>
                  {Object.entries(VISIBILITY_CONFIG).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <Space>
                        {config.icon}
                        {config.label}
                      </Space>
                    </Option>
                  ))}
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

      {/* Modal xem chi tiết - giữ nguyên */}
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
                <Tag
                  color={
                    STATUS_CONFIG[selectedTest.status || EXAM_TEST_STATUS.DRAFT]
                      ?.color
                  }
                  icon={
                    STATUS_CONFIG[selectedTest.status || EXAM_TEST_STATUS.DRAFT]
                      ?.icon
                  }
                >
                  {
                    STATUS_CONFIG[selectedTest.status || EXAM_TEST_STATUS.DRAFT]
                      ?.label
                  }
                </Tag>
                <Tag
                  color={
                    VISIBILITY_CONFIG[
                      selectedTest.visibility ||
                        EXAM_VISIBILITY_STATUS.ONLY_CLASS
                    ]?.color
                  }
                  icon={
                    VISIBILITY_CONFIG[
                      selectedTest.visibility ||
                        EXAM_VISIBILITY_STATUS.ONLY_CLASS
                    ]?.icon
                  }
                >
                  {
                    VISIBILITY_CONFIG[
                      selectedTest.visibility ||
                        EXAM_VISIBILITY_STATUS.ONLY_CLASS
                    ]?.label
                  }
                </Tag>
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

      {/* Modal chỉnh sửa status */}
      <Modal
        title={
          <Space>
            <FaPlay />
            Chỉnh sửa trạng thái
          </Space>
        }
        width={600}
        open={statusModal}
        onCancel={() => {
          setStatusModal(false);
          setSelectedTest(null);
        }}
        footer={null}
        destroyOnClose
      >
        {selectedTest && (
          <Form
            layout="vertical"
            form={statusForm}
            onFinish={handleUpdateStatus}
            initialValues={{
              status: selectedTest.status || EXAM_TEST_STATUS.DRAFT,
              sendNotification: true,
            }}
          >
            <Card size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
              <Title level={5}>
                <Space>
                  <FaClipboardList />
                  {selectedTest.title}
                </Space>
              </Title>
              <Text type="secondary">
                Trạng thái hiện tại:{" "}
                <Tag
                  color={
                    STATUS_CONFIG[selectedTest.status || EXAM_TEST_STATUS.DRAFT]
                      ?.color
                  }
                >
                  {
                    STATUS_CONFIG[selectedTest.status || EXAM_TEST_STATUS.DRAFT]
                      ?.label
                  }
                </Tag>
              </Text>
            </Card>

            <Form.Item
              name="status"
              label="Trạng thái mới"
              rules={[{ required: true, message: "Chọn trạng thái" }]}
            >
              <Select size="large">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <Space style={{ width: "100%", padding: 8 }}>
                      <div style={{ fontSize: 16 }}>{config.icon}</div>
                      <div>
                        <div style={{ fontWeight: "bold" }}>{config.label}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {config.description}
                        </div>
                      </div>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="reason" label="Lý do thay đổi (tùy chọn)">
              <Select placeholder="Chọn lý do" allowClear>
                <Option value="manual_close">Đóng thủ công</Option>
                <Option value="schedule_change">Thay đổi lịch</Option>
                <Option value="content_update">Cập nhật nội dung</Option>
                <Option value="technical_issue">Sự cố kỹ thuật</Option>
              </Select>
            </Form.Item>

            <Form.Item name="note" label="Ghi chú thay đổi (tùy chọn)">
              <Input.TextArea
                rows={3}
                placeholder="Lý do thay đổi trạng thái..."
              />
            </Form.Item>

            <Form.Item name="sendNotification" valuePropName="checked">
              <Space>
                <Switch />
                <Space>
                  <FaBell />
                  <Text>Gửi thông báo khi phát hành</Text>
                </Space>
              </Space>
            </Form.Item>

            <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setStatusModal(false);
                    setSelectedTest(null);
                  }}
                >
                  Huỷ
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updatingStatus}
                  icon={<FaPlay />}
                >
                  Cập nhật trạng thái
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal chỉnh sửa visibility - giữ nguyên */}
      <Modal
        title={
          <Space>
            <FaShieldAlt />
            Chỉnh sửa quyền truy cập
          </Space>
        }
        width={600}
        open={visibilityModal}
        onCancel={() => {
          setVisibilityModal(false);
          setSelectedTest(null);
        }}
        footer={null}
        destroyOnClose
      >
        {selectedTest && (
          <Form
            layout="vertical"
            form={visibilityForm}
            onFinish={handleUpdateVisibility}
            initialValues={{
              visibility:
                selectedTest.visibility || EXAM_VISIBILITY_STATUS.ONLY_CLASS,
              sendNotification: true,
            }}
          >
            <Card size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
              <Title level={5}>
                <Space>
                  <FaClipboardList />
                  {selectedTest.title}
                </Space>
              </Title>
              <Text type="secondary">
                Trạng thái hiện tại:{" "}
                <Tag
                  color={
                    VISIBILITY_CONFIG[
                      selectedTest.visibility ||
                        EXAM_VISIBILITY_STATUS.ONLY_CLASS
                    ]?.color
                  }
                >
                  {
                    VISIBILITY_CONFIG[
                      selectedTest.visibility ||
                        EXAM_VISIBILITY_STATUS.ONLY_CLASS
                    ]?.label
                  }
                </Tag>
              </Text>
            </Card>

            <Form.Item
              name="visibility"
              label="Quyền truy cập mới"
              rules={[{ required: true, message: "Chọn quyền truy cập" }]}
            >
              <Select size="large">
                {Object.entries(VISIBILITY_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <Space style={{ width: "100%", padding: 8 }}>
                      <div style={{ fontSize: 16 }}>{config.icon}</div>
                      <div>
                        <div style={{ fontWeight: "bold" }}>{config.label}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>
                          {config.description}
                        </div>
                      </div>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="note" label="Ghi chú thay đổi (tùy chọn)">
              <Input.TextArea
                rows={3}
                placeholder="Lý do thay đổi quyền truy cập..."
              />
            </Form.Item>

            <Form.Item name="sendNotification" valuePropName="checked">
              <Space>
                <Switch />
                <Space>
                  <FaBell />
                  <Text>Gửi thông báo khi chuyển sang công khai</Text>
                </Space>
              </Space>
            </Form.Item>

            <Form.Item style={{ marginTop: 24, textAlign: "right" }}>
              <Space>
                <Button
                  onClick={() => {
                    setVisibilityModal(false);
                    setSelectedTest(null);
                  }}
                >
                  Huỷ
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updatingVisibility}
                  icon={<FaShieldAlt />}
                >
                  Cập nhật quyền truy cập
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal xem lịch sử visibility */}
      <Modal
        title={
          <Space>
            <FaHistory />
            Lịch sử thay đổi quyền truy cập
          </Space>
        }
        width={700}
        open={visibilityHistoryModal}
        onCancel={() => {
          setVisibilityHistoryModal(false);
          setSelectedTest(null);
          setVisibilityHistory(null);
        }}
        footer={null}
      >
        {selectedTest && visibilityHistory && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card size="small" style={{ borderRadius: 12 }}>
              <Title level={5}>
                <Space>
                  <FaClipboardList />
                  {selectedTest.title}
                </Space>
              </Title>
            </Card>

            <Card
              size="small"
              style={{ borderRadius: 12 }}
              title="Trạng thái hiện tại"
            >
              <Space size={16} wrap>
                <Tag
                  color={
                    VISIBILITY_CONFIG[visibilityHistory.currentVisibility]
                      ?.color
                  }
                  style={{ fontSize: 14, padding: "4px 12px" }}
                >
                  <Space>
                    {
                      VISIBILITY_CONFIG[visibilityHistory.currentVisibility]
                        ?.icon
                    }
                    {
                      VISIBILITY_CONFIG[visibilityHistory.currentVisibility]
                        ?.label
                    }
                  </Space>
                </Tag>
                <Text type="secondary">
                  Cập nhật lần cuối:{" "}
                  {dayjs(
                    visibilityHistory.lastUpdatedAt?.toDate?.() ||
                      visibilityHistory.lastUpdatedAt
                  ).format("DD/MM/YYYY HH:mm")}
                </Text>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Text>
                  {
                    VISIBILITY_CONFIG[visibilityHistory.currentVisibility]
                      ?.description
                  }
                </Text>
              </div>
              {visibilityHistory.changeNote && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: "#f5f5f5",
                    borderRadius: 8,
                  }}
                >
                  <Text strong>Ghi chú: </Text>
                  <Text>{visibilityHistory.changeNote}</Text>
                </div>
              )}
            </Card>

            <Card
              size="small"
              style={{ borderRadius: 12 }}
              title="Thông tin tạo"
            >
              <Space direction="vertical">
                <Text>
                  <Text strong>Ngày tạo: </Text>
                  {dayjs(
                    visibilityHistory.createdAt?.toDate?.() ||
                      visibilityHistory.createdAt
                  ).format("DD/MM/YYYY HH:mm")}
                </Text>
                <Text>
                  <Text strong>Người tạo: </Text>
                  {visibilityHistory.createdBy}
                </Text>
              </Space>
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
}
