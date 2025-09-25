import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Form,
  Input,
  InputNumber,
  Button,
  message,
} from "antd";
import { UserOutlined, EditOutlined } from "@ant-design/icons";
import {
  updateProfileForStudent,
  updateAvatarForUid,
} from "../../services/teacherServices/profileTeacherService";
import { useAuth } from "../../context/AuthContext";

export default function ProfileStudent() {
  const { currentUser } = useAuth();

  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = React.createRef();

  useEffect(() => {
    form.setFieldsValue({
      name: currentUser?.name || "Học sinh",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
      classId: currentUser?.classId || "",
      subjects: currentUser?.subjects || [],
      goalsWeekly: currentUser?.goalsWeekly || "",
      goalsMonthly: currentUser?.goalsMonthly || "",
      competency: currentUser?.competency || "",
      avatar: currentUser?.avatar || "",
    });
    setAvatarPreview(currentUser?.avatar || "");
  }, [currentUser, form]);

  const handleSave = async (values) => {
    try {
      const studentId = currentUser?.uid || values.id;
      await updateProfileForStudent(studentId, {
        ...values,
        uid: currentUser?.uid,
      });
      message.success("Cập nhật thông tin học sinh thành công");
      setEditing(false);
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi cập nhật thông tin");
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setAvatarPreview(base64);
      form.setFieldsValue({ avatar: base64 });
      if (currentUser?.uid) {
        await updateAvatarForUid(currentUser.uid, base64);
        message.success("Ảnh đại diện đã được cập nhật");
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể tải ảnh lên");
    }
  };

  const profileValues = form.getFieldsValue();

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18 }}>
        Hồ sơ học sinh
      </h1>

      <Card style={{ borderRadius: 12, marginBottom: 20 }}>
        <Row gutter={20} align="middle">
          <Col>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar
                size={96}
                src={avatarPreview || profileValues?.avatar}
                icon={
                  !avatarPreview && !profileValues?.avatar && <UserOutlined />
                }
              />
              <div style={{ position: "absolute", right: -6, bottom: -6 }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <Button
                  size="small"
                  onClick={() =>
                    fileInputRef.current && fileInputRef.current.click()
                  }
                >
                  Chọn ảnh
                </Button>
              </div>
            </div>
          </Col>
          <Col flex="auto">
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {profileValues?.name || "—"}
            </div>
            <div style={{ color: "#666", marginTop: 6 }}>
              {profileValues?.classId}
            </div>
            <div style={{ color: "#666", marginTop: 6 }}>
              {profileValues?.email}
            </div>
          </Col>
          <Col>
            <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>
              Chỉnh sửa
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{}}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: "email", message: "Email không hợp lệ" }]}
              >
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="phone" label="Điện thoại">
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="classId" label="Lớp">
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="age" label="Tuổi">
                <InputNumber disabled={!editing} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="subjects" label="Môn học">
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="competency" label="Năng lực hiện tại">
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="goalsWeekly" label="Mục tiêu tuần">
            <Input.TextArea disabled={!editing} />
          </Form.Item>

          <Form.Item name="goalsMonthly" label="Mục tiêu tháng">
            <Input.TextArea disabled={!editing} />
          </Form.Item>

          <Form.Item name="address" label="Địa chỉ">
            <Input disabled={!editing} />
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", gap: 8 }}>
              {editing ? (
                <>
                  <Button type="primary" htmlType="submit">
                    Lưu thay đổi
                  </Button>
                  <Button onClick={() => setEditing(false)}>Hủy</Button>
                </>
              ) : (
                <Button
                  onClick={() =>
                    message.info("Sử dụng nút Chỉnh sửa để cập nhật thông tin")
                  }
                >
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
