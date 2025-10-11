import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUserGraduate,
  FaMale,
  FaFemale,
  FaUserCheck,
  FaUserTimes,
  FaFilter,
  FaDownload,
  FaEye,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaPhone,
  FaBirthdayCake,
  FaSchool,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StudentTable from "../components/StudentTable";
import StudentEditModal from "../components/StudentEditModal";
import StudentDetailCard from "../components/StudentDetailCard";
import * as studentService from "../services/adminServices/studentService";
import * as classesService from "../services/adminServices/classesService";
import { calcFee } from "../pages/TuitionFee";
import { message, Select, Spin, Tooltip, Avatar } from "antd";
import { useAuth } from "../context/AuthContext";

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
    marginLeft: "2rem",
  },

  container: {
    flex: 1,
    padding: "clamp(0.5rem, 2vw, 1.5rem)",
    overflow: "auto",
    maxHeight: "calc(100vh - 80px)",
  },

  // Header styles
  header: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    borderRadius: "16px",
    padding: "clamp(1rem, 3vw, 1.5rem)",
    marginBottom: "clamp(0.75rem, 2vw, 1.5rem)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e2e8f0",
    position: "relative",
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

  titleIcon: {
    color: "#667eea",
    filter: "drop-shadow(0 2px 4px rgba(102, 126, 234, 0.2))",
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
    width: "80%",
    padding: "0.75rem 1rem 0.75rem 2.5rem",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "0.875rem",
    background: "#ffffff",
    transition: "all 0.3s ease",
    outline: "none",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
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
    borderRadius: "12px",
    background: "#ffffff",
    color: "#374151",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
    minWidth: "max-content",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },

  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem clamp(0.75rem, 2vw, 1.25rem)",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  },

  exportButton: {
    background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
  },

  // Stats cards
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },

  statsCard: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    transition: "all 0.3s ease",
    minHeight: "120px",
  },

  statsIcon: {
    width: "3.5rem",
    height: "3.5rem",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    flexShrink: 0,
  },

  statsContent: {
    flex: 1,
    minWidth: 0,
  },

  statsValue: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    fontWeight: "700",
    margin: 0,
    lineHeight: 1.2,
  },

  statsLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
    margin: 0,
    fontWeight: "500",
  },

  // Table
  tableContainer: {
    background: "#ffffff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e2e8f0",
    marginBottom: "1rem",
  },

  tableWrapper: {
    overflowX: "auto",
    maxHeight: "calc(100vh - 500px)",
    overflowY: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "0.875rem",
  },

  tableHeader: {
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
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
    transition: "all 0.2s ease",
  },

  tableCell: {
    padding: "clamp(0.75rem, 2vw, 1rem)",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  // Student info
  studentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    minWidth: 0,
    maxWidth: "250px",
  },

  studentAvatar: {
    width: "clamp(2rem, 4vw, 2.5rem)",
    height: "clamp(2rem, 4vw, 2.5rem)",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "clamp(0.75rem, 2vw, 1rem)",
    fontWeight: "600",
    flexShrink: 0,
  },

  studentDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
    minWidth: 0,
    overflow: "hidden",
  },

  studentName: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  studentId: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontFamily: "monospace",
  },

  // Contact info
  contactInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    minWidth: 0,
    maxWidth: "180px",
  },

  contactItem: {
    fontSize: "0.75rem",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  // Class badge
  classBadge: {
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    color: "#0369a1",
    border: "1px solid #bae6fd",
    padding: "0.375rem 0.75rem",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textAlign: "center",
    whiteSpace: "nowrap",
    minWidth: "80px",
  },

  // Status badge
  statusBadge: {
    padding: "0.375rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textAlign: "center",
    minWidth: "80px",
    whiteSpace: "nowrap",
  },

  statusActive: {
    background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    color: "#16a34a",
    border: "1px solid #86efac",
  },

  statusInactive: {
    background: "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)",
    color: "#dc2626",
    border: "1px solid #f87171",
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
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "0.875rem",
    flexShrink: 0,
  },

  viewButton: {
    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    color: "#0369a1",
    border: "1px solid #bae6fd",
  },

  editButton: {
    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
  },

  deleteButton: {
    background: "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)",
    color: "#dc2626",
    border: "1px solid #f87171",
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
    borderRadius: "8px",
    background: "#ffffff",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.3s ease",
    flexShrink: 0,
  },

  pageButtonActive: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#ffffff",
    borderColor: "#667eea",
    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
  },

  // Modal overlay
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },

  // Loading
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "300px",
    fontSize: "1.125rem",
    color: "#64748b",
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
  "@media (max-width: 1024px)": {
    contentWrapper: {
      marginLeft: "0",
    },
  },

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

    statsContainer: {
      gridTemplateColumns: "1fr",
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

export default function Students() {
  const { currentUser } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 5 : 10);
  const [currentPage, setCurrentPage] = useState(1);

  // Responsive table columns
  const getVisibleColumns = () => {
    if (isMobile) {
      return ["name", "actions"];
    }
    if (isTablet) {
      return ["name", "contact", "class", "actions"];
    }
    return ["name", "contact", "class", "dateOfBirth", "status", "actions"];
  };

  const visibleColumns = getVisibleColumns();

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    setItemsPerPage(isMobile ? 5 : 10);
    setCurrentPage(1);
  }, [isMobile]);

  const fetchClasses = async () => {
    try {
      const data = await classesService.getAllClasses();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentsData = await studentService.getAllStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
      message.error("Có lỗi xảy ra khi tải danh sách học sinh");
    }
    setLoading(false);
  };

  // derive sorted unique grades from classes
  const gradeOptions = React.useMemo(() => {
    const setG = new Set();
    classes.forEach((c) => {
      if (c.grade !== undefined && c.grade !== null && c.grade !== "") {
        setG.add(String(c.grade));
      }
    });
    return [
      "all",
      ...Array.from(setG).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    ];
  }, [classes]);

  // helper to find class object either by id or by name-like value
  const findClassByRef = (ref) => {
    if (!ref) return null;
    const byId = classes.find((c) => c.id === ref);
    if (byId) return byId;
    const byName = classes.find(
      (c) => c.name === ref || `${c.name} (${c.grade})` === ref
    );
    if (byName) return byName;
    return null;
  };

  // Filter + Sort students
  const filteredStudents = React.useMemo(() => {
    const q = searchQuery?.trim().toLowerCase() || "";

    const base = students.filter((student) => {
      if (!student) return false;
      if (!q) return true;
      const name = (student.name || student.fullName || "").toLowerCase();
      const contact = (student.contact || student.phone || "").toLowerCase();
      return name.includes(q) || contact.includes(q);
    });

    // map each student to include resolvedClass & resolvedGrade for sorting/filter
    const mapped = base.map((s) => {
      const classRef = s.classId || s.class || s.classIdRef || null;
      const cls = findClassByRef(classRef);
      return {
        ...s,
        _resolvedClass: cls,
        _resolvedGrade: cls ? String(cls.grade) : null,
        _resolvedClassName: cls
          ? cls.name
          : typeof classRef === "string"
          ? classRef
          : "Chưa phân lớp",
      };
    });

    // apply grade filter
    const gradeFiltered = mapped.filter((s) => {
      if (selectedGrade === "all") return true;
      return s._resolvedGrade === String(selectedGrade);
    });

    // sort by grade, then className, then student name
    gradeFiltered.sort((a, b) => {
      const ga = a._resolvedGrade || "zzzz";
      const gb = b._resolvedGrade || "zzzz";
      const cmpGrade = ga.localeCompare(gb, undefined, {
        numeric: true,
        sensitivity: "base",
      });
      if (cmpGrade !== 0) return cmpGrade;

      const ca = (a._resolvedClassName || "").toLowerCase();
      const cb = (b._resolvedClassName || "").toLowerCase();
      const cmpClass = ca.localeCompare(cb, undefined, { sensitivity: "base" });
      if (cmpClass !== 0) return cmpClass;

      const na = (a.name || a.fullName || a.id || "").toLowerCase();
      const nb = (b.name || b.fullName || b.id || "").toLowerCase();
      return na.localeCompare(nb, undefined, { sensitivity: "base" });
    });

    return gradeFiltered;
  }, [students, searchQuery, selectedGrade, classes]);

  // Statistics
  const totalStudents = students.length;
  const maleStudents = students.filter((s) => s.gender === "male").length;
  const femaleStudents = students.filter((s) => s.gender === "female").length;
  const activeStudents = students.filter((s) => s.status === "active").length;
  const inactiveStudents = students.filter(
    (s) => s.status === "inactive"
  ).length;

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleOpenEditModal = (student = null) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const handleSaveStudent = async (formData) => {
    const resolveClassId = (value) => {
      if (!value) return null;
      const byId = classes.find((c) => c.id === value);
      if (byId) return byId.id;
      const byName = classes.find(
        (c) => c.name === value || `${c.name} (${c.grade})` === value
      );
      if (byName) return byName.id;
      return value;
    };

    try {
      if (editingStudent) {
        const originalClassIdDoc = resolveClassId(editingStudent.classId);
        const newClassIdDoc = resolveClassId(formData.classId);

        if (originalClassIdDoc && originalClassIdDoc !== newClassIdDoc) {
          await classesService.removeStudentFromClass(
            originalClassIdDoc,
            editingStudent.id
          );
          if (newClassIdDoc) {
            await classesService.addStudentToClass(
              newClassIdDoc,
              editingStudent.id
            );
          }
        } else if (!originalClassIdDoc && newClassIdDoc) {
          await classesService.addStudentToClass(
            newClassIdDoc,
            editingStudent.id
          );
        }

        await studentService.updateStudent(editingStudent.id, {
          ...formData,
          classId: newClassIdDoc || null,
          parent: {
            name: formData.parentName,
            phoneNumber: formData.contact,
          },
        });

        await fetchStudents();
        handleCloseEditModal();
        message.success("Cập nhật thông tin học sinh thành công!");
      } else {
        const generatedId = Date.now().toString();
        const classIdDoc = resolveClassId(formData.classId);

        await studentService.createStudent(generatedId, {
          ...formData,
          classId: classIdDoc || null,
          parent: {
            name: formData.parentName,
            phoneNumber: formData.contact,
          },
        });

        if (classIdDoc) {
          await classesService.addStudentToClass(classIdDoc, generatedId);
        }

        await fetchStudents();
        handleCloseEditModal();
        message.success("Thêm học sinh mới thành công!");
      }
    } catch (error) {
      console.error("Error saving student:", error);
      message.error("Có lỗi xảy ra khi lưu thông tin học sinh!");
    }
  };

  const handleOpenDetailModal = (student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedStudent(null);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa học sinh này không?")) {
      try {
        await studentService.deleteStudent(studentId);
        await fetchStudents();
        if (selectedStudent?.id === studentId) {
          setSelectedStudent(null);
        }
        message.success("Xóa học sinh thành công!");
      } catch (error) {
        console.error("Error deleting student:", error);
        message.error("Có lỗi khi xóa học sinh!");
      }
    }
  };

  const handleExportCSV = () => {
    const csvData = [
      ["ID", "Tên", "SĐT", "Email", "Ngày sinh", "Lớp", "Ghi chú"],
      ...students.map((student) => [
        student.id,
        student.name || "",
        student.contact || "",
        student.email || "",
        student.dateOfBirth || "",
        student.class || "",
        student.notes || "",
      ]),
    ];
    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "danh_sach_hoc_sinh.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <Header title="Quản lý Học sinh" />

        <main style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTop}>
              <h1 style={styles.headerTitle}>
                <FaUserGraduate style={styles.titleIcon} />
                Học sinh
              </h1>
              <div style={styles.userInfo}>
                <Avatar
                  size={isMobile ? 32 : 40}
                  style={{ backgroundColor: "#667eea" }}
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
                    <Select
                      value={selectedGrade}
                      onChange={(val) => {
                        setSelectedGrade(val);
                        setCurrentPage(1);
                      }}
                      style={{ width: 150 }}
                      placeholder="Chọn khối"
                    >
                      {gradeOptions.map((g) => (
                        <Select.Option key={g} value={g}>
                          {g === "all" ? "Tất cả khối" : `Khối ${g}`}
                        </Select.Option>
                      ))}
                    </Select>

                    <button style={styles.button}>
                      <FaFilter />
                      Lọc
                    </button>

                    <button
                      onClick={handleExportCSV}
                      style={{ ...styles.button, ...styles.exportButton }}
                    >
                      <FaDownload />
                      Xuất CSV
                    </button>
                  </>
                )}

                <div style={styles.searchContainer}>
                  <FaSearch style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm học sinh..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={styles.searchInput}
                  />
                </div>

                <button
                  onClick={() => handleOpenEditModal(null)}
                  style={styles.addButton}
                >
                  <FaPlus />
                  {isMobile ? "Thêm" : "Thêm HS"}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsContainer}>
            <div
              style={styles.statsCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div
                style={{
                  ...styles.statsIcon,
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#ffffff",
                }}
              >
                <FaUserGraduate />
              </div>
              <div style={styles.statsContent}>
                <h3 style={{ ...styles.statsValue, color: "#667eea" }}>
                  {totalStudents}
                </h3>
                <p style={styles.statsLabel}>Tổng học sinh</p>
              </div>
            </div>

            <div
              style={styles.statsCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div
                style={{
                  ...styles.statsIcon,
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                }}
              >
                <FaMale />
              </div>
              <div style={styles.statsContent}>
                <h3 style={{ ...styles.statsValue, color: "#3b82f6" }}>
                  {maleStudents}
                </h3>
                <p style={styles.statsLabel}>Nam</p>
              </div>
            </div>

            <div
              style={styles.statsCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div
                style={{
                  ...styles.statsIcon,
                  background:
                    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "#ffffff",
                }}
              >
                <FaFemale />
              </div>
              <div style={styles.statsContent}>
                <h3 style={{ ...styles.statsValue, color: "#f093fb" }}>
                  {femaleStudents}
                </h3>
                <p style={styles.statsLabel}>Nữ</p>
              </div>
            </div>

            <div
              style={styles.statsCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div
                style={{
                  ...styles.statsIcon,
                  background:
                    "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "#ffffff",
                }}
              >
                <FaUserCheck />
              </div>
              <div style={styles.statsContent}>
                <h3 style={{ ...styles.statsValue, color: "#22c55e" }}>
                  {activeStudents}
                </h3>
                <p style={styles.statsLabel}>Đang học</p>
              </div>
            </div>

            <div
              style={styles.statsCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div
                style={{
                  ...styles.statsIcon,
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "#ffffff",
                }}
              >
                <FaUserTimes />
              </div>
              <div style={styles.statsContent}>
                <h3 style={{ ...styles.statsValue, color: "#f59e0b" }}>
                  {inactiveStudents}
                </h3>
                <p style={styles.statsLabel}>Nghỉ học</p>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={styles.loading}>
              <Spin size="large" />
              <span style={{ marginLeft: "1rem" }}>Đang tải danh sách...</span>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {visibleColumns.includes("name") && (
                        <th style={styles.tableHeader}>Học sinh</th>
                      )}
                      {visibleColumns.includes("contact") && (
                        <th style={styles.tableHeader}>Liên hệ</th>
                      )}
                      {visibleColumns.includes("class") && (
                        <th style={styles.tableHeader}>Lớp</th>
                      )}
                      {visibleColumns.includes("dateOfBirth") && (
                        <th style={styles.tableHeader}>Ngày sinh</th>
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
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={visibleColumns.length}
                          style={styles.emptyState}
                        >
                          <FaUserGraduate style={styles.emptyIcon} />
                          <div>Không tìm thấy học sinh nào</div>
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student, index) => (
                        <tr
                          key={student.id}
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
                              <div style={styles.studentInfo}>
                                <div style={styles.studentAvatar}>
                                  {(
                                    student.name ||
                                    student.fullName ||
                                    "?"
                                  ).charAt(0)}
                                </div>
                                <div style={styles.studentDetails}>
                                  <div style={styles.studentName}>
                                    {student.name ||
                                      student.fullName ||
                                      "Chưa có tên"}
                                  </div>
                                  {!isMobile && (
                                    <div style={styles.studentId}>
                                      #{student.id?.substring(0, 6)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("contact") && (
                            <td style={styles.tableCell}>
                              <div style={styles.contactInfo}>
                                {student.email && (
                                  <div style={styles.contactItem}>
                                    <FaEnvelope />
                                    <span>{student.email}</span>
                                  </div>
                                )}
                                {student.contact && (
                                  <div style={styles.contactItem}>
                                    <FaPhone />
                                    <span>{student.contact}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("class") && (
                            <td style={styles.tableCell}>
                              <div style={styles.classBadge}>
                                {student._resolvedClassName || "Chưa phân lớp"}
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("dateOfBirth") && (
                            <td style={styles.tableCell}>
                              {student.dateOfBirth ? (
                                <div style={styles.contactItem}>
                                  <FaBirthdayCake />
                                  <span>{student.dateOfBirth}</span>
                                </div>
                              ) : (
                                <span
                                  style={{
                                    color: "#d1d5db",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Chưa có
                                </span>
                              )}
                            </td>
                          )}

                          {visibleColumns.includes("status") && (
                            <td style={styles.tableCell}>
                              <div
                                style={{
                                  ...styles.statusBadge,
                                  ...(student.status === "active" ||
                                  !student.status
                                    ? styles.statusActive
                                    : styles.statusInactive),
                                }}
                              >
                                {student.status === "active" || !student.status
                                  ? isMobile
                                    ? "OK"
                                    : "Đang học"
                                  : isMobile
                                  ? "OFF"
                                  : "Nghỉ học"}
                              </div>
                            </td>
                          )}

                          {visibleColumns.includes("actions") && (
                            <td style={styles.tableCell}>
                              <div style={styles.actionButtons}>
                                <Tooltip title="Xem chi tiết">
                                  <button
                                    onClick={() =>
                                      handleOpenDetailModal(student)
                                    }
                                    style={{
                                      ...styles.actionButton,
                                      ...styles.viewButton,
                                    }}
                                  >
                                    <FaEye />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Chỉnh sửa">
                                  <button
                                    onClick={() => handleOpenEditModal(student)}
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
                                        handleDeleteStudent(student.id)
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
              {filteredStudents.length > 0 && (
                <div style={styles.pagination}>
                  <div style={styles.paginationInfo}>
                    {isMobile
                      ? `${startIndex + 1}-${Math.min(
                          startIndex + itemsPerPage,
                          filteredStudents.length
                        )}/${filteredStudents.length}`
                      : `Hiển thị ${startIndex + 1} - ${Math.min(
                          startIndex + itemsPerPage,
                          filteredStudents.length
                        )} của ${filteredStudents.length} kết quả`}
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

        {/* Edit Modal */}
        <StudentEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          student={editingStudent}
          onSave={handleSaveStudent}
        />

        {/* Detail Modal */}
        {isDetailModalOpen && (
          <div onClick={handleCloseDetailModal} style={styles.modalOverlay}>
            <div onClick={(e) => e.stopPropagation()}>
              <StudentDetailCard student={selectedStudent} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
