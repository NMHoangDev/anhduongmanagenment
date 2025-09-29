import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  FaPlus,
  FaUserTie,
  FaExchangeAlt,
  FaChartBar,
  FaUserCheck,
  FaUserTimes,
} from "react-icons/fa";
import {
  message,
  Modal,
  Select,
  Button,
  Tabs,
  Card,
  Statistic,
  Row,
  Col,
  Space,
  Tag,
  Popconfirm,
  Table,
} from "antd";
import * as classesService from "../services/adminServices/classesService";
import * as teacherService from "../services/adminServices/teacherService";
import ClassEditModal from "../components/ClassEditModal";
import ClassTable from "../components/ClassTable";

const { Option } = Select;
const { TabPane } = Tabs;

export default function ClassListPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // GVCN Management States
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [classesWithoutHRT, setClassesWithoutHRT] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState({});
  const [hrtLoading, setHrtLoading] = useState(false);

  // Modal / selection states for phân công GVCN
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState(null);
  const [selectedTeacherForAssign, setSelectedTeacherForAssign] =
    useState(null);

  // Modal / selection states for chuyển đổi GVCN
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedClassForTransfer, setSelectedClassForTransfer] =
    useState(null);
  const [selectedNewTeacher, setSelectedNewTeacher] = useState(null);

  // Teaching assignments (giảng dạy)
  const [subjects, setSubjects] = useState([]);
  const [teachingAssignments, setTeachingAssignments] = useState([]);
  const [isTeachingAssignModalOpen, setIsTeachingAssignModalOpen] =
    useState(false);
  const [selectedClassForTeaching, setSelectedClassForTeaching] =
    useState(null);
  const [selectedTeacherForTeaching, setSelectedTeacherForTeaching] =
    useState(null);
  const [selectedSubjectForTeaching, setSelectedSubjectForTeaching] =
    useState(null);
  const [teachingLoading, setTeachingLoading] = useState(false);

  // Teaching assignments UI per-class
  const [
    selectedClassTeachingAssignments,
    setSelectedClassTeachingAssignments,
  ] = useState([]);
  const [loadingClassTeachingAssignments, setLoadingClassTeachingAssignments] =
    useState(false);
  const openTeachingAssignForClass = (classId) => {
    setSelectedClassForTeaching(classId);
    setIsTeachingAssignModalOpen(true);
  };
  const fetchTeachingAssignmentsForClass = async (classId) => {
    if (!classId) {
      setSelectedClassTeachingAssignments([]);
      return;
    }
    setLoadingClassTeachingAssignments(true);
    try {
      const list = await classesService.getTeachingAssignmentsByClass(classId);
      setSelectedClassTeachingAssignments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching teaching assignments for class:", err);
      setSelectedClassTeachingAssignments([]);
    } finally {
      setLoadingClassTeachingAssignments(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchHRTData();
    fetchSubjects();
    fetchTeachingAssignments();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await classesService.getAllClassesWithHomeRoomTeacher();
      console.log("Fetched classes:", data);

      // Lấy thông tin chi tiết giáo viên cho từng lớp
      const classesWithTeacherInfo = await Promise.all(
        data.map(async (cls) => {
          if (cls.teacher && typeof cls.teacher === "string") {
            try {
              const teacher = await teacherService.getTeacherById(cls.teacher);
              return {
                ...cls,
                teacher: teacher || { id: cls.teacher, name: "Không tìm thấy" },
              };
            } catch (error) {
              console.error(`Error fetching teacher ${cls.teacher}:`, error);
              return {
                ...cls,
                teacher: { id: cls.teacher, name: "Lỗi tải thông tin" },
              };
            }
          }
          return cls;
        })
      );

      setClasses(classesWithTeacherInfo);
    } catch (error) {
      console.error("Error fetching classes:", error);
      message.error("Có lỗi xảy ra khi tải danh sách lớp học!");
    }
    setLoading(false);
  };

  // Fetch dữ liệu GVCN
  const fetchHRTData = async () => {
    setHrtLoading(true);
    try {
      const [teachersData, classesData, assignmentsData, statsData] =
        await Promise.all([
          classesService.getAvailableHomeRoomTeachers(true),
          classesService.getClassesWithoutHomeRoomTeacher(),
          classesService.getAllClassAssignments(),
          classesService.getHomeRoomAssignmentStats(),
        ]);

      setAvailableTeachers(teachersData);
      setClassesWithoutHRT(classesData);
      setAssignments(assignmentsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching HRT data:", error);
    }
    setHrtLoading(false);
  };

  // Subjects list
  const fetchSubjects = async () => {
    try {
      const subs = await classesService.getAllSubjects();
      setSubjects(subs);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
  };

  // Teaching assignments list
  const fetchTeachingAssignments = async () => {
    setTeachingLoading(true);
    try {
      const all = await classesService.getAllClassAssignments();

      let teach = [];

      if (Array.isArray(all) && all.length > 0) {
        // case A: service returned classes with teachingAssignments array
        if (all[0].teachingAssignments) {
          teach = all
            .flatMap((a) => a.teachingAssignments || [])
            .map((t) => ({
              teacherId: t.teacherId,
              classId: t.classId,
              subjectId: t.subjectId,
              assignedAt: t.assignedAt || t.assignedAtTimestamp || null,
              assignedBy: t.assignedBy || null,
              id: `${t.classId}_${t.teacherId}_${t.subjectId}`,
            }));
        } else {
          // case B: service returned flat assignment records (e.g. collection classAssignments)
          teach = all
            .filter(
              (r) =>
                r &&
                (r.type === "teaching" ||
                  (r.classId && r.teacherId && r.subjectId))
            )
            .map((r) => ({
              teacherId: r.teacherId,
              classId: r.classId,
              subjectId: r.subjectId,
              assignedAt: r.assignedAt || r.assignedAtTimestamp || null,
              assignedBy: r.assignedBy || null,
              id: `${r.classId}_${r.teacherId}_${r.subjectId}`,
            }));
        }
      }

      setTeachingAssignments(teach);
    } catch (err) {
      console.error("Error fetching teaching assignments:", err);
      setTeachingAssignments([]);
    } finally {
      setTeachingLoading(false);
    }
  };

  // Phân công GVCN
  const handleAssignHomeRoomTeacher = async () => {
    if (!selectedClassForAssign || !selectedTeacherForAssign) {
      message.error("Vui lòng chọn lớp và giáo viên!");
      return;
    }

    try {
      setHrtLoading(true);
      await classesService.assignHomeRoomTeacher(
        selectedTeacherForAssign,
        selectedClassForAssign,
        "admin" // currentUser ID
      );
      message.success("Phân công giáo viên chủ nhiệm thành công!");
      setIsAssignModalOpen(false);
      setSelectedClassForAssign(null);
      setSelectedTeacherForAssign(null);
      await Promise.all([fetchClasses(), fetchHRTData()]);
    } catch (error) {
      message.error("Lỗi khi phân công: " + error.message);
    } finally {
      setHrtLoading(false);
    }
  };

  // Chuyển đổi GVCN
  const handleTransferHomeRoomTeacher = async () => {
    if (!selectedClassForTransfer || !selectedNewTeacher) {
      message.error("Vui lòng chọn đầy đủ thông tin!");
      return;
    }

    try {
      setHrtLoading(true);
      const assignment = assignments.find(
        (a) => a.classId === selectedClassForTransfer
      );
      if (assignment) {
        await classesService.transferHomeRoomTeacher(
          assignment.teacherId,
          selectedNewTeacher,
          selectedClassForTransfer,
          "admin"
        );
        message.success("Chuyển đổi giáo viên chủ nhiệm thành công!");
        setIsTransferModalOpen(false);
        setSelectedClassForTransfer(null);
        setSelectedNewTeacher(null);
        await Promise.all([fetchClasses(), fetchHRTData()]);
      }
    } catch (error) {
      message.error("Lỗi khi chuyển đổi: " + error.message);
    } finally {
      setHrtLoading(false);
    }
  };

  // Hủy phân công GVCN
  const handleUnassignHomeRoomTeacher = async (teacherId, classId) => {
    try {
      setHrtLoading(true);
      await classesService.unassignHomeRoomTeacher(teacherId, classId);
      message.success("Hủy phân công thành công!");
      await Promise.all([fetchClasses(), fetchHRTData()]);
    } catch (error) {
      message.error("Lỗi khi hủy phân công: " + error.message);
    } finally {
      setHrtLoading(false);
    }
  };

  const handleOpenEditModal = (classData = null) => {
    setEditingClass(classData);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingClass(null);
  };

  const handleSaveClass = async (formData) => {
    try {
      if (editingClass) {
        await classesService.updateClass(editingClass.id, formData);
        message.success("Cập nhật lớp học thành công!");
      } else {
        const classId = `class_${Date.now()}`;
        await classesService.createClass(classId, formData);
        message.success("Thêm lớp học mới thành công!");
      }
      fetchClasses();
      handleCloseEditModal();
    } catch (error) {
      console.error("Error saving class:", error);
      message.error("Có lỗi xảy ra khi lưu lớp học!");
    }
  };

  const handleDeleteClass = async (classId) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa lớp học này không? Hành động này sẽ xóa cả học sinh thuộc lớp này!"
      )
    ) {
      try {
        await classesService.deleteClass(classId);
        fetchClasses();
        message.success("Xóa lớp học thành công!");
      } catch (error) {
        console.error("Error deleting class:", error);
        message.error("Có lỗi xảy ra khi xóa lớp học!");
      }
    }
  };

  const handleViewClass = (classData) => {
    setSelectedClass(classData);
    // load teaching assignments for this class
    fetchTeachingAssignmentsForClass(classData?.id);
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.teacher?.name &&
        cls.teacher.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cls.homeRoomTeacher?.name &&
        cls.homeRoomTeacher.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  // Teaching assignment handlers
  const openTeachingAssignModal = () => {
    setSelectedClassForTeaching(null);
    setSelectedTeacherForTeaching(null);
    setSelectedSubjectForTeaching(null);
    setIsTeachingAssignModalOpen(true);
  };

  const handleAssignTeaching = async () => {
    if (
      !selectedClassForTeaching ||
      !selectedTeacherForTeaching ||
      !selectedSubjectForTeaching
    ) {
      message.error("Vui lòng chọn lớp, giáo viên và môn học.");
      return;
    }
    try {
      setTeachingLoading(true);
      await classesService.assignTeachingTeacher(
        selectedTeacherForTeaching,
        selectedClassForTeaching,
        selectedSubjectForTeaching,
        "admin"
      );
      message.success("Phân công giảng dạy thành công.");
      setIsTeachingAssignModalOpen(false);
      await Promise.all([fetchClasses(), fetchTeachingAssignments()]);
    } catch (err) {
      console.error("Error assigning teaching:", err);
      message.error("Lỗi khi phân công giảng dạy: " + (err.message || ""));
    } finally {
      setTeachingLoading(false);
    }
  };

  const handleUnassignTeaching = async (teacherId, classId, subjectId) => {
    if (!teacherId || !classId || !subjectId) return;
    try {
      setTeachingLoading(true);
      await classesService.unassignTeachingTeacher(
        teacherId,
        classId,
        subjectId
      );
      message.success("Hủy phân công giảng dạy thành công.");
      await Promise.all([fetchClasses(), fetchTeachingAssignments()]);
    } catch (err) {
      console.error("Error unassigning teaching:", err);
      message.error("Lỗi khi hủy phân công giảng dạy: " + (err.message || ""));
    } finally {
      setTeachingLoading(false);
    }
  };

  // Columns for teaching assignments table
  const teachingColumns = [
    {
      title: "Lớp",
      dataIndex: "classId",
      key: "classId",
      render: (cid) => {
        const cls = classes.find((c) => c.id === cid);
        return cls ? `${cls.name} (${cls.grade})` : cid;
      },
    },
    {
      title: "Môn học",
      dataIndex: "subjectId",
      key: "subjectId",
      render: (sid) => {
        const s = subjects.find((x) => x.id === sid);
        return s ? s.name : sid;
      },
    },
    {
      title: "Giáo viên",
      dataIndex: "teacherId",
      key: "teacherId",
      render: (tid) => {
        const t = availableTeachers.find((x) => x.id === tid);
        return t ? t.name : tid;
      },
    },
    {
      title: "Ngày phân công",
      dataIndex: "assignedAt",
      key: "assignedAt",
      render: (ts) =>
        ts && ts.toDate ? ts.toDate().toLocaleString("vi-VN") : "-",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Hủy phân công này?"
          onConfirm={() =>
            handleUnassignTeaching(
              record.teacherId,
              record.classId,
              record.subjectId
            )
          }
          okText="Có"
          cancelText="Không"
        >
          <Button danger size="small">
            Hủy
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f6f6fa" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <Header title="Quản lý Lớp học & GVCN" />
        <main style={{ padding: "20px 40px 40px 40px" }}>
          {/* Statistics Cards for GVCN */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tổng số lớp"
                  value={stats.totalClasses || 0}
                  prefix={<FaChartBar />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Đã có GVCN"
                  value={stats.assignedClasses || 0}
                  prefix={<FaUserCheck />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Chưa có GVCN"
                  value={stats.unassignedClasses || 0}
                  prefix={<FaUserTimes />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Tỷ lệ phân công"
                  value={stats.assignmentRate || 0}
                  suffix="%"
                  prefix={<FaUserTie />}
                  valueStyle={{
                    color:
                      (stats.assignmentRate || 0) > 80
                        ? "#52c41a"
                        : (stats.assignmentRate || 0) > 50
                        ? "#faad14"
                        : "#ff4d4f",
                  }}
                />
              </Card>
            </Col>
          </Row>

          <Tabs defaultActiveKey="classes">
            <TabPane tab="Danh sách lớp học" key="classes">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h2 style={{ color: "#333", fontSize: "24px" }}>
                  Danh sách Lớp học ({filteredClasses.length})
                </h2>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => handleOpenEditModal(null)}
                    style={{
                      color: "white",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      background: "#28a745",
                    }}
                  >
                    <FaPlus /> Thêm lớp học
                  </button>
                </div>
              </div>
              <div
                style={{ marginBottom: "20px", display: "flex", gap: "15px" }}
              >
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên lớp, giáo viên hoặc GVCN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 15px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "15px",
                  }}
                />
              </div>
              {loading ? (
                <p style={{ textAlign: "center", padding: "50px" }}>
                  Đang tải danh sách lớp học...
                </p>
              ) : (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                >
                  <ClassTable
                    classes={filteredClasses}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteClass}
                    onView={handleViewClass}
                  />
                </div>
              )}
              {selectedClass && (
                <div style={{ marginTop: "30px" }}>
                  <h3 style={{ fontSize: "20px", color: "#007bff" }}>
                    Chi tiết lớp: {selectedClass.name}
                  </h3>
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Khối:</strong> {selectedClass.grade} &nbsp;|&nbsp;
                    <strong>Giáo viên chủ nhiệm:</strong>{" "}
                    {selectedClass.homeRoomTeacher?.name || "Chưa có"}{" "}
                    &nbsp;|&nbsp;
                    <strong>Cơ sở:</strong> {selectedClass.facility}
                  </div>
                  <div>
                    <strong>Danh sách học sinh:</strong>
                    <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
                      {(selectedClass.studentsDetails || []).map(
                        (student, idx) => (
                          <li key={student.id || idx}>
                            {student.name
                              ? `${student.name}${
                                  student.grade ? ` - Lớp ${student.grade}` : ""
                                }`
                              : `Không tìm thấy thông tin cho học sinh ID: ${student.id}`}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <strong>Phân công giảng dạy (Lớp này)</strong>
                      <div>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() =>
                            openTeachingAssignForClass(selectedClass.id)
                          }
                        >
                          Phân công giảng dạy cho lớp này
                        </Button>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      {loadingClassTeachingAssignments ? (
                        <div>Đang tải phân công...</div>
                      ) : selectedClassTeachingAssignments.length === 0 ? (
                        <div style={{ color: "#666" }}>
                          Chưa có phân công giảng dạy cho lớp này.
                        </div>
                      ) : (
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginTop: 8,
                          }}
                        >
                          <thead>
                            <tr style={{ background: "#fafafa" }}>
                              <th
                                style={{
                                  padding: 8,
                                  textAlign: "left",
                                  borderBottom: "1px solid #eee",
                                }}
                              >
                                Môn
                              </th>
                              <th
                                style={{
                                  padding: 8,
                                  textAlign: "left",
                                  borderBottom: "1px solid #eee",
                                }}
                              >
                                Giáo viên
                              </th>
                              <th
                                style={{
                                  padding: 8,
                                  textAlign: "left",
                                  borderBottom: "1px solid #eee",
                                }}
                              >
                                Hành động
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedClassTeachingAssignments.map((a, idx) => {
                              const subj = subjects.find(
                                (s) => s.id === a.subjectId
                              );
                              const teacher = availableTeachers.find(
                                (t) => t.id === a.teacherId
                              );
                              return (
                                <tr
                                  key={
                                    a.teacherId + "_" + a.subjectId + "_" + idx
                                  }
                                >
                                  <td
                                    style={{
                                      padding: 8,
                                      borderBottom: "1px solid #f0f0f0",
                                    }}
                                  >
                                    {subj ? subj.name : a.subjectId}
                                  </td>
                                  <td
                                    style={{
                                      padding: 8,
                                      borderBottom: "1px solid #f0f0f0",
                                    }}
                                  >
                                    {teacher ? teacher.name : a.teacherId}
                                  </td>
                                  <td
                                    style={{
                                      padding: 8,
                                      borderBottom: "1px solid #f0f0f0",
                                    }}
                                  >
                                    <Popconfirm
                                      title="Hủy phân công giảng dạy này?"
                                      onConfirm={() =>
                                        handleUnassignTeaching(
                                          a.teacherId,
                                          selectedClass.id,
                                          a.subjectId
                                        )
                                      }
                                      okText="Có"
                                      cancelText="Không"
                                    >
                                      <Button size="small" danger>
                                        Hủy
                                      </Button>
                                    </Popconfirm>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabPane>

            <TabPane
              tab={`Phân công GVCN (${assignments.length})`}
              key="assignments"
            >
              <div style={{ marginBottom: "20px" }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<FaPlus />}
                    onClick={() => setIsAssignModalOpen(true)}
                    disabled={classesWithoutHRT.length === 0}
                  >
                    Phân công mới
                  </Button>
                  <Button onClick={fetchHRTData} loading={hrtLoading}>
                    Làm mới
                  </Button>
                </Space>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                        }}
                      >
                        Lớp học
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                        }}
                      >
                        GVCN
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                        }}
                      >
                        Ngày phân công
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          border: "1px solid #ddd",
                        }}
                      >
                        Trạng thái
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          border: "1px solid #ddd",
                        }}
                      >
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td
                          style={{ padding: "12px", border: "1px solid #ddd" }}
                        >
                          <div>
                            <strong>{assignment.classInfo?.name}</strong>
                            <br />
                            <small style={{ color: "#666" }}>
                              {assignment.classInfo?.grade} - Cơ sở{" "}
                              {assignment.classInfo?.facility}
                            </small>
                          </div>
                        </td>
                        <td
                          style={{ padding: "12px", border: "1px solid #ddd" }}
                        >
                          <div>
                            <strong>{assignment.teacherInfo?.name}</strong>
                            <br />
                            <small style={{ color: "#666" }}>
                              {assignment.teacherInfo?.email}
                            </small>
                          </div>
                        </td>
                        <td
                          style={{ padding: "12px", border: "1px solid #ddd" }}
                        >
                          {assignment.assignedAt
                            ? new Date(
                                assignment.assignedAt.toDate()
                              ).toLocaleDateString("vi-VN")
                            : "-"}
                        </td>
                        <td
                          style={{ padding: "12px", border: "1px solid #ddd" }}
                        >
                          <Tag
                            color={
                              assignment.status === "active" ? "green" : "red"
                            }
                          >
                            {assignment.status === "active"
                              ? "Đang hoạt động"
                              : "Không hoạt động"}
                          </Tag>
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            border: "1px solid #ddd",
                            textAlign: "center",
                          }}
                        >
                          <Space>
                            <Button
                              size="small"
                              icon={<FaExchangeAlt />}
                              onClick={() => {
                                setSelectedClassForTransfer(assignment.classId);
                                setIsTransferModalOpen(true);
                              }}
                            >
                              Chuyển đổi
                            </Button>
                            <Popconfirm
                              title="Bạn có chắc muốn hủy phân công này?"
                              onConfirm={() =>
                                handleUnassignHomeRoomTeacher(
                                  assignment.teacherId,
                                  assignment.classId
                                )
                              }
                              okText="Có"
                              cancelText="Không"
                            >
                              <Button danger size="small">
                                Hủy
                              </Button>
                            </Popconfirm>
                          </Space>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabPane>

            <TabPane tab={`Phân công giảng dạy`} key="teaching">
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Space>
                  <Button
                    type="primary"
                    icon={<FaPlus />}
                    onClick={openTeachingAssignModal}
                  >
                    Phân công giảng dạy
                  </Button>
                  <Button
                    onClick={fetchTeachingAssignments}
                    loading={teachingLoading}
                  >
                    Làm mới
                  </Button>
                </Space>
              </div>

              <Card style={{ marginBottom: 12 }}>
                <Table
                  dataSource={teachingAssignments}
                  columns={teachingColumns}
                  rowKey={(r) => r.id}
                  loading={teachingLoading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </TabPane>

            <TabPane
              tab={`Lớp chưa có GVCN (${classesWithoutHRT.length})`}
              key="unassigned"
            >
              <div style={{ marginBottom: "20px" }}>
                <h3>Các lớp chưa được phân công giáo viên chủ nhiệm</h3>
              </div>
              <Row gutter={[16, 16]}>
                {classesWithoutHRT.map((cls) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={cls.id}>
                    <Card
                      title={cls.name}
                      extra={
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            setSelectedClassForAssign(cls.id);
                            setIsAssignModalOpen(true);
                          }}
                        >
                          Phân công
                        </Button>
                      }
                    >
                      <p>
                        <strong>Khối:</strong> {cls.grade}
                      </p>
                      <p>
                        <strong>Cơ sở:</strong> {cls.facility}
                      </p>
                      <p>
                        <strong>Học sinh:</strong>{" "}
                        {cls.studentsDetails?.length || 0}
                      </p>
                    </Card>
                  </Col>
                ))}
              </Row>
            </TabPane>
          </Tabs>
        </main>

        {/* Modal phân công GVCN */}
        <Modal
          title="Phân công giáo viên chủ nhiệm"
          open={isAssignModalOpen}
          onOk={handleAssignHomeRoomTeacher}
          onCancel={() => {
            setIsAssignModalOpen(false);
            setSelectedClassForAssign(null);
            setSelectedTeacherForAssign(null);
          }}
          confirmLoading={hrtLoading}
        >
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>
              Chọn lớp:
            </label>
            <Select
              style={{ width: "100%" }}
              value={selectedClassForAssign}
              onChange={setSelectedClassForAssign}
              placeholder="Chọn lớp học"
            >
              {classesWithoutHRT.map((cls) => (
                <Option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.grade} (Cơ sở {cls.facility})
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px" }}>
              Chọn giáo viên:
            </label>
            <Select
              style={{ width: "100%" }}
              value={selectedTeacherForAssign}
              onChange={setSelectedTeacherForAssign}
              placeholder="Chọn giáo viên"
            >
              {availableTeachers
                .filter((teacher) => teacher.currentHomeRoomCount === 0)
                .map((teacher) => (
                  <Option key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.email}
                  </Option>
                ))}
            </Select>
          </div>
        </Modal>

        {/* Modal phân công giảng dạy */}
        <Modal
          title="Phân công giảng dạy"
          open={isTeachingAssignModalOpen}
          onOk={handleAssignTeaching}
          onCancel={() => {
            setIsTeachingAssignModalOpen(false);
            setSelectedClassForTeaching(null);
            setSelectedTeacherForTeaching(null);
            setSelectedSubjectForTeaching(null);
          }}
          confirmLoading={teachingLoading}
        >
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 8 }}>
              Chọn lớp:
            </label>
            <Select
              style={{ width: "100%" }}
              value={selectedClassForTeaching}
              onChange={setSelectedClassForTeaching}
              placeholder="Chọn lớp"
            >
              {classes.map((cls) => (
                <Option key={cls.id} value={cls.id}>
                  {cls.name} - Khối {cls.grade}
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 8 }}>
              Chọn môn:
            </label>
            <Select
              style={{ width: "100%" }}
              value={selectedSubjectForTeaching}
              onChange={setSelectedSubjectForTeaching}
              placeholder="Chọn môn học"
            >
              {subjects.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8 }}>
              Chọn giáo viên:
            </label>
            <Select
              style={{ width: "100%" }}
              value={selectedTeacherForTeaching}
              onChange={setSelectedTeacherForTeaching}
              placeholder="Chọn giáo viên"
            >
              {(availableTeachers || []).map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.name} - {t.email}
                </Option>
              ))}
            </Select>
          </div>
        </Modal>

        {/* Modal chuyển đổi GVCN */}
        <Modal
          title="Chuyển đổi giáo viên chủ nhiệm"
          open={isTransferModalOpen}
          onOk={handleTransferHomeRoomTeacher}
          onCancel={() => {
            setIsTransferModalOpen(false);
            setSelectedClassForTransfer(null);
            setSelectedNewTeacher(null);
          }}
          confirmLoading={hrtLoading}
        >
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px" }}>
              Lớp học:
            </label>
            <Select
              style={{ width: "100%" }}
              value={selectedClassForTransfer}
              onChange={setSelectedClassForTransfer}
              placeholder="Chọn lớp học"
            >
              {assignments.map((assignment) => (
                <Option key={assignment.classId} value={assignment.classId}>
                  {assignment.classInfo?.name} - Hiện tại:{" "}
                  {assignment.teacherInfo?.name}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px" }}>
              Giáo viên mới:
            </label>
            <Select
              style={{ width: "100%" }}
              value={selectedNewTeacher}
              onChange={setSelectedNewTeacher}
              placeholder="Chọn giáo viên mới"
            >
              {availableTeachers.map((teacher) => (
                <Option key={teacher.id} value={teacher.id}>
                  {teacher.name} - {teacher.email}
                  {teacher.currentHomeRoomCount > 0 &&
                    ` (Đang chủ nhiệm ${teacher.currentHomeRoomCount} lớp)`}
                </Option>
              ))}
            </Select>
          </div>
        </Modal>

        {isEditModalOpen && (
          <ClassEditModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            classData={editingClass}
            onSave={handleSaveClass}
          />
        )}
      </div>
    </div>
  );
}
