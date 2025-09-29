import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Modal,
  message,
} from "antd";
import { UserOutlined, EditOutlined } from "@ant-design/icons";
import {
  updateProfileForTeacher,
  updateAvatarForUid,
} from "../../services/teacherServices/profileTeacherService";
import { useAuth } from "../../context/AuthContext";

const { Option } = Select;

export default function TeacherProfile() {
  const { currentUser } = useAuth();

  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = React.createRef();

  // Fill form when currentUser changes
  useEffect(() => {
    form.setFieldsValue({
      name: currentUser?.name || "Nguyễn Văn Bình",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
      subject: currentUser?.subjects || "Toán",
      gradeLevel: currentUser?.gradeLevel || "",
      teachingExperience: currentUser?.teachingExperience || 0,
      qualifications: currentUser?.qualifications || "",
      address: currentUser?.address || "",
      gender: currentUser?.gender || "Nam",
      age: currentUser?.age || 30,
      avatar: currentUser?.avatar || "",
    });
    setAvatarPreview(currentUser?.avatar || "");
  }, [currentUser, form]);

  const handleSave = async (values) => {
    try {
      // teacherId in `teachers` collection might be stored as currentUser.uid or another id mapping
      // We pass teacherId as currentUser.uid when possible; the service will also read teacher doc to find uid if needed
      const teacherId = currentUser?.uid || values.id;
      await updateProfileForTeacher(teacherId, {
        ...values,
        uid: currentUser?.uid,
      });
      message.success("Cập nhật thông tin thành công");
      setEditing(false);
    } catch (err) {
      console.error(err);
      message.error("Có lỗi khi cập nhật thông tin");
    }
  };

  const handleChangePassword = (values) => {
    // Placeholder: implement real password change with auth service if needed
    console.log("Change password values:", values);
    message.success("Đổi mật khẩu thành công (giả lập)");
    setPwModalVisible(false);
  };

  const profileValues = form.getFieldsValue();

  const handleAvatarClick = () => {
    if (fileInputRef?.current) fileInputRef.current.click();
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
      // preview locally
      setAvatarPreview(base64);
      form.setFieldsValue({ avatar: base64 });

      // Save to backend (users and teachers)
      if (currentUser?.uid) {
        await updateAvatarForUid(currentUser.uid, base64);
        message.success("Ảnh đại diện đã được cập nhật");
      } else {
        message.warning("Không tìm thấy người dùng hiện tại để lưu ảnh");
      }
    } catch (err) {
      console.error(err);
      message.error("Không thể tải ảnh lên");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18 }}>
        Thông tin cá nhân
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
                <Button size="small" onClick={handleAvatarClick}>
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
              {profileValues?.subject}
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
              <Form.Item name="gender" label="Giới tính">
                <Select disabled={!editing}>
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                </Select>
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
              <Form.Item name="subject" label="Bộ môn">
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gradeLevel" label="Khối dạy">
                <Select disabled={!editing} allowClear>
                  <Option value="1">Khối 1</Option>
                  <Option value="2">Khối 2</Option>
                  <Option value="3">Khối 3</Option>
                  <Option value="4">Khối 4</Option>
                  <Option value="5">Khối 5</Option>
                  <Option value="Tất cả">Tất cả</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="teachingExperience" label="Số năm kinh nghiệm">
                <InputNumber
                  disabled={!editing}
                  style={{ width: "100%" }}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="qualifications" label="Bằng cấp / Chứng chỉ">
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
          </Row>

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
                <Button onClick={() => setPwModalVisible(true)}>
                  Đổi mật khẩu
                </Button>
              )}
            </div>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="Đổi mật khẩu"
        visible={pwModalVisible}
        onCancel={() => setPwModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="oldPassword"
            label="Mật khẩu cũ"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={["newPassword"]}
            rules={[
              {
                required: true,
                min: 6,
                message: "Xác nhận mật khẩu không khớp",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp")
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <Button onClick={() => setPwModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">
                Lưu
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
