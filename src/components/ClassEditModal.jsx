import React, { useState, useEffect } from "react";
import { Modal, Select, message } from "antd";
import * as teacherService from "../services/teacherService";

const { Option } = Select;

export default function ClassEditModal({ isOpen, onClose, classData, onSave }) {
  const [form, setForm] = useState({
    name: "",
    grade: "",
    teacher: "",
    facility: "",
    students: [],
  });
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const teacherList = await teacherService.getTeachers();
      setTeachers(teacherList);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      message.error("Có lỗi xảy ra khi tải danh sách giáo viên!");
    }
    setLoadingTeachers(false);
  };

  useEffect(() => {
    if (classData) {
      setForm({
        name: classData.name || "",
        grade: classData.grade || "",
        teacher: classData.teacher?.id || classData.teacher || "",
        facility: classData.facility || "",
        students: classData.students || [],
      });
    } else {
      setForm({
        name: "",
        grade: "",
        teacher: "",
        facility: "",
        students: [],
      });
    }
  }, [classData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTeacherChange = (teacherId) => {
    setForm((prev) => ({
      ...prev,
      teacher: teacherId || "", // Xử lý trường hợp teacherId là null/undefined khi clear
    }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.grade || !form.facility) {
      alert("Vui lòng nhập đầy đủ thông tin lớp học!");
      return;
    }

    // Tạo data để lưu, loại bỏ các field undefined hoặc rỗng
    const saveData = {
      name: form.name,
      grade: form.grade,
      facility: form.facility,
      students: form.students || [],
    };

    // Chỉ thêm teacher nếu có giá trị hợp lệ
    if (form.teacher && form.teacher.trim() !== "") {
      saveData.teacher = form.teacher;
    }

    onSave(saveData);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      title={classData ? "Sửa thông tin lớp học" : "Thêm lớp học mới"}
      okText={classData ? "Lưu" : "Thêm"}
      cancelText="Hủy"
      centered
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          Tên lớp:
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
            placeholder="VD: Lớp 4A"
          />
        </label>
        <label>
          Khối:
          <input
            type="text"
            name="grade"
            value={form.grade}
            onChange={handleChange}
            style={inputStyle}
            placeholder="VD: 4"
          />
        </label>
        <label>
          Giáo viên chủ nhiệm:
          <Select
            value={form.teacher || undefined}
            onChange={handleTeacherChange}
            style={{ width: "100%", marginTop: "4px" }}
            placeholder="Chọn giáo viên chủ nhiệm (không bắt buộc)"
            loading={loadingTeachers}
            showSearch
            allowClear
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {teachers.map((teacher) => (
              <Option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </Option>
            ))}
          </Select>
        </label>
        <label>
          Cơ sở:
          <input
            type="text"
            name="facility"
            value={form.facility}
            onChange={handleChange}
            style={inputStyle}
            placeholder="VD: facility_1"
          />
        </label>
      </div>
    </Modal>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ddd",
  marginTop: "4px",
  fontSize: "15px",
};
