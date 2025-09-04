import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, Space, message, Card } from "antd";
import { FaBook, FaUser, FaHome, FaStickyNote, FaClock } from "react-icons/fa";
import * as teacherService from "../services/teacherService";
import * as subjectService from "../services/subjectService";

const { Option } = Select;
const { TextArea } = Input;

const TimetableEditModal = ({
  isOpen,
  onClose,
  sessionData,
  onSave,
  context, // { classId, day, sessionIndex (timeSlotId), className, dayName }
}) => {
  const [form] = Form.useForm();
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Định nghĩa các tiết học
  const timeSlots = [
    { id: 1, label: "Tiết 1", startTime: "07:00", endTime: "07:45" },
    { id: 2, label: "Tiết 2", startTime: "07:45", endTime: "08:30" },
    { id: 3, label: "Tiết 3", startTime: "08:45", endTime: "09:30" },
    { id: 4, label: "Tiết 4", startTime: "09:30", endTime: "10:15" },
    { id: 5, label: "Tiết 5", startTime: "10:30", endTime: "11:15" },
    { id: 6, label: "Tiết 6", startTime: "11:15", endTime: "12:00" },
    { id: 7, label: "Tiết 7", startTime: "13:00", endTime: "13:45" },
    { id: 8, label: "Tiết 8", startTime: "13:45", endTime: "14:30" },
    { id: 9, label: "Tiết 9", startTime: "14:45", endTime: "15:30" },
    { id: 10, label: "Tiết 10", startTime: "15:30", endTime: "16:15" },
  ];

  const getTimeSlotById = (timeSlotId) => {
    return timeSlots.find((slot) => slot.id === timeSlotId);
  };

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  // Separate effect to set form values after teachers are loaded
  useEffect(() => {
    if (isOpen && sessionData && teachers.length > 0) {
      // Find correct teacherId - prioritize if it's already an ID, otherwise find by name
      let teacherId = "";

      if (sessionData.teacherId) {
        // Check if teacherId is actually an ID (exists in teachers list)
        const teacherById = teachers.find(
          (t) => t.id === sessionData.teacherId
        );
        if (teacherById) {
          teacherId = sessionData.teacherId;
        } else {
          // teacherId is actually a name, find the real ID
          const teacherByName = teachers.find(
            (t) => t.name === sessionData.teacherId
          );
          teacherId = teacherByName ? teacherByName.id : "";
        }
      } else if (sessionData.teacher) {
        // Old format - find by name
        const teacherByName = teachers.find(
          (t) => t.name === sessionData.teacher
        );
        teacherId = teacherByName ? teacherByName.id : "";
      }

      console.log("🔧 Setting form values:", {
        sessionData,
        foundTeacherId: teacherId,
        teachersCount: teachers.length,
      });

      form.setFieldsValue({
        subject: sessionData.subject || "",
        teacher: teacherId,
        room: sessionData.room || "",
        note: sessionData.note || "",
      });
    } else if (isOpen && !sessionData) {
      form.resetFields();
    }
  }, [isOpen, sessionData, teachers, form]);

  const fetchDropdownData = async () => {
    setLoadingData(true);
    try {
      const [teacherList, subjectList] = await Promise.all([
        teacherService.getTeachers(),
        subjectService.getSubjects(),
      ]);

      setTeachers(teacherList);
      setSubjects(subjectList.filter((subject) => subject.isActive !== false));
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      message.error("Có lỗi xảy ra khi tải dữ liệu!");
    }
    setLoadingData(false);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const currentTimeSlot = getTimeSlotById(context?.sessionIndex);

      // Validate that teacherId is actually an ID, not a name
      const selectedTeacher = teachers.find((t) => t.id === values.teacher);
      if (values.teacher && !selectedTeacher) {
        message.error("Giáo viên được chọn không hợp lệ!");
        setLoading(false);
        return;
      }

      const sessionInfo = {
        subject: values.subject || "",
        teacherId: values.teacher || "", // This should now be a proper teacher ID
        room: values.room || "",
        note: values.note || "",
        timeSlot: context?.sessionIndex || 1,
        startTime: currentTimeSlot?.startTime || "",
        endTime: currentTimeSlot?.endTime || "",
        lastModified: new Date().toISOString(),
        createdAt: sessionData?.createdAt || new Date().toISOString(),
      };

      console.log("💾 Saving session with teacherId:", {
        teacherId: sessionInfo.teacherId,
        teacherName: selectedTeacher?.name,
        sessionInfo,
      });

      await onSave(sessionInfo);
      message.success("Cập nhật tiết học thành công!");
      onClose();
    } catch (error) {
      console.error("Error saving session:", error);
      message.error("Có lỗi xảy ra khi lưu tiết học!");
    }
    setLoading(false);
  };

  const handleClear = () => {
    form.resetFields();
  };

  const getModalTitle = () => {
    if (context) {
      const currentTimeSlot = getTimeSlotById(context.sessionIndex);
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FaBook style={{ color: "#1976d2", fontSize: "18px" }} />
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>
              {sessionData ? "Chỉnh sửa tiết học" : "Thêm tiết học"}
            </div>
            <div style={{ fontSize: "14px", color: "#666", fontWeight: 400 }}>
              {context.className} - {context.dayName} - {currentTimeSlot?.label}
              ({currentTimeSlot?.startTime} - {currentTimeSlot?.endTime})
            </div>
          </div>
        </div>
      );
    }
    return "Chỉnh sửa tiết học";
  };

  return (
    <Modal
      title={getModalTitle()}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: "20px" }}
      >
        {/* Hiển thị thông tin tiết học */}
        <Card
          style={{ marginBottom: 16, background: "#f6f8fa" }}
          bodyStyle={{
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontWeight: 500 }}>
            Thời gian:&nbsp;
            <span style={{ color: "#1976d2" }}>
              {context?.dayDisplay} - {context?.dateDisplay} (
              {context?.slotLabel}: {context?.startTime} - {context?.endTime})
            </span>
          </span>
        </Card>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <Form.Item
            label={
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FaBook style={{ color: "#1976d2" }} />
                Môn học
              </span>
            }
            name="subject"
            rules={[{ required: true, message: "Vui lòng chọn môn học!" }]}
          >
            <Select
              placeholder="Chọn môn học"
              loading={loadingData}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              style={{ height: "40px" }}
            >
              {subjects.map((subject) => (
                <Option key={subject.id} value={subject.name}>
                  {subject.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FaUser style={{ color: "#1976d2" }} />
                Giáo viên
              </span>
            }
            name="teacher"
            rules={[{ required: true, message: "Vui lòng chọn giáo viên!" }]}
          >
            <Select
              placeholder="Chọn giáo viên"
              loading={loadingData}
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              style={{ height: "40px" }}
            >
              {teachers.map((teacher) => (
                <Option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          label={
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaHome style={{ color: "#1976d2" }} />
              Phòng học
            </span>
          }
          name="room"
        >
          <Input
            placeholder="Nhập phòng học (VD: A101, Lab01...)"
            style={{ height: "40px" }}
          />
        </Form.Item>

        <Form.Item
          label={
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaStickyNote style={{ color: "#1976d2" }} />
              Ghi chú
            </span>
          }
          name="note"
        >
          <TextArea
            placeholder="Ghi chú thêm (tùy chọn)"
            rows={3}
            style={{ resize: "none" }}
          />
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "24px",
          }}
        >
          <Space>
            <Button onClick={handleClear} disabled={loading}>
              Xóa trắng
            </Button>
          </Space>

          <Space>
            <Button onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                backgroundColor: "#1976d2",
                borderColor: "#1976d2",
              }}
            >
              {sessionData ? "Cập nhật tiết học" : "Thêm tiết học"}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default TimetableEditModal;
