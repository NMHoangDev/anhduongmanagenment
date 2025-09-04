import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StudentTable from "../components/StudentTable";
import StudentEditModal from "../components/StudentEditModal";
import StudentDetailCard from "../components/StudentDetailCard";
import {
  FaPlus,
  FaFileCsv,
  FaFilter,
  FaUserGraduate,
  FaMale,
  FaFemale,
  FaUserCheck,
  FaUserTimes,
} from "react-icons/fa";
import * as studentService from "../services/studentService";
import * as classesService from "../services/classesService"; // Change this line
import { calcFee } from "../pages/TuitionFee";
import { message } from "antd";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);
  const fetchClasses = async () => {
    const data = await classesService.getAllClasses();
    setClasses(data);
    console.log("Classes fetched:", data);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentsData = await studentService.getAllStudents();
      console.log(studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students: ", error);
    }
    setLoading(false);
  };

  const handleOpenEditModal = (student = null) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const handleSaveStudent = async (formData) => {
    try {
      if (editingStudent) {
        // Nếu học sinh chuyển lớp
        if (editingStudent.classId !== formData.classId) {
          // Xóa học sinh khỏi lớp cũ
          await classesService.removeStudentFromClass(
            editingStudent.classId,
            editingStudent.id
          );
          // Thêm học sinh vào lớp mới
          await classesService.addStudentToClass(
            formData.classId,
            editingStudent.id
          );
        }

        // Cập nhật thông tin học sinh
        await studentService.updateStudent(editingStudent.id, {
          ...formData,
          parent: {
            name: formData.parentName,
            phoneNumber: formData.contact,
          },
        });

        // Refresh danh sách học sinh
        await fetchStudents();

        // Đóng modal và hiển thị thông báo
        handleCloseEditModal();
        message.success("Cập nhật thông tin học sinh thành công!");
      } else {
        // Tạo học sinh mới
        const generatedId = Date.now().toString();
        await studentService.createStudent(generatedId, formData, {
          name: formData.parentName,
          phoneNumber: formData.contact,
        });
        await classesService.addStudentToClass(formData.classId, generatedId);

        // Refresh danh sách học sinh
        await fetchStudents();

        // Đóng modal và hiển thị thông báo
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
      } catch (error) {
        console.error("Error deleting student: ", error);
        alert("Có lỗi khi xóa học sinh.");
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

  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.contact?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = students.length;
  const maleStudents = students.filter((s) => s.gender === "male").length;
  const femaleStudents = students.filter((s) => s.gender === "female").length;
  const activeStudents = students.filter((s) => s.status === "active").length;
  const inactiveStudents = students.filter(
    (s) => s.status === "inactive"
  ).length;

  const calculateTuitionFee = (student) => {
    return calcFee(student.absents);
  };

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
        <Header title="Quản lý Học sinh" />
        <main style={{ padding: "20px 40px 40px 40px" }}>
          {/* Statistics cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 24,
              marginBottom: 32,
            }}
          >
            <StatCard
              icon={<FaUserGraduate size={36} color="#007bff" />}
              value={totalStudents}
              label="Tổng học sinh"
            />
            <StatCard
              icon={<FaMale size={36} color="#28a745" />}
              value={maleStudents}
              label="Nam"
            />
            <StatCard
              icon={<FaFemale size={36} color="#e83e8c" />}
              value={femaleStudents}
              label="Nữ"
            />
            <StatCard
              icon={<FaUserCheck size={36} color="#17a2b8" />}
              value={activeStudents}
              label="Đang học"
            />
            <StatCard
              icon={<FaUserTimes size={36} color="#ffc107" />}
              value={inactiveStudents}
              label="Nghỉ học"
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ color: "#333", fontSize: "24px" }}>
              Danh sách Học sinh ({filteredStudents.length})
            </h2>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleExportCSV}
                style={{ ...buttonStyle, background: "#0288d1" }}
              >
                <FaFileCsv /> Xuất CSV
              </button>
              <button
                onClick={() => handleOpenEditModal(null)}
                style={{ ...buttonStyle, background: "#28a745" }}
              >
                <FaPlus /> Thêm mới
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "20px", display: "flex", gap: "15px" }}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc SĐT..."
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
            <button style={{ ...buttonStyle, background: "#6c757d" }}>
              <FaFilter /> Bộ lọc
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", padding: "50px" }}>
              Đang tải danh sách...
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
              <StudentTable
                students={filteredStudents}
                onDetailsClick={handleOpenDetailModal}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteStudent}
              />
            </div>
          )}
        </main>
      </div>

      <StudentEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        student={editingStudent}
        onSave={handleSaveStudent}
      />

      {isDetailModalOpen && (
        <div
          onClick={handleCloseDetailModal}
          style={{
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
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <StudentDetailCard student={selectedStudent} />
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ icon, value, label }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: 140,
      border: "1px solid #f0f0f0",
    }}
  >
    {icon}
    <div
      style={{ fontSize: 32, fontWeight: 700, color: "#333", lineHeight: 1 }}
    >
      {value}
    </div>
    <div style={{ color: "#888", marginTop: 4, fontWeight: 500 }}>{label}</div>
  </div>
);

const buttonStyle = {
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: "600",
  fontSize: "15px",
  transition: "background-color 0.2s",
};
