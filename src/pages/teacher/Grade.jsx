import React, { useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  Table,
  InputNumber,
  Button,
  Tag,
  message,
} from "antd";
import { FaClipboardList, FaSave } from "react-icons/fa";

const { Title, Text } = Typography;
const { Option } = Select;

// Mock data
const classes = [
  {
    id: "1A",
    name: "Lớp 1A",
    students: [
      { id: "HS01", name: "Nguyễn Văn An" },
      { id: "HS02", name: "Trần Thị Bích" },
      { id: "HS03", name: "Lê Minh Tuấn" },
    ],
  },
  {
    id: "2A",
    name: "Lớp 2A",
    students: [
      { id: "HS04", name: "Phạm Thị Hoa" },
      { id: "HS05", name: "Vũ Đức Long" },
    ],
  },
];
const subjects = ["Toán", "Văn", "Anh"];

export default function TeacherGrade() {
  const [selectedClassId, setSelectedClassId] = useState(classes[0].id);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [grades, setGrades] = useState({});

  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [selectedClassId]
  );

  const handleChange = (studentId, subject, value) => {
    const num =
      value === null || value === undefined ? undefined : Number(value);
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subject]: num,
      },
    }));
  };

  const calcAverage = (studentId) => {
    const g = grades[studentId] || {};
    const vals = subjects
      .map((s) => (typeof g[s] === "number" ? g[s] : null))
      .filter((v) => v !== null);
    if (!vals.length) return undefined;
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  };

  const completion = useMemo(() => {
    const total = (currentClass?.students?.length || 0) * subjects.length;
    if (!total) return 0;
    let filled = 0;
    currentClass?.students?.forEach((st) => {
      subjects.forEach((s) => {
        if (typeof grades[st.id]?.[s] === "number") filled += 1;
      });
    });
    return Math.round((filled / total) * 100);
  }, [currentClass, grades]);

  const onSave = () => {
    // placeholder: send grades to API / firestore
    message.success(`Đã lưu điểm cho lớp ${currentClass?.name || "-"}`);
  };

  const getGradeColor = (g) => {
    if (g === undefined || g === null) return "default";
    if (g >= 8) return "green";
    if (g >= 6.5) return "blue";
    return "red";
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 70,
      align: "center",
      render: (_v, _r, idx) => (
        <Text strong style={{ color: "#1890ff" }}>
          {idx + 1}
        </Text>
      ),
    },
    {
      title: "Học sinh",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: 12, color: "#999" }}>{record.id}</div>
        </div>
      ),
    },
    ...subjects.map((sub) => ({
      title: sub,
      key: sub,
      align: "center",
      render: (_t, record) => (
        <InputNumber
          min={0}
          max={10}
          step={0.1}
          value={grades[record.id]?.[sub]}
          onChange={(v) => handleChange(record.id, sub, v)}
          style={{ width: 88 }}
        />
      ),
    })),
    {
      title: "Điểm TB",
      key: "avg",
      align: "center",
      render: (_t, record) => {
        const avg = calcAverage(record.id);
        return (
          <Tag color={getGradeColor(avg)} style={{ borderRadius: 12 }}>
            {typeof avg === "number" ? avg : "-"}
          </Tag>
        );
      },
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 16,
          border: "none",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title
              level={2}
              style={{
                color: "#fff",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <FaClipboardList />
              </div>
              Nhập điểm học sinh
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.9)" }}>
              Ghi nhận điểm theo môn và lớp, hiển thị điểm trung bình
            </Text>
          </Col>
          <Col>
            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                padding: "8px 12px",
                borderRadius: 12,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <Text strong style={{ color: "#fff" }}>
                Lớp
              </Text>
              <Select
                value={selectedClassId}
                onChange={setSelectedClassId}
                style={{ width: 140 }}
                size="middle"
              >
                {classes.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
              <Text strong style={{ color: "#fff" }}>
                Môn
              </Text>
              <Select
                value={selectedSubject}
                onChange={setSelectedSubject}
                style={{ width: 140 }}
                size="middle"
              >
                {subjects.map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ marginBottom: 24, borderRadius: 16 }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 12 }}>
              <Text type="secondary">Số học sinh</Text>
              <div>
                <Text strong style={{ fontSize: 24 }}>
                  {currentClass?.students?.length || 0}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 12 }}>
              <Text type="secondary">Môn hiện tại</Text>
              <div>
                <Text strong style={{ fontSize: 18 }}>
                  {selectedSubject}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 12 }}>
              <Text type="secondary">Hoàn thành nhập điểm</Text>
              <div>
                <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
                  {completion}%
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              bodyStyle={{
                padding: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              style={{ borderRadius: 12 }}
            >
              <Button
                type="primary"
                icon={<FaSave />}
                onClick={onSave}
                style={{
                  background: "linear-gradient(135deg, #52c41a, #73d13d)",
                  border: "none",
                  borderRadius: 8,
                }}
              >
                Lưu điểm
              </Button>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
        <Table
          columns={columns}
          dataSource={currentClass?.students || []}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
}
