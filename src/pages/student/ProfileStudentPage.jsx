import React, { useState, useEffect, useRef } from "react";
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
  Space,
  Modal,
  Typography,
  Skeleton,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  CameraOutlined,
  LockOutlined,
} from "@ant-design/icons";
import {
  getMyProfile,
  getMyParent,
  getMyClass,
  updateMyProfile,
  changePassword,
  getMyAttendance,
  getMyTuition,
} from "../../services/studentServices/profileService";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

export default function ProfileStudent() {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [parentInfo, setParentInfo] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const fileInputRef = useRef();

  // load helper so we can refresh after save/avatar update
  useEffect(() => {
    let mounted = true;
    console.log(currentUser);
    const load = async () => {
      setLoading(true);
      try {
        const profile = await getMyProfile();
        if (!mounted) return;

        // fetch related parent & class in parallel
        const [parent, cls] = await Promise.all([getMyParent(), getMyClass()]);

        const values = {
          name: profile?.name || currentUser?.name || "Học sinh",
          email: profile?.email || currentUser?.email || "",
          phone: profile?.phone || "",
          classId: profile?.classId || (cls && cls.name) || "",
          subjects: profile?.subjects || [],
          goalsWeekly: profile?.goalsWeekly || "",
          goalsMonthly: profile?.goalsMonthly || "",
          competency: profile?.competency || "",
          avatar: profile?.avatar || currentUser?.avatar || "",
          age: profile?.age || null,
          address: profile?.address || "",
        };

        form.setFieldsValue(values);
        setAvatarPreview(values.avatar);
        setParentInfo(parent || null);
        setClassInfo(cls || null);
      } catch (err) {
        console.error(err);
        message.warn(
          "Không thể tải hồ sơ. Kiểm tra kết nối hoặc đăng nhập lại."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [currentUser, form]);

  const reloadProfile = async () => {
    setLoading(true);
    try {
      const profile = await getMyProfile();
      const [parent, cls] = await Promise.all([getMyParent(), getMyClass()]);
      const values = {
        name: profile?.name || currentUser?.name || "Học sinh",
        email: profile?.email || currentUser?.email || "",
        phone: profile?.phone || "",
        classId: profile?.classId || (cls && cls.name) || "",
        subjects: profile?.subjects || [],
        goalsWeekly: profile?.goalsWeekly || "",
        goalsMonthly: profile?.goalsMonthly || "",
        competency: profile?.competency || "",
        avatar: profile?.avatar || currentUser?.avatar || "",
        age: profile?.age || null,
        address: profile?.address || "",
      };
      form.setFieldsValue(values);
      setAvatarPreview(values.avatar);
      setParentInfo(parent || null);
      setClassInfo(cls || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await updateMyProfile(null, values);
      message.success("Cập nhật thông tin thành công");
      setEditing(false);
      await reloadProfile();
    } catch (err) {
      console.error(err);
      message.error(err?.message || "Có lỗi khi cập nhật thông tin");
    } finally {
      setLoading(false);
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
      await updateMyProfile(null, { avatar: base64 });
      message.success("Ảnh đại diện đã được cập nhật");
      await reloadProfile();
    } catch (err) {
      console.error(err);
      message.error("Không thể tải ảnh lên");
    }
  };

  const openFileDialog = () => {
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleChangePassword = async (values) => {
    const { newPassword, confirmPassword } = values;
    if (!newPassword || newPassword.length < 6) {
      message.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setChangingPwd(true);
    try {
      await changePassword(newPassword);
      message.success("Đổi mật khẩu thành công");
      setPwdModalVisible(false);
    } catch (err) {
      console.error(err);
      message.error(
        err?.message ||
          "Không thể đổi mật khẩu. Vui lòng đăng nhập lại và thử lại."
      );
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Row
        gutter={16}
        justify="space-between"
        align="middle"
        style={{ marginBottom: 18 }}
      >
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Hồ sơ cá nhân
          </Title>
          <Text type="secondary">Quản lý thông tin tài khoản học sinh</Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<LockOutlined />}
              onClick={() => setPwdModalVisible(true)}
              type="default"
            >
              Đổi mật khẩu
            </Button>
            <Button
              icon={<EditOutlined />}
              type={editing ? "primary" : "default"}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Đang chỉnh sửa" : "Chỉnh sửa"}
            </Button>
          </Space>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <Skeleton loading={loading} active avatar>
          <Row gutter={20} align="middle">
            <Col>
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  size={120}
                  src={avatarPreview || form.getFieldValue("avatar")}
                  icon={
                    !avatarPreview && !form.getFieldValue("avatar") ? (
                      <UserOutlined />
                    ) : null
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
                    icon={<CameraOutlined />}
                    onClick={openFileDialog}
                  >
                    Ảnh đại diện
                  </Button>
                </div>
              </div>
            </Col>
            <Col flex="auto">
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {form.getFieldValue("name") || "—"}
              </div>
              <div style={{ color: "#666", marginTop: 6 }}>
                {classInfo?.name || form.getFieldValue("classId")}
              </div>
              <div style={{ color: "#666", marginTop: 6 }}>
                {form.getFieldValue("email")}
              </div>
              {/* parent summary */}
              {parentInfo ? (
                <div style={{ color: "#444", marginTop: 8 }}>
                  Phụ huynh:{" "}
                  <strong>
                    {parentInfo.name || parentInfo.parentName || "—"}
                  </strong>
                  {parentInfo.phoneNumber || parentInfo.phone ? (
                    <span style={{ marginLeft: 12, color: "#666" }}>
                      {parentInfo.phoneNumber || parentInfo.phone}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </Col>
          </Row>
        </Skeleton>
      </Card>

      <Card style={{ borderRadius: 12, marginTop: 20 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{}}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              >
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
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
            <Col xs={24} sm={8}>
              <Form.Item name="phone" label="Điện thoại">
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="classId" label="Lớp">
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="age" label="Tuổi">
                <InputNumber disabled={!editing} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="subjects" label="Môn học">
                <Input disabled={!editing} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
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
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Lưu thay đổi
                  </Button>
                  <Button
                    onClick={() => {
                      form.resetFields();
                      setEditing(false);
                    }}
                  >
                    Hủy
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>Chỉnh sửa</Button>
              )}
            </div>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="Đổi mật khẩu"
        open={pwdModalVisible}
        onCancel={() => setPwdModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[{ required: true, message: "Nhập mật khẩu mới" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            rules={[{ required: true, message: "Xác nhận mật khẩu" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setPwdModalVisible(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={changingPwd}>
                Đổi mật khẩu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
