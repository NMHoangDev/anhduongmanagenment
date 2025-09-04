import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { FaPlus } from "react-icons/fa";
import { message } from "antd";
import * as classesService from "../services/classesService";
import * as teacherService from "../services/teacherService";
import ClassEditModal from "../components/ClassEditModal";
import ClassTable from "../components/ClassTable";

export default function ClassListPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await classesService.getAllClasses();
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
        // Sử dụng updateClass với ID cụ thể
        await classesService.updateClass(editingClass.id, formData);
        message.success("Cập nhật lớp học thành công!");
      } else {
        // Sử dụng createClass với ID và data
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
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.teacher?.name &&
        cls.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()))
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
        <Header title="Quản lý Lớp học" />
        <main style={{ padding: "20px 40px 40px 40px" }}>
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
          <div style={{ marginBottom: "20px", display: "flex", gap: "15px" }}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên lớp hoặc giáo viên..."
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
                {selectedClass.teacher?.name ||
                  selectedClass.teacher_id ||
                  "Chưa có"}{" "}
                &nbsp;|&nbsp;
                <strong>Cơ sở:</strong> {selectedClass.facility}
              </div>
              <div>
                <strong>Danh sách học sinh:</strong>
                <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
                  {(selectedClass.studentsDetails || []).map((student, idx) => (
                    <li key={student.id || idx}>
                      {student.name
                        ? `${student.name}${
                            student.grade ? ` - Lớp ${student.grade}` : ""
                          }`
                        : `Không tìm thấy thông tin cho học sinh ID: ${student.id}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>
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
