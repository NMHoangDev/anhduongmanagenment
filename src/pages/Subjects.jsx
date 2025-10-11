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
  FaFilter,
  FaDownload,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SubjectDetailModal from "../components/SubjectDetailModal";
import * as subjectService from "../services/adminServices/subjectService";
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
  Avatar,
} from "antd";
import { useAuth } from "../context/AuthContext";

const { TextArea } = Input;
const { Option } = Select;

const styles = {
  // Layout chính
  mainLayout: {
    display: "flex",
    height: "100vh",
    background: "#f8fafc",
    overflow: "hidden",
  },

  contentWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  container: {
    flex: 1,
    padding: "clamp(0.5rem, 2vw, 1.5rem)",
    overflow: "auto",
    maxHeight: "calc(100vh - 80px)",
  },

  // Header styles
  header: {
    background: "#ffffff",
    borderRadius: "clamp(0.5rem, 2vw, 1rem)",
    padding: "clamp(1rem, 3vw, 1.5rem)",
    marginBottom: "clamp(0.75rem, 2vw, 1.5rem)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "clamp(0.75rem, 2vw, 1.5rem)",
    flexWrap: "wrap",
    gap: "clamp(0.5rem, 2vw, 1rem)",
  },

  headerTitle: {
    fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    minWidth: 0,
    flex: "0 0 auto",
  },

  userName: {
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    fontWeight: "600",
    color: "#1e293b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "120px",
  },

  userEmail: {
    fontSize: "clamp(0.625rem, 1.5vw, 0.75rem)",
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "150px",
  },

  // Controls
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap",
  },

  leftControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#64748b",
    fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
    minWidth: "max-content",
  },

  rightControls: {
    display: "flex",
    alignItems: "center",
    gap: "clamp(0.5rem, 1vw, 0.75rem)",
    flexWrap: "wrap",
    flex: 1,
    justifyContent: "flex-end",
    minWidth: 0,
  },

  // Search
  searchContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "300px",
    minWidth: "200px",
  },

  searchInput: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.5rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
    background: "#ffffff",
    transition: "all 0.2s ease",
    outline: "none",
  },

  searchIcon: {
    position: "absolute",
    left: "0.875rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    fontSize: "0.875rem",
  },

  // Buttons
  button: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem clamp(0.75rem, 2vw, 1rem)",
    border: "1px solid #e2e8f0",
    borderRadius: "0.75rem",
    background: "#ffffff",
    color: "#374151",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    minWidth: "max-content",
  },

  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem clamp(0.75rem, 2vw, 1.25rem)",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },

  // Stats cards
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },

  statsCard: {
    background: "#ffffff",
    padding: "1.5rem",
    borderRadius: "1rem",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },

  statsIcon: {
    width: "3rem",
    height: "3rem",
    borderRadius: "0.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
    flexShrink: 0,
  },

  statsValue: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    fontWeight: "700",
    margin: 0,
  },

  statsLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
    margin: 0,
  },

  // Table
  tableContainer: {
    background: "#ffffff",
    borderRadius: "1rem",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e2e8f0",
    marginBottom: "1rem",
  },

  tableWrapper: {
    overflowX: "auto",
    maxHeight: "calc(100vh - 400px)",
    overflowY: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "0.875rem",
  },

  tableHeader: {
    background: "#f8fafc",
    padding: "clamp(0.75rem, 2vw, 1rem)",
    textAlign: "left",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },

  tableRow: {
    transition: "background-color 0.2s ease",
  },

  tableCell: {
    padding: "clamp(0.75rem, 2vw, 1rem)",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
    maxWidth: "250px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  // Subject info
  subjectInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },

  subjectName: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#1976d2",
    margin: 0,
  },

  subjectCode: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontFamily: "monospace",
    background: "#f1f5f9",
    padding: "0.125rem 0.375rem",
    borderRadius: "0.25rem",
    display: "inline-block",
    marginTop: "0.25rem",
  },

  // Description
  description: {
    fontSize: "0.75rem",
    color: "#64748b",
    lineHeight: "1.4",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "200px",
  },

  // Grade tags
  gradeTag: {
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #93c5fd",
    padding: "0.125rem 0.375rem",
    borderRadius: "0.25rem",
    fontSize: "0.625rem",
    fontWeight: "500",
    margin: "0.125rem",
    whiteSpace: "nowrap",
    display: "inline-block",
  },

  gradesContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
    maxWidth: "150px",
  },

  // Teacher count badge
  teacherCount: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "0.25rem 0.5rem",
    borderRadius: "0.75rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    textAlign: "center",
    minWidth: "3rem",
    whiteSpace: "nowrap",
  },

  // Status badge
  statusBadge: {
    padding: "0.375rem 0.75rem",
    borderRadius: "1.25rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    textAlign: "center",
    minWidth: "80px",
    whiteSpace: "nowrap",
  },

  statusActive: {
    background: "#dcfce7",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },

  statusInactive: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },

  // Action buttons
  actionButtons: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },

  actionButton: {
    width: "clamp(1.75rem, 4vw, 2rem)",
    height: "clamp(1.75rem, 4vw, 2rem)",
    border: "none",
    borderRadius: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: "0.875rem",
    flexShrink: 0,
  },

  viewButton: {
    background: "#f0f9ff",
    color: "#0369a1",
    border: "1px solid #bae6fd",
  },

  editButton: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },

  deleteButton: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },

  toggleButton: {
    background: "#fff7ed",
    color: "#ea580c",
    border: "1px solid #fed7aa",
  },

  // Pagination
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem clamp(1rem, 3vw, 1.5rem)",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    flexWrap: "wrap",
    gap: "1rem",
    position: "sticky",
    bottom: 0,
  },

  paginationInfo: {
    fontSize: "0.875rem",
    color: "#64748b",
    minWidth: "max-content",
  },

  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },

  pageButton: {
    width: "2rem",
    height: "2rem",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    background: "#ffffff",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s ease",
    flexShrink: 0,
  },

  pageButtonActive: {
    background: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },

  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    color: "#64748b",
  },

  emptyIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
    color: "#d1d5db",
  },

  // Responsive breakpoints
  "@media (max-width: 768px)": {
    container: {
      padding: "0.75rem",
    },

    headerTop: {
      flexDirection: "column",
      alignItems: "flex-start",
    },

    userInfo: {
      order: -1,
      alignSelf: "flex-end",
    },

    controlsRow: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: "0.75rem",
    },

    rightControls: {
      justifyContent: "flex-start",
    },

    searchContainer: {
      maxWidth: "none",
    },

    tableCell: {
      padding: "0.5rem",
      maxWidth: "120px",
    },

    actionButtons: {
      flexDirection: "column",
      gap: "0.25rem",
    },

    pagination: {
      flexDirection: "column",
      gap: "0.75rem",
    },

    statsContainer: {
      gridTemplateColumns: "1fr",
    },
  },

  "@media (max-width: 480px)": {
    container: {
      padding: "0.5rem",
    },

    rightControls: {
      flexDirection: "column",
      alignItems: "stretch",
    },

    button: {
      justifyContent: "center",
      padding: "0.75rem",
    },

    addButton: {
      justifyContent: "center",
      padding: "0.75rem",
    },
  },
};

// Responsive utility function
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width <= 768,
        isTablet: width > 768 && width <= 1024,
        isDesktop: width > 1024,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

const Subjects = () => {
  const { currentUser } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 5 : 10);
  const [currentPage, setCurrentPage] = useState(1);

  // Responsive table columns
  const getVisibleColumns = () => {
    if (isMobile) {
      return ["name", "status", "actions"];
    }
    if (isTablet) {
      return ["name", "description", "status", "actions"];
    }
    return [
      "name",
      "description",
      "gradeLevel",
      "teacherCount",
      "status",
      "actions",
    ];
  };

  const visibleColumns = getVisibleColumns();

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, searchTerm]);

  useEffect(() => {
    setItemsPerPage(isMobile ? 5 : 10);
    setCurrentPage(1);
  }, [isMobile]);

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
          subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSubjects(filtered);
  };

  // Pagination
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubjects = filteredSubjects.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
      gradeLevel: subject.gradeLevel || [],
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

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = isMobile ? 3 : 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 2) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 1) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages.map((page, index) => (
      <button
        key={index}
        style={{
          ...styles.pageButton,
          ...(page === currentPage ? styles.pageButtonActive : {}),
          ...(page === "..."
            ? { cursor: "default", border: "none", background: "transparent" }
            : {}),
        }}
        onClick={() => typeof page === "number" && setCurrentPage(page)}
        disabled={page === "..."}
      >
        {page}
      </button>
    ));
  };

  return (
    <div style={styles.mainLayout}>
      <Sidebar />
      <div style={styles.contentWrapper}>
        <Header title="Quản lý Môn học" />

        <main style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <h1 style={styles.headerTitle}>
                <FaBook />
                Môn học
              </h1>
              <div style={styles.userInfo}>
                <Avatar
                  size={isMobile ? 32 : 40}
                  style={{ backgroundColor: "#3b82f6" }}
                >
                  {currentUser?.name?.charAt(0) || "A"}
                </Avatar>
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <div style={styles.userName}>
                    {currentUser?.name?.split("@")[0] || "Admin"}
                  </div>
                  <div style={styles.userEmail}>
                    {currentUser?.email || "admin@example.com"}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.controlsRow}>
              <div style={styles.leftControls}>
                Hiển thị
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#1e293b",
                    fontWeight: "600",
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <FaChevronDown style={{ fontSize: "0.75rem" }} />
              </div>

              <div style={styles.rightControls}>
                {!isMobile && (
                  <>
                    <button style={styles.button}>
                      <FaFilter />
                      Lọc
                    </button>
                    <button style={styles.button}>
                      <FaDownload />
                      Xuất
                    </button>
                  </>
                )}

                <div style={styles.searchContainer}>
                  <FaSearch style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm môn học..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={styles.searchInput}
                  />
                </div>

                <button onClick={handleAddSubject} style={styles.addButton}>
                  <FaPlus />
                  {isMobile ? "Thêm" : "Thêm môn học"}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsContainer}>
            <div style={styles.statsCard}>
              <div
                style={{
                  ...styles.statsIcon,
                  background: "#e0f2fe",
                  color: "#0369a1",
                }}
              >
                <FaBook />
              </div>
              <div>
                <h3 style={{ ...styles.statsValue, color: "#0369a1" }}>
                  {filteredSubjects.length}
                </h3>
                <p style={styles.statsLabel}>Tổng môn học</p>
              </div>
            </div>
            <div style={styles.statsCard}>
              <div
                style={{
                  ...styles.statsIcon,
                  background: "#dcfce7",
                  color: "#16a34a",
                }}
              >
                <FaUsers />
              </div>
              <div>
                <h3 style={{ ...styles.statsValue, color: "#16a34a" }}>
                  {filteredSubjects.filter((s) => s.isActive).length}
                </h3>
                <p style={styles.statsLabel}>Đang hoạt động</p>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "3rem",
              }}
            >
              <Spin size="large" />
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {visibleColumns.includes("name") && (
                        <th style={styles.tableHeader}>Môn học</th>
                      )}
                      {visibleColumns.includes("description") && (
                        <th style={styles.tableHeader}>Mô tả</th>
                      )}
                      {visibleColumns.includes("gradeLevel") && (
                        <th style={styles.tableHeader}>Khối học</th>
                      )}
                      {visibleColumns.includes("teacherCount") && (
                        <th style={styles.tableHeader}>Giáo viên</th>
                      )}
                      {visibleColumns.includes("status") && (
                        <th style={styles.tableHeader}>Trạng thái</th>
                      )}
                      {visibleColumns.includes("actions") && (
                        <th style={styles.tableHeader}>Thao tác</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={visibleColumns.length}
                          style={styles.emptyState}
                        >
                          <FaBook style={styles.emptyIcon} />
                          <div>Không tìm thấy môn học nào</div>
                        </td>
                      </tr>
                    ) : (
                      paginatedSubjects.map((subject, index) => (
                        <tr
                          key={subject.id}
                          style={styles.tableRow}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f8fafc")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#ffffff")
                          }
                        >
                          {visibleColumns.includes("name") && (
                            <td style={styles.tableCell}>
                              <div style={styles.subjectInfo}>
                                <div style={styles.subjectName}>
                                  {subject.name}
                                </div>
                                {subject.code && !isMobile && (
                                  <div style={styles.subjectCode}>
                                    {subject.code}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("description") && (
                            <td style={styles.tableCell}>
                              <div style={styles.description}>
                                {subject.description ? (
                                  subject.description.length >
                                  (isMobile ? 30 : 80) ? (
                                    `${subject.description.substring(
                                      0,
                                      isMobile ? 30 : 80
                                    )}...`
                                  ) : (
                                    subject.description
                                  )
                                ) : (
                                  <span
                                    style={{
                                      fontStyle: "italic",
                                      color: "#999",
                                    }}
                                  >
                                    Chưa có mô tả
                                  </span>
                                )}
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("gradeLevel") && (
                            <td style={styles.tableCell}>
                              <div style={styles.gradesContainer}>
                                {subject.gradeLevel ? (
                                  Array.isArray(subject.gradeLevel) ? (
                                    subject.gradeLevel
                                      .slice(0, isMobile ? 1 : 3)
                                      .map((grade) => (
                                        <span
                                          key={grade}
                                          style={styles.gradeTag}
                                        >
                                          Khối {grade}
                                        </span>
                                      ))
                                  ) : (
                                    <span style={styles.gradeTag}>
                                      Khối {subject.gradeLevel}
                                    </span>
                                  )
                                ) : (
                                  <span
                                    style={{
                                      fontStyle: "italic",
                                      color: "#999",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    Chưa xác định
                                  </span>
                                )}
                                {Array.isArray(subject.gradeLevel) &&
                                  subject.gradeLevel.length >
                                    (isMobile ? 1 : 3) && (
                                    <span style={styles.gradeTag}>
                                      +
                                      {subject.gradeLevel.length -
                                        (isMobile ? 1 : 3)}
                                    </span>
                                  )}
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("teacherCount") && (
                            <td style={styles.tableCell}>
                              <div style={styles.teacherCount}>
                                {subject.teacherCount || 0} GV
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("status") && (
                            <td style={styles.tableCell}>
                              <div
                                style={{
                                  ...styles.statusBadge,
                                  ...(subject.isActive
                                    ? styles.statusActive
                                    : styles.statusInactive),
                                }}
                              >
                                {subject.isActive
                                  ? isMobile
                                    ? "ON"
                                    : "Hoạt động"
                                  : isMobile
                                  ? "OFF"
                                  : "Tạm dừng"}
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("actions") && (
                            <td style={styles.tableCell}>
                              <div style={styles.actionButtons}>
                                <Tooltip title="Xem chi tiết">
                                  <button
                                    onClick={() => handleViewSubject(subject)}
                                    style={{
                                      ...styles.actionButton,
                                      ...styles.viewButton,
                                    }}
                                  >
                                    <FaEye />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Kích hoạt/Tạm dừng">
                                  <button
                                    onClick={() => handleToggleStatus(subject)}
                                    style={{
                                      ...styles.actionButton,
                                      ...styles.toggleButton,
                                    }}
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
                                    onClick={() => handleEditSubject(subject)}
                                    style={{
                                      ...styles.actionButton,
                                      ...styles.editButton,
                                    }}
                                  >
                                    <FaEdit />
                                  </button>
                                </Tooltip>
                                {!isMobile && (
                                  <Tooltip title="Xóa">
                                    <button
                                      onClick={() =>
                                        handleDeleteSubject(subject)
                                      }
                                      style={{
                                        ...styles.actionButton,
                                        ...styles.deleteButton,
                                      }}
                                    >
                                      <FaTrash />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredSubjects.length > 0 && (
                <div style={styles.pagination}>
                  <div style={styles.paginationInfo}>
                    {isMobile
                      ? `${startIndex + 1}-${Math.min(
                          startIndex + itemsPerPage,
                          filteredSubjects.length
                        )}/${filteredSubjects.length}`
                      : `Hiển thị ${startIndex + 1} - ${Math.min(
                          startIndex + itemsPerPage,
                          filteredSubjects.length
                        )} của ${filteredSubjects.length} kết quả`}
                  </div>

                  <div style={styles.paginationControls}>
                    <button
                      style={styles.pageButton}
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <FaChevronLeft />
                    </button>

                    {renderPageNumbers()}

                    <button
                      style={styles.pageButton}
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Modal Add/Edit Subject */}
        <Modal
          title={editingSubject ? "Cập nhật môn học" : "Thêm môn học"}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={isMobile ? "95%" : isTablet ? "80%" : 800}
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
                rules={[
                  { required: true, message: "Vui lòng nhập mã môn học" },
                ]}
              >
                <Input placeholder="Nhập mã môn học" disabled />
              </Form.Item>
            )}

            {!editingSubject && (
              <div
                style={{
                  backgroundColor: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#0369a1",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  ℹ️ <strong>Mã môn học sẽ được tạo tự động</strong> dựa trên
                  tên môn học
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Switch />
                <span>Kích hoạt môn học</span>
              </div>
            </Form.Item>

            <div
              style={{
                textAlign: "right",
                marginTop: "1.5rem",
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
                style={{
                  padding: "0.5rem 1rem",
                  border: "1px solid #d9d9d9",
                  borderRadius: "0.5rem",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderRadius: "0.5rem",
                  backgroundColor: "#1976d2",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
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
    </div>
  );
};

export default Subjects;
