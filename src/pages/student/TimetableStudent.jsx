// ==========================
// File: src/pages/student/TimetableStudent.jsx
// ==========================
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Avatar,
  Empty,
  message,
  Divider,
  Select,
  InputNumber,
} from "antd";
import {
  BookOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FilePdfOutlined,
  SyncOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentWeekTimetable,
  getStudentWeeks,
  getTimetableStats,
  buildSessionName, // ✅ cần export từ service
} from "../../services/studentServices/timeTableService";

const { Title, Text } = Typography;
const { Option } = Select;

// helper nhỏ: sort tiết trong ngày ưu tiên timeSlot rồi đến startTime
const toMinutes = (t) => {
  if (!t) return Number.MAX_SAFE_INTEGER;
  const [h, m] = String(t).split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
const sortLessonsInDay = (arr = []) =>
  arr.slice().sort((a, b) => {
    const aSlot = a.timeSlot ?? Number.MAX_SAFE_INTEGER;
    const bSlot = b.timeSlot ?? Number.MAX_SAFE_INTEGER;
    if (aSlot !== bSlot) return aSlot - bSlot;
    return toMinutes(a.startTime) - toMinutes(b.startTime);
  });

const DAY_META = [
  { key: "monday", label: "Thứ 2" },
  { key: "tuesday", label: "Thứ 3" },
  { key: "wednesday", label: "Thứ 4" },
  { key: "thursday", label: "Thứ 5" },
  { key: "friday", label: "Thứ 6" },
  { key: "saturday", label: "Thứ 7" },
];

export default function TimetableStudent() {
  const { currentUser } = useAuth();
  const studentId = currentUser?.id;

  // ===== Session controls =====
  const now = new Date();
  const defaultYearFrom =
    now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1; // >= Aug => SESSION 1
  const [term, setTerm] = useState(now.getMonth() >= 7 ? 1 : 2); // Aug–Dec: 1, Jan–May: 2 (tuỳ rule bạn)
  const [yearFrom, setYearFrom] = useState(defaultYearFrom);
  const [yearTo, setYearTo] = useState(defaultYearFrom + 1);
  const sessionName = buildSessionName(term, yearFrom, yearTo); // "SESSION 1 2024-2025"

  const [groupedSchedule, setGroupedSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Khi đổi session => reset tuần
  useEffect(() => {
    setWeeks([]);
    setSelectedWeek(null);
    setGroupedSchedule({});
    setStats(null);
  }, [sessionName]);

  /** === Load danh sách tuần theo session === */
  useEffect(() => {
    if (!studentId || !sessionName) return;
    (async () => {
      setLoading(true);
      try {
        const weekList = await getStudentWeeks(studentId, sessionName); // ✅ truyền session
        if (!weekList || weekList.length === 0) {
          message.warning(
            "Không tìm thấy tuần học nào cho học sinh trong kỳ đã chọn."
          );
          setWeeks([]);
          setSelectedWeek(null);
          return;
        }
        setWeeks(weekList);
        setSelectedWeek((prev) => prev || weekList[0]); // chọn tuần nhỏ nhất theo dữ liệu
      } catch (err) {
        console.error("Lỗi khi lấy danh sách tuần:", err);
        message.error(err.message || "Không thể tải danh sách tuần");
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId, sessionName]);

  /** === Khi week thay đổi thì lấy TKB + stats (trong session) === */
  useEffect(() => {
    if (studentId && selectedWeek && sessionName) {
      fetchWeekTimetable();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, selectedWeek, sessionName]);

  const fetchWeekTimetable = async () => {
    if (!studentId || !selectedWeek || !sessionName) return;
    setLoading(true);
    try {
      const data = await getStudentWeekTimetable(
        studentId,
        selectedWeek,
        sessionName
      ); // ✅ truyền session

      if (data.message) {
        message.warning(data.message);
        setStudentInfo({ className: data.className, classId: data.classId });
        setGroupedSchedule({});
        return;
      }

      setStudentInfo({ className: data.className, classId: data.classId });

      // sort theo ngày
      const sorted = {};
      Object.entries(data.schedule || {}).forEach(([day, lessons]) => {
        sorted[day] = sortLessonsInDay([...(lessons || [])]);
      });
      setGroupedSchedule(sorted);
    } catch (err) {
      console.error("Lỗi khi lấy thời khóa biểu:", err);
      message.error(err.message || "Không thể tải thời khóa biểu");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!studentId || !sessionName) return;
    try {
      const statsData = await getTimetableStats(studentId, sessionName); // ✅ truyền session
      setStats(statsData);
    } catch (err) {
      console.error("Lỗi khi lấy thống kê:", err);
    }
  };

  const handleRefresh = async () => {
    await fetchWeekTimetable();
    await fetchStats();
    message.success("Đã làm mới thời khóa biểu");
  };

  const allLessons = useMemo(
    () => Object.values(groupedSchedule).flat().filter(Boolean) || [],
    [groupedSchedule]
  );

  /** === Card hiển thị 1 tiết học === */
  const LessonCard = ({ lesson }) => (
    <div
      style={{
        background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
        color: "#fff",
        padding: "0.75rem",
        marginBottom: "0.5rem",
        borderRadius: "0.5rem",
        boxShadow: "0 2px 8px rgba(24, 144, 255, 0.25)",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>
        {lesson.subject || lesson.name || "—"}
      </div>
      <div style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.25rem" }}>
        <ClockCircleOutlined /> {lesson.startTime} - {lesson.endTime}
      </div>
      {(lesson.teacher || lesson.room) && (
        <div
          style={{
            fontSize: "0.75rem",
            opacity: 0.85,
            marginTop: "0.25rem",
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {lesson.teacher && (
            <span
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <UserOutlined /> {lesson.teacher}
            </span>
          )}
          {lesson.room && <span>• Phòng: {lesson.room}</span>}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <Skeleton active />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "clamp(0.75rem, 3vw, 1.5rem)",
        maxWidth: "1400px",
        margin: "0 auto",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "clamp(1.5rem, 4vw, 2rem)" }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <div style={{ marginBottom: "1rem" }}>
              <Title
                level={1}
                style={{
                  margin: 0,
                  fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                  background:
                    "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700,
                }}
              >
                Thời khóa biểu
              </Title>
              <Text type="secondary" style={{ fontSize: "1rem" }}>
                Lịch học của lớp {studentInfo?.className || "—"}
              </Text>
            </div>
          </Col>

          {/* Chọn Session + tuần */}
          <Col xs={24} lg={8}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }} wrap>
              <Space.Compact>
                <Select
                  value={term}
                  onChange={(v) => setTerm(v)}
                  style={{ width: 130 }}
                  options={[
                    { value: 1, label: "SESSION 1" },
                    { value: 2, label: "SESSION 2" },
                  ]}
                />
                <InputNumber
                  min={2000}
                  max={3000}
                  value={yearFrom}
                  onChange={(v) => {
                    const yf = Number(v || defaultYearFrom);
                    setYearFrom(yf);
                    setYearTo(yf + 1);
                  }}
                  style={{ width: 100 }}
                  placeholder="Year from"
                />
                <InputNumber
                  min={2001}
                  max={3001}
                  value={yearTo}
                  onChange={(v) => setYearTo(Number(v || yearFrom + 1))}
                  style={{ width: 100 }}
                  placeholder="Year to"
                />
              </Space.Compact>
              <Tag color="processing">{sessionName}</Tag>

              <Tooltip title="Chọn tuần học">
                <Select
                  value={selectedWeek}
                  onChange={(val) => setSelectedWeek(val)}
                  style={{ width: 150 }}
                  suffixIcon={<CalendarOutlined />}
                  placeholder="Chọn tuần"
                  disabled={!weeks.length}
                >
                  {weeks.map((w) => (
                    <Option key={w} value={w}>
                      {w.replace("W", "Tuần ")}
                    </Option>
                  ))}
                </Select>
              </Tooltip>

              <Tooltip title="Làm mới">
                <Button
                  icon={<SyncOutlined />}
                  onClick={handleRefresh}
                  type="text"
                  shape="circle"
                />
              </Tooltip>

              <Button
                icon={<FilePdfOutlined />}
                type="default"
                onClick={() => message.info("TODO: Export PDF")}
              >
                Xuất PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Thông tin học sinh */}
      <Card
        style={{
          borderRadius: "1rem",
          boxShadow: "0 4px 20px rgba(24, 144, 255, 0.1)",
          marginBottom: "clamp(1.5rem, 4vw, 2rem)",
          border: "1px solid #e8f4fd",
        }}
        bodyStyle={{ padding: "clamp(1.5rem, 4vw, 2rem)" }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={6} md={4}>
            <div style={{ textAlign: "center" }}>
              <Avatar
                size={{ xs: 120, sm: 140, md: 160 }}
                src={currentUser?.avatar}
                icon={!currentUser?.avatar ? <UserOutlined /> : null}
                style={{
                  border: "4px solid #fff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                }}
              />
            </div>
          </Col>
          <Col xs={24} sm={18} md={20}>
            <div>
              <Title
                level={2}
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "clamp(1.5rem, 4vw, 2rem)",
                  color: "#1890ff",
                }}
              >
                {currentUser?.name || "Học sinh"}
              </Title>
              <Row gutter={[24, 12]}>
                <Col xs={24} sm={12} lg={8}>
                  <Space>
                    <BookOutlined style={{ color: "#1890ff" }} />
                    <Text type="secondary">Lớp:</Text>
                    <Tag color="blue" style={{ fontSize: "0.875rem" }}>
                      {studentInfo?.className || "—"}
                    </Tag>
                  </Space>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Space>
                    <ClockCircleOutlined style={{ color: "#1890ff" }} />
                    <Text type="secondary">Tổng tiết:</Text>
                    <Text strong style={{ color: "#52c41a" }}>
                      {allLessons.length} tiết
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Space>
                    <CalendarOutlined style={{ color: "#1890ff" }} />
                    <Text type="secondary">Tuần hiện tại:</Text>
                    <Tag color="processing">{selectedWeek || "—"}</Tag>
                  </Space>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Timetable Grid */}
      <Row gutter={[16, 16]}>
        {DAY_META.map((d) => {
          const lessons = groupedSchedule[d.key] || [];
          return (
            <Col key={d.key} xs={24} md={12} lg={8}>
              <Card
                title={<span style={{ fontWeight: 700 }}>{d.label}</span>}
                extra={
                  <Tag color={lessons.length ? "processing" : "default"}>
                    {lessons.length} tiết
                  </Tag>
                }
                style={{ borderRadius: 16, height: "100%" }}
                bodyStyle={{ minHeight: 140 }}
              >
                {lessons.length === 0 ? (
                  <Empty
                    description="Không có tiết"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  lessons.map((ls) => (
                    <LessonCard
                      key={ls.id || `${ls.subject}-${ls.startTime}`}
                      lesson={ls}
                    />
                  ))
                )}
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Stats */}
      {stats && (
        <>
          <Divider />
          <Card title="Thống kê nhanh" style={{ borderRadius: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small" bordered={false}>
                  <Text type="secondary">Tổng số tiết (theo dữ liệu)</Text>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {stats.totalLessons ?? allLessons.length}
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" bordered={false}>
                  <Text type="secondary">Môn học phổ biến</Text>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {stats.topSubjects?.[0]?.subject || "—"}
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
}
