import React, { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Tag,
  Tooltip,
} from "antd";
import {
  getAllParents,
  updateParent,
  deleteParent,
} from "../services/parentService";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUser,
  FaPhone,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaSearch,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const Parents = () => {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const data = await getAllParents();
      setParents(data);
    } catch (err) {
      message.error("Lỗi tải danh sách phụ huynh");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchParents();
  }, []);

  // Lọc danh sách phụ huynh theo tìm kiếm
  const filteredParents = parents.filter((parent) => {
    const name = parent.name || "";
    const phoneNumber = parent.phoneNumber || "";
    const studentName = parent.studentName || "";

    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneNumber.includes(searchQuery) ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleAddParent = () => {
    setEditingParent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingParent(record);
    form.setFieldsValue({
      name: record.name,
      phoneNumber: record.phoneNumber,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteParent(id);
      message.success("Đã xóa phụ huynh");
      fetchParents();
    } catch {
      message.error("Lỗi xóa phụ huynh");
    }
    setLoading(false);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingParent) {
        await updateParent(editingParent.id, {
          name: values.name,
          phoneNumber: values.phoneNumber,
        });
        message.success("Cập nhật thành công");
      } else {
        // Add new parent logic here if needed
        message.success("Thêm mới thành công");
      }

      setModalVisible(false);
      fetchParents();
    } catch (err) {
      // validation error
    }
    setLoading(false);
  };

  // Card view cho mobile
  const ParentCard = ({ parent }) => (
    <div style={styles.mobileCard}>
      <div style={styles.mobileCardHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.mobileAvatar}>
            <FaUser size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.mobileCardName}>{parent.name}</div>
            <div style={styles.mobileCardPhone}>
              <FaPhone style={{ marginRight: 6 }} />
              {parent.phoneNumber}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            icon={<FaEdit />}
            size="small"
            style={styles.mobileEditBtn}
            onClick={() => handleEdit(parent)}
          />
          <Popconfirm
            title="Bạn chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(parent.id)}
          >
            <Button
              icon={<FaTrash />}
              size="small"
              style={styles.mobileDeleteBtn}
            />
          </Popconfirm>
        </div>
      </div>

      <div style={styles.mobileCardInfo}>
        <div style={styles.mobileInfoRow}>
          <FaUserGraduate style={{ color: "#1976d2", marginRight: 8 }} />
          <span>
            <strong>Học sinh:</strong> {parent.studentName || "Chưa cập nhật"}
          </span>
        </div>
        <div style={styles.mobileInfoRow}>
          <FaChalkboardTeacher style={{ color: "#43a047", marginRight: 8 }} />
          <span>
            <strong>Lớp:</strong> {parent.studentClass || "Chưa cập nhật"}
          </span>
        </div>
      </div>
    </div>
  );

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
        <Header title="Quản lý Phụ huynh" />
        <main style={{ padding: isMobile ? "15px" : "20px 40px 40px 40px" }}>
          {/* Header Section */}
          <div style={styles.headerSection}>
            <h2 style={styles.pageTitle}>
              Danh sách Phụ huynh ({filteredParents.length})
            </h2>
            <button onClick={handleAddParent} style={styles.addButton}>
              <FaPlus /> Thêm phụ huynh
            </button>
          </div>

          {/* Search Section */}
          <div style={styles.searchSection}>
            <div style={styles.searchContainer}>
              <FaSearch style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại hoặc tên học sinh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={styles.loadingContainer}>Đang tải dữ liệu...</div>
          ) : (
            <>
              {isMobile ? (
                <div style={styles.mobileContainer}>
                  {filteredParents.length === 0 ? (
                    <div style={styles.emptyMessage}>
                      Không tìm thấy phụ huynh nào.
                    </div>
                  ) : (
                    filteredParents.map((parent) => (
                      <ParentCard key={parent.id} parent={parent} />
                    ))
                  )}
                </div>
              ) : (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.tableHeader, width: "50px" }}>
                          #
                        </th>
                        <th style={{ ...styles.tableHeader, width: "70px" }}>
                          Avatar
                        </th>
                        <th style={styles.tableHeader}>Họ tên</th>
                        <th style={styles.tableHeader}>Số điện thoại</th>
                        <th style={styles.tableHeader}>Tên học sinh</th>
                        <th style={styles.tableHeader}>Lớp</th>
                        <th style={{ ...styles.tableHeader, width: "120px" }}>
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParents.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={styles.emptyTableCell}>
                            Không tìm thấy phụ huynh nào.
                          </td>
                        </tr>
                      ) : (
                        filteredParents.map((parent, index) => (
                          <tr key={parent.id} style={styles.tableRow}>
                            <td
                              style={{
                                ...styles.tableCell,
                                textAlign: "center",
                              }}
                            >
                              {index + 1}
                            </td>
                            <td style={styles.tableCell}>
                              <div style={styles.avatarPlaceholder}>
                                <FaUser size={16} />
                              </div>
                            </td>
                            <td style={styles.tableCell}>
                              <div style={styles.parentName}>{parent.name}</div>
                            </td>
                            <td style={styles.tableCell}>
                              <Tag color="blue" style={styles.phoneTag}>
                                <FaPhone style={{ marginRight: 4 }} />
                                {parent.phoneNumber}
                              </Tag>
                            </td>
                            <td style={styles.tableCell}>
                              <Tag color="green" style={styles.studentTag}>
                                <FaUserGraduate style={{ marginRight: 4 }} />
                                {parent.studentName || "Chưa cập nhật"}
                              </Tag>
                            </td>
                            <td style={styles.tableCell}>
                              <Tag color="orange" style={styles.classTag}>
                                <FaChalkboardTeacher
                                  style={{ marginRight: 4 }}
                                />
                                {parent.studentClass || "Chưa cập nhật"}
                              </Tag>
                            </td>
                            <td
                              style={{
                                ...styles.tableCell,
                                textAlign: "center",
                              }}
                            >
                              <div style={styles.actionButtons}>
                                <Tooltip title="Chỉnh sửa">
                                  <button
                                    onClick={() => handleEdit(parent)}
                                    style={{
                                      ...styles.actionButton,
                                      ...styles.editButton,
                                    }}
                                  >
                                    <FaEdit />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Xóa">
                                  <Popconfirm
                                    title="Bạn chắc chắn muốn xóa?"
                                    onConfirm={() => handleDelete(parent.id)}
                                  >
                                    <button
                                      style={{
                                        ...styles.actionButton,
                                        ...styles.deleteButton,
                                      }}
                                    >
                                      <FaTrash />
                                    </button>
                                  </Popconfirm>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal */}
      <Modal
        title={editingParent ? "Cập nhật phụ huynh" : "Thêm phụ huynh mới"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText={editingParent ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        confirmLoading={loading}
        maskClosable={false}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Họ tên"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Nhập họ tên phụ huynh" />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="phoneNumber"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Styles object
const styles = {
  headerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },
  pageTitle: {
    color: "#333",
    fontSize: "24px",
    margin: 0,
    fontWeight: "600",
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  searchSection: {
    marginBottom: "20px",
  },
  searchContainer: {
    position: "relative",
    maxWidth: "400px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#aaa",
  },
  searchInput: {
    width: "100%",
    padding: "10px 15px 10px 40px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "50px",
    fontSize: "16px",
    color: "#666",
  },
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
  emptyTableCell: {
    textAlign: "center",
    padding: "30px",
    color: "#999",
    fontStyle: "italic",
  },
  avatarPlaceholder: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e3f0ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1976d2",
  },
  parentName: {
    fontWeight: "500",
    color: "#333",
  },
  phoneTag: {
    fontSize: "13px",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  studentTag: {
    fontSize: "13px",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  classTag: {
    fontSize: "13px",
    padding: "4px 8px",
    borderRadius: "6px",
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
  editButton: {
    backgroundColor: "#e6f7e6",
    color: "#28a745",
  },
  deleteButton: {
    backgroundColor: "#ffebeb",
    color: "#dc3545",
  },
  emptyMessage: {
    textAlign: "center",
    padding: "40px",
    color: "#999",
    fontStyle: "italic",
    fontSize: "16px",
  },
  // Mobile styles
  mobileContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  mobileCard: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  mobileCardHeader: {
    padding: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #f0f0f0",
  },
  mobileAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#e3f0ff",
    color: "#1976d2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileCardName: {
    fontWeight: 600,
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  mobileCardPhone: {
    fontSize: 13,
    color: "#666",
    display: "flex",
    alignItems: "center",
  },
  mobileEditBtn: {
    background: "#e6f7e6",
    color: "#28a745",
    border: "none",
  },
  mobileDeleteBtn: {
    background: "#ffebeb",
    color: "#dc3545",
    border: "none",
  },
  mobileCardInfo: {
    padding: "12px 15px",
    background: "#fafbfc",
  },
  mobileInfoRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
    fontSize: 14,
  },
};

export default Parents;
