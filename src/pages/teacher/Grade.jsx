import React, { useEffect, useMemo, useState } from "react";
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
  Spin,
  Tooltip,
  Empty,
} from "antd";
import { FaClipboardList, FaSave } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import {
  getTeacherHomeRoomClasses,
} from "../../services/teacherServices/classManagementService";
import {
  getTeacherSubjectsForClass,
  getGradesByClassAndSubject,
  createGradeEntry,
  updateGradeEntry,
  deleteGradeEntry,
} from "../../services/teacherServices/gradeService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase"; // điều chỉnh đường dẫn nếu khác

const { Title, Text } = Typography;
const { Option } = Select;

const TERMS = [
  { value: "HK1", label: "Học kỳ 1" },
  { value: "HK2", label: "Học kỳ 2" },
];

export default function TeacherGrade() {
  const { currentUser } = useAuth();
  const teacherId =
    currentUser?.uid || currentUser?.id || currentUser?.teacherId || null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const [term, setTerm] = useState(TERMS[0].value);

  const [students, setStudents] = useState([]);
  const [gradesMap, setGradesMap] = useState({});
  const [existingGradeDocs, setExistingGradeDocs] = useState({});

  // tải lớp GVCN quản lý
  useEffect(() => {
    if (!teacherId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const cls = await getTeacherHomeRoomClasses(teacherId);
        if (!mounted) return;
        setClasses(cls);
        setSelectedClassId((prev) => prev || cls[0]?.id || null);
      } catch (err) {
        console.error("TeacherGrade -> load classes", err);
        message.error("Không thể tải danh sách lớp.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [teacherId]);

  // tải môn được phân công khi đổi lớp
  useEffect(() => {
    if (!teacherId || !selectedClassId) {
      setSubjects([]);
      setSelectedSubjectId(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const subs = await getTeacherSubjectsForClass(
          teacherId,
          selectedClassId
        );
        if (!mounted) return;
        setSubjects(subs);
        setSelectedSubjectId((prev) => {
          if (prev && subs.some((s) => s.subjectId === prev)) return prev;
          return subs[0]?.subjectId || null;
        });

        // tải học sinh của lớp
        const classDoc = await getDoc(doc(db, "classes", selectedClassId));
        const classData = classDoc.exists() ? classDoc.data() : null;
        const studentIds = classData?.students || [];
        const studentDetails = await Promise.all(
          studentIds.map(async (sid) => {
            const snap = await getDoc(doc(db, "students", sid));
            if (snap.exists()) {
              return {
                id: snap.id,
                name:
                  snap.data().name ||
                  snap.data().fullName ||
                  snap.data().displayName ||
                  snap.id,
              };
            }
            return { id: sid, name: sid };
          })
        );
        if (mounted) setStudents(studentDetails);
      } catch (err) {
        console.error("TeacherGrade -> load subjects/students", err);
        message.error("Không thể tải thông tin môn hoặc học sinh.");
        setSubjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [teacherId, selectedClassId]);

  // tải điểm theo môn + kỳ
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) {
      setGradesMap({});
      setExistingGradeDocs({});
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const grades = await getGradesByClassAndSubject(
          selectedClassId,
          selectedSubjectId
        );
        if (!mounted) return;

        const filtered = grades.filter((g) => g.term === term);
        const map = {};
        const docMap = {};
        filtered.forEach((g) => {
          map[g.studentId] = g.score;
          docMap[g.studentId] = g;
        });

        setGradesMap(map);
        setExistingGradeDocs(docMap);
      } catch (err) {
        console.error("TeacherGrade -> load grades", err);
        message.error("Không thể tải danh sách điểm.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedClassId, selectedSubjectId, term]);

  const currentClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId]
  );
  const currentSubject = useMemo(
    () =>
      subjects.find((s) => s.subjectId === selectedSubjectId)?.subjectName ||
      subjects.find((s) => s.subjectId === selectedSubjectId)?.subjectId ||
      "-",
    [subjects, selectedSubjectId]
  );

  const handleScoreChange = (studentId, value) => {
    setGradesMap((prev) => ({
      ...prev,
      [studentId]:
        value === null || value === undefined ? undefined : Number(value),
    }));
  };

  const getGradeColor = (score) => {
    if (score === undefined || score === null || Number.isNaN(score))
      return "default";
    if (score >= 8) return "green";
    if (score >= 6.5) return "blue";
    return "red";
  };

  const handleSave = async () => {
    if (!teacherId || !selectedClassId || !selectedSubjectId) return;
    try {
      setSaving(true);
      const tasks = [];
      students.forEach((st) => {
        const value = gradesMap[st.id];
        const existingDoc = existingGradeDocs[st.id];

        if (value === undefined || value === null || value === "") {
          if (existingDoc) {
            tasks.push(deleteGradeEntry(existingDoc.id, teacherId));
          }
          return;
        }

        if (existingDoc) {
          if (existingDoc.score !== value) {
            tasks.push(
              updateGradeEntry(existingDoc.id, teacherId, {
                score: Number(value),
                term,
              })
            );
          }
        } else {
          tasks.push(
            createGradeEntry({
              teacherId,
              classId: selectedClassId,
              subjectId: selectedSubjectId,
              studentId: st.id,
              score: Number(value),
              term,
            })
          );
        }
      });

      await Promise.all(tasks);
      message.success("Đã lưu điểm thành công.");
      setExistingGradeDocs((prev) => {
        const updated = { ...prev };
        students.forEach((st) => {
          const value = gradesMap[st.id];
          if (value === undefined || value === null) {
            delete updated[st.id];
          } else if (!updated[st.id]) {
            updated[st.id] = {
              id: `temp-${st.id}`,
              studentId: st.id,
              score: Number(value),
              term,
            };
          } else {
            updated[st.id] = { ...updated[st.id], score: Number(value) };
          }
        });
        return updated;
      });
    } catch (err) {
      console.error("TeacherGrade -> save grades", err);
      message.error(err.message || "Không thể lưu điểm.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      width: 80,
      align: "center",
      render: (_value, _record, index) => (
        <Text strong style={{ color: "#1d4ed8" }}>
          {index + 1}
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
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{record.id}</div>
        </div>
      ),
    },
    {
      title: (
        <span>Điểm {currentSubject !== "-" ? `(${currentSubject})` : ""}</span>
      ),
      key: "score",
      align: "center",
      render: (_text, record) => (
        <InputNumber
          min={0}
          max={10}
          step={0.1}
          value={gradesMap[record.id]}
          onChange={(val) => handleScoreChange(record.id, val)}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      align: "center",
      render: (_text, record) => {
        const score = gradesMap[record.id];
        if (score === undefined || score === null || score === "") {
          return <Tag color="default">Chưa nhập</Tag>;
        }
        return (
          <Tag color={getGradeColor(score)} style={{ borderRadius: 12 }}>
            {score}
          </Tag>
        );
      },
    },
  ];

  const completionPercent = useMemo(() => {
    if (!students.length) return 0;
    const filled = students.filter(
      (st) =>
        gradesMap[st.id] !== undefined &&
        gradesMap[st.id] !== null &&
        gradesMap[st.id] !== ""
    ).length;
    return Math.round((filled / students.length) * 100);
  }, [students, gradesMap]);

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
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
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
              Ghi nhận điểm theo môn, lớp và học kỳ
            </Text>
          </Col>

          <Col>
            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                padding: "10px 16px",
                borderRadius: 12,
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Text strong style={{ color: "#fff" }}>
                Lớp
              </Text>
              <Select
                value={selectedClassId}
                onChange={(val) => setSelectedClassId(val)}
                style={{ minWidth: 160 }}
                size="middle"
                placeholder="Chọn lớp"
                options={classes.map((c) => ({
                  value: c.id,
                  label: c.name || c.id,
                }))}
              />
              <Text strong style={{ color: "#fff" }}>
                Môn
              </Text>
              <Select
                value={selectedSubjectId}
                onChange={(val) => setSelectedSubjectId(val)}
                style={{ minWidth: 180 }}
                size="middle"
                placeholder="Chọn môn"
                options={subjects.map((s) => ({
                  value: s.subjectId,
                  label: s.subjectName || s.subjectId,
                }))}
              />
              <Text strong style={{ color: "#fff" }}>
                Học kỳ
              </Text>
              <Select
                value={term}
                onChange={setTerm}
                style={{ minWidth: 140 }}
                size="middle"
                options={TERMS}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ marginBottom: 24, borderRadius: 16 }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 12 }}>
              <Text type="secondary">Số học sinh</Text>
              <div>
                <Text strong style={{ fontSize: 24 }}>
                  {students.length}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 12 }}>
              <Text type="secondary">Môn hiện tại</Text>
              <div>
                <Text strong style={{ fontSize: 18 }}>
                  {currentSubject}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 12 }}>
              <Text type="secondary">Hoàn thành nhập điểm</Text>
              <div>
                <Text strong style={{ fontSize: 18, color: "#22c55e" }}>
                  {completionPercent}%
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              bodyStyle={{
                padding: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              style={{ borderRadius: 12 }}
            >
              <Tooltip title="Lưu các điểm đã nhập/điều chỉnh">
                <Button
                  type="primary"
                  icon={<FaSave />}
                  onClick={handleSave}
                  loading={saving}
                  disabled={!selectedClassId || !selectedSubjectId}
                  style={{
                    background: "linear-gradient(135deg, #52c41a, #73d13d)",
                    border: "none",
                    borderRadius: 8,
                  }}
                >
                  Lưu điểm
                </Button>
              </Tooltip>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 24 }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Spin size="large" />
          </div>
        ) : !students.length ? (
          <Empty description="Không có học sinh trong lớp này" />
        ) : !selectedSubjectId ? (
          <Empty description="Giáo viên chưa được phân công môn nào trong lớp này" />
        ) : (
          <Table
            columns={columns}
            dataSource={students}
            rowKey="id"
            pagination={{ pageSize: 12, showSizeChanger: false }}
          />
        )}
      </Card>
    </div>
  );
}
