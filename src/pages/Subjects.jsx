import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaBook,
  FaUsers,
  FaToggleOn,
  FaToggleOff,
  FaEye,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SubjectDetailModal from "../components/SubjectDetailModal";
import * as subjectService from "../services/subjectService";
import {
  message,
  Modal,
  Form,
  Input,
  Spin,
  Tooltip,
  Tag,
  Switch,
  Select,
} from "antd";

const { TextArea } = Input;
const { Option } = Select;

// CSS Styles
const styles = {
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "15px",
  },
  tableHeader: {
    background: "linear-gradient(90deg, #e3f0ff, #f8fbff)",
    color: "#1976d2",
    fontWeight: 600,
    padding: "14px 16px",
    textAlign: "left",
    borderBottom: "2px solid #e3eaf5",
  },
  tableRow: {
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#f5f9ff",
    },
  },
  tableCell: {
    padding: "12px 16px",
    borderBottom: "1px solid #edf2f7",
    color: "#333",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  },
  actionButton: {
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  viewButton: {
    backgroundColor: "#e3f0ff",
    color: "#1976d2",
  },
  editButton: {
    backgroundColor: "#e6f7e6",
    color: "#28a745",
  },
  deleteButton: {
    backgroundColor: "#ffebeb",
    color: "#dc3545",
  },
  toggleButton: {
    backgroundColor: "#fff3e0",
    color: "#ff9800",
  },
};

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSubjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterSubjects();
  }, [subjects, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch (error) {
      message.error("Không thể tải danh sách môn học");
      console.error("Error fetching subjects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubjects = () => {
    let filtered = subjects;

    if (searchTerm) {
      filtered = filtered.filter(
        (subject) =>
          subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubjects(filtered);
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      credits: 1,
      duration: 1,
    });
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setIsModalVisible(true);
    form.setFieldsValue({
      ...subject,
      objectives: subject.objectives?.join("\n") || "",
      gradeLevel: subject.gradeLevel || [], // Ensure gradeLevel is properly set
    });
  };

  const handleViewSubject = async (subject) => {
    try {
      const fullSubjectData = await subjectService.getSubjectById(subject.id);
      setSelectedSubject(fullSubjectData);
      setIsDetailModalVisible(true);
    } catch (error) {
      message.error("Không thể tải thông tin chi tiết môn học");
    }
  };

  const handleDeleteSubject = (subject) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa môn học "${subject.name}"?`,
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          await subjectService.deleteSubject(subject.id);
          message.success("Xóa môn học thành công");
          fetchSubjects();
        } catch (error) {
          message.error(error.message || "Không thể xóa môn học");
        }
      },
    });
  };

  const handleToggleStatus = async (subject) => {
    try {
      await subjectService.toggleSubjectStatus(subject.id, !subject.isActive);
      message.success(
        `${subject.isActive ? "Vô hiệu hóa" : "Kích hoạt"} môn học thành công`
      );
      fetchSubjects();
    } catch (error) {
      message.error("Không thể thay đổi trạng thái môn học");
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Xử lý objectives
      const objectives = values.objectives
        ? values.objectives.split("\n").filter((obj) => obj.trim())
        : [];

      const subjectData = {
        ...values,
        objectives,
      };

      if (editingSubject) {
        await subjectService.updateSubject(editingSubject.id, subjectData);
        message.success("Cập nhật môn học thành công");
      } else {
        await subjectService.addSubject(subjectData);
        message.success("Thêm môn học thành công");
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchSubjects();
    } catch (error) {
      message.error(error.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
      }}
    >
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <div style={{ padding: "24px" }}>
          {/* Header Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#1976d2",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <FaBook />
                Quản lý môn học
              </h1>
              <p style={{ color: "#666", margin: "4px 0 0 0" }}>
                Quản lý thông tin các môn học trong hệ thống
              </p>
            </div>
            <button
              onClick={handleAddSubject}
              style={{
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#1565c0")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#1976d2")}
            >
              <FaPlus />
              Thêm môn học
            </button>
          </div>

          {/* Search Section */}
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
              marginBottom: "24px",
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999",
                }}
              />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên môn học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  border: "2px solid #e1e8ed",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1976d2")}
                onBlur={(e) => (e.target.style.borderColor = "#e1e8ed")}
              />
            </div>
          </div>

          {/* Stats Section */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#e3f0ff",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                <FaBook style={{ color: "#1976d2", fontSize: "24px" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "24px", color: "#1976d2" }}>
                  {filteredSubjects.length}
                </h3>
                <p style={{ margin: 0, color: "#666" }}>Tổng môn học</p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#e6f7e6",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                <FaUsers style={{ color: "#28a745", fontSize: "24px" }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "24px", color: "#28a745" }}>
                  {filteredSubjects.filter((s) => s.isActive).length}
                </h3>
                <p style={{ margin: 0, color: "#666" }}>Đang hoạt động</p>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div style={styles.tableContainer}>
            <Spin spinning={loading}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Tên môn học</th>
                    <th style={styles.tableHeader}>Mã môn học</th>
                    <th style={styles.tableHeader}>Mô tả</th>
                    <th style={styles.tableHeader}>Khối học</th>
                    <th style={styles.tableHeader}>Số giáo viên</th>
                    <th style={styles.tableHeader}>Trạng thái</th>
                    <th style={styles.tableHeader}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr
                      key={subject.id}
                      style={styles.tableRow}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f9ff")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td style={styles.tableCell}>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#1976d2",
                              marginBottom: "4px",
                            }}
                          >
                            {subject.name}
                          </div>
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <code
                          style={{
                            backgroundColor: "#f5f5f5",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        >
                          {subject.code || "N/A"}
                        </code>
                      </td>
                      <td style={styles.tableCell}>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#666",
                            lineHeight: "1.4",
                            maxWidth: "300px",
                          }}
                        >
                          {subject.description ? (
                            subject.description.length > 80 ? (
                              `${subject.description.substring(0, 80)}...`
                            ) : (
                              subject.description
                            )
                          ) : (
                            <span
                              style={{ fontStyle: "italic", color: "#999" }}
                            >
                              Chưa có mô tả
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <div
                          style={{
                            display: "flex",
                            gap: "4px",
                            flexWrap: "wrap",
                          }}
                        >
                          {subject.gradeLevel ? (
                            Array.isArray(subject.gradeLevel) ? (
                              subject.gradeLevel.map((grade) => (
                                <Tag
                                  key={grade}
                                  color="blue"
                                  style={{ fontSize: "11px", margin: "1px" }}
                                >
                                  Khối {grade}
                                </Tag>
                              ))
                            ) : (
                              <Tag color="blue" style={{ fontSize: "11px" }}>
                                Khối {subject.gradeLevel}
                              </Tag>
                            )
                          ) : (
                            <span
                              style={{
                                fontStyle: "italic",
                                color: "#999",
                                fontSize: "12px",
                              }}
                            >
                              Chưa xác định
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            backgroundColor: "#e3f0ff",
                            color: "#1976d2",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {subject.teacherCount || 0} GV
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <Tag color={subject.isActive ? "green" : "red"}>
                          {subject.isActive ? "Hoạt động" : "Không hoạt động"}
                        </Tag>
                      </td>
                      <td style={styles.tableCell}>
                        <div style={styles.actionButtons}>
                          <Tooltip title="Xem chi tiết">
                            <button
                              style={{
                                ...styles.actionButton,
                                ...styles.viewButton,
                              }}
                              onClick={() => handleViewSubject(subject)}
                            >
                              <FaEye />
                            </button>
                          </Tooltip>
                          <Tooltip title="Kích hoạt/Vô hiệu hóa">
                            <button
                              style={{
                                ...styles.actionButton,
                                ...styles.toggleButton,
                              }}
                              onClick={() => handleToggleStatus(subject)}
                            >
                              {subject.isActive ? (
                                <FaToggleOn />
                              ) : (
                                <FaToggleOff />
                              )}
                            </button>
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa">
                            <button
                              style={{
                                ...styles.actionButton,
                                ...styles.editButton,
                              }}
                              onClick={() => handleEditSubject(subject)}
                            >
                              <FaEdit />
                            </button>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <button
                              style={{
                                ...styles.actionButton,
                                ...styles.deleteButton,
                              }}
                              onClick={() => handleDeleteSubject(subject)}
                            >
                              <FaTrash />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSubjects.length === 0 && !loading && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#666",
                  }}
                >
                  <FaBook style={{ fontSize: "48px", marginBottom: "16px" }} />
                  <div>Không tìm thấy môn học nào</div>
                </div>
              )}
            </Spin>
          </div>
        </div>
      </div>

      {/* Modal Add/Edit Subject */}
      <Modal
        title={editingSubject ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Tên môn học"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên môn học" }]}
          >
            <Input placeholder="Nhập tên môn học" />
          </Form.Item>

          {editingSubject && (
            <Form.Item
              label="Mã môn học"
              name="code"
              rules={[{ required: true, message: "Vui lòng nhập mã môn học" }]}
            >
              <Input placeholder="Nhập mã môn học" disabled />
            </Form.Item>
          )}

          {!editingSubject && (
            <div
              style={{
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#0369a1",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ℹ️ <strong>Mã môn học sẽ được tạo tự động</strong> dựa trên tên
                môn học và thời gian hiện tại
              </div>
            </div>
          )}

          <Form.Item label="Mô tả môn học" name="description">
            <TextArea
              rows={4}
              placeholder="Nhập mô tả môn học (có thể để trống)"
            />
          </Form.Item>

          <Form.Item
            label="Khối học"
            name="gradeLevel"
            rules={[{ required: true, message: "Vui lòng chọn khối học" }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn khối học (có thể chọn nhiều khối)"
              style={{ width: "100%" }}
              allowClear
            >
              <Option value={1}>Khối 1</Option>
              <Option value={2}>Khối 2</Option>
              <Option value={3}>Khối 3</Option>
              <Option value={4}>Khối 4</Option>
              <Option value={5}>Khối 5</Option>
            </Select>
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Switch />
              <span>Kích hoạt môn học</span>
            </div>
          </Form.Item>

          {!editingSubject && (
            <div
              style={{
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#0369a1",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ℹ️ <strong>Mã môn học sẽ được tạo tự động</strong> dựa trên tên
                môn học và thời gian hiện tại
              </div>
            </div>
          )}

          <Form.Item name="isActive" valuePropName="checked">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Switch />
              <span>Kích hoạt môn học</span>
            </div>
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: "24px" }}>
            <button
              type="button"
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}
              style={{
                marginRight: "12px",
                padding: "8px 16px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: "6px",
                backgroundColor: "#1976d2",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
              }}
              disabled={loading}
            >
              {loading
                ? "Đang xử lý..."
                : editingSubject
                ? "Cập nhật"
                : "Thêm mới"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Subject Detail Modal */}
      <SubjectDetailModal
        subject={selectedSubject}
        visible={isDetailModalVisible}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedSubject(null);
        }}
      />
    </div>
  );
};

export default Subjects;
