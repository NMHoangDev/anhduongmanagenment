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
  Tabs,
  DatePicker,
  Select,
  Divider,
  Upload,
  Tag,
  Badge,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  CameraOutlined,
  LockOutlined,
  SaveOutlined,
  CloseOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  ContactsOutlined,
  SettingOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  getMyProfile,
  updateBasicInfo,
  updateAvatar,
  updateContactInfo,
  syncStudentToUser,
  changePassword,
} from "../../services/studentServices/profileService";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ProfileStudent() {
  const { currentUser } = useAuth();
  const [form] = Form.useForm();
  const [contactForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const [editing, setEditing] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [parentInfo, setParentInfo] = useState(null);
  const [classInfo, setClassInfo] = useState(null);

  // Load profile data
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const profileData = await getMyProfile(currentUser?.id);
        if (!mounted) return;

        if (profileData) {
          setProfile(profileData);
          setParentInfo(profileData.parent);
          setClassInfo(profileData.class);

          // Set form values
          const values = {
            name: profileData.name || "",
            email: profileData.email || "",
            phone: profileData.phone || profileData.contact?.phone || "",
            gender: profileData.gender || "",
            dob: profileData.dob ? dayjs(profileData.dob) : null,
            address: profileData.address || profileData.contact?.address || "",
            goalsWeekly: profileData.goalsWeekly || "",
            goalsMonthly: profileData.goalsMonthly || "",
            competency: profileData.competency || "",
          };

          form.setFieldsValue(values);
          contactForm.setFieldsValue({
            phone: profileData.contact?.phone || profileData.phone || "",
            address: profileData.contact?.address || profileData.address || "",
            emergencyContact: profileData.contact?.emergencyContact || "",
          });
          setAvatarPreview(profileData.avatar);
        }
      } catch (err) {
        console.error("Load profile error:", err);
        message.error("Không thể tải thông tin hồ sơ");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (currentUser) {
      loadProfile();
    }

    return () => {
      mounted = false;
    };
  }, [currentUser, form, contactForm]);

  // Reload profile after update
  const reloadProfile = async () => {
    try {
      const profileData = await getMyProfile(currentUser?.id);
      if (profileData) {
        setProfile(profileData);
        setParentInfo(profileData.parent);
        setClassInfo(profileData.class);
      }
    } catch (err) {
      console.error("Reload profile error:", err);
    }
  };

  // Handle basic info update
  const handleBasicInfoSave = async (values) => {
    setUpdateLoading(true);
    try {
      const updateData = {
        ...values,
        dob: values.dob ? values.dob.toDate() : null,
      };

      await updateBasicInfo(currentUser?.id, updateData);
      message.success("Cập nhật thông tin thành công");
      setEditing(false);
      await reloadProfile();
    } catch (err) {
      console.error("Update basic info error:", err);
      message.error(err?.message || "Có lỗi khi cập nhật thông tin");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle contact info update
  const handleContactSave = async (values) => {
    setUpdateLoading(true);
    try {
      await updateContactInfo(currentUser?.id, { contact: values });
      message.success("Cập nhật thông tin liên hệ thành công");
      setEditingContact(false);
      await reloadProfile();
    } catch (err) {
      console.error("Update contact error:", err);
      message.error(err?.message || "Có lỗi khi cập nhật thông tin liên hệ");
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (file) => {
    try {
      const base64 = await fileToBase64(file);
      setAvatarPreview(base64);

      await updateAvatar(currentUser?.id, base64);
      message.success("Cập nhật ảnh đại diện thành công");
      await reloadProfile();
    } catch (err) {
      console.error("Update avatar error:", err);
      message.error("Không thể cập nhật ảnh đại diện");
    }
    return false;
  };

  // Convert file to base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });

  // Handle password change
  const handleChangePassword = async (values) => {
    const { currentPassword, newPassword, confirmPassword } = values;

    if (newPassword !== confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setChangingPwd(true);
    try {
      await changePassword(newPassword, currentPassword);
      message.success("Đổi mật khẩu thành công");
      setPwdModalVisible(false);
      passwordForm.resetFields();
    } catch (err) {
      console.error("Change password error:", err);
      if (err.code === "auth/requires-recent-login") {
        message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
      } else if (err.code === "auth/wrong-password") {
        message.error("Mật khẩu hiện tại không đúng");
      } else {
        message.error(err?.message || "Không thể đổi mật khẩu");
      }
    } finally {
      setChangingPwd(false);
    }
  };

  // Handle sync data
  const handleSyncData = async () => {
    setSyncLoading(true);
    try {
      await syncStudentToUser(currentUser?.id);
      message.success("Đồng bộ dữ liệu thành công");
      await reloadProfile();
    } catch (err) {
      console.error("Sync error:", err);
      message.error("Không thể đồng bộ dữ liệu");
    } finally {
      setSyncLoading(false);
    }
  };

  // Upload props for avatar
  const uploadProps = {
    beforeUpload: handleAvatarChange,
    showUploadList: false,
    accept: "image/*",
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "clamp(1rem, 4vw, 2rem)",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <Skeleton active />
      </div>
    );
  }

  const tabItems = [
    {
      key: "1",
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "clamp(0.75rem, 3vw, 0.875rem)",
          }}
        >
          <InfoCircleOutlined />
          <span className="hidden-xs">Thông tin cơ bản</span>
        </span>
      ),
      children: (
        <div style={{ padding: "clamp(1rem, 3vw, 2rem)" }}>
          {/* Basic Info Form */}
          <Row
            justify="space-between"
            align="middle"
            style={{
              marginBottom: "clamp(1rem, 3vw, 1.5rem)",
              flexDirection: window.innerWidth < 576 ? "column" : "row",
              gap: window.innerWidth < 576 ? "1rem" : "0",
            }}
          >
            <Col xs={24} sm="auto">
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: "#1890ff",
                  fontSize: "clamp(1rem, 4vw, 1.25rem)",
                  textAlign: window.innerWidth < 576 ? "center" : "left",
                }}
              >
                Thông tin cá nhân
              </Title>
            </Col>
            <Col xs={24} sm="auto">
              <Space
                style={{
                  width: "100%",
                  justifyContent:
                    window.innerWidth < 576 ? "center" : "flex-end",
                }}
              >
                {editing && (
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      form.resetFields();
                      setEditing(false);
                    }}
                    size={window.innerWidth < 576 ? "middle" : "small"}
                  >
                    Hủy
                  </Button>
                )}
                <Button
                  icon={editing ? <SaveOutlined /> : <EditOutlined />}
                  type={editing ? "primary" : "default"}
                  onClick={() => {
                    if (editing) {
                      form.submit();
                    } else {
                      setEditing(true);
                    }
                  }}
                  loading={updateLoading}
                  size={window.innerWidth < 576 ? "middle" : "small"}
                >
                  {editing ? "Lưu" : "Chỉnh sửa"}
                </Button>
              </Space>
            </Col>
          </Row>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleBasicInfoSave}
            disabled={!editing}
          >
            <Row
              gutter={[
                window.innerWidth < 576
                  ? 16
                  : window.innerWidth < 768
                  ? 20
                  : 24,
                16,
              ]}
            >
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="name"
                  label="Họ và tên"
                  rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                >
                  <Input
                    placeholder="Nhập họ và tên"
                    prefix={<UserOutlined />}
                    size={window.innerWidth < 576 ? "middle" : "large"}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ type: "email", message: "Email không hợp lệ" }]}
                >
                  <Input
                    placeholder="Nhập email"
                    prefix={<MailOutlined />}
                    size={window.innerWidth < 576 ? "middle" : "large"}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item name="phone" label="Số điện thoại">
                  <Input
                    placeholder="Nhập số điện thoại"
                    prefix={<PhoneOutlined />}
                    size={window.innerWidth < 576 ? "middle" : "large"}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row
              gutter={[
                window.innerWidth < 576
                  ? 16
                  : window.innerWidth < 768
                  ? 20
                  : 24,
                16,
              ]}
            >
              <Col xs={24} sm={12} lg={6}>
                <Form.Item name="gender" label="Giới tính">
                  <Select
                    placeholder="Chọn giới tính"
                    allowClear
                    size={window.innerWidth < 576 ? "middle" : "large"}
                  >
                    <Option value="Nam">Nam</Option>
                    <Option value="Nữ">Nữ</Option>
                    <Option value="Khác">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Form.Item name="dob" label="Ngày sinh">
                  <DatePicker
                    style={{ width: "100%" }}
                    placeholder="Chọn ngày sinh"
                    format="DD/MM/YYYY"
                    size={window.innerWidth < 576 ? "middle" : "large"}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item name="address" label="Địa chỉ">
                  <Input
                    placeholder="Nhập địa chỉ"
                    prefix={<HomeOutlined />}
                    size={window.innerWidth < 576 ? "middle" : "large"}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row
              gutter={[
                window.innerWidth < 576
                  ? 16
                  : window.innerWidth < 768
                  ? 20
                  : 24,
                16,
              ]}
            >
              <Col xs={24} lg={12}>
                <Form.Item name="competency" label="Năng lực hiện tại">
                  <Input.TextArea
                    rows={3}
                    placeholder="Mô tả năng lực hiện tại"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item name="goalsWeekly" label="Mục tiêu tuần">
                  <Input.TextArea
                    rows={3}
                    placeholder="Mô tả mục tiêu học tập trong tuần"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="goalsMonthly" label="Mục tiêu tháng">
              <Input.TextArea
                rows={3}
                placeholder="Mô tả mục tiêu học tập trong tháng"
              />
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "clamp(0.75rem, 3vw, 0.875rem)",
          }}
        >
          <ContactsOutlined />
          <span className="hidden-xs">Liên hệ</span>
        </span>
      ),
      children: (
        <div style={{ padding: "clamp(1rem, 3vw, 2rem)" }}>
          <Row
            justify="space-between"
            align="middle"
            style={{
              marginBottom: "clamp(1rem, 3vw, 1.5rem)",
              flexDirection: window.innerWidth < 576 ? "column" : "row",
              gap: window.innerWidth < 576 ? "1rem" : "0",
            }}
          >
            <Col xs={24} sm="auto">
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: "#1890ff",
                  fontSize: "clamp(1rem, 4vw, 1.25rem)",
                  textAlign: window.innerWidth < 576 ? "center" : "left",
                }}
              >
                Thông tin liên hệ
              </Title>
            </Col>
            <Col xs={24} sm="auto">
              <Space
                style={{
                  width: "100%",
                  justifyContent:
                    window.innerWidth < 576 ? "center" : "flex-end",
                }}
              >
                {editingContact && (
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      contactForm.resetFields();
                      setEditingContact(false);
                    }}
                    size={window.innerWidth < 576 ? "middle" : "small"}
                  >
                    Hủy
                  </Button>
                )}
                <Button
                  icon={editingContact ? <SaveOutlined /> : <EditOutlined />}
                  type={editingContact ? "primary" : "default"}
                  onClick={() => {
                    if (editingContact) {
                      contactForm.submit();
                    } else {
                      setEditingContact(true);
                    }
                  }}
                  loading={updateLoading}
                  size={window.innerWidth < 576 ? "middle" : "small"}
                >
                  {editingContact ? "Lưu" : "Chỉnh sửa"}
                </Button>
              </Space>
            </Col>
          </Row>

          <Form
            form={contactForm}
            layout="vertical"
            onFinish={handleContactSave}
            disabled={!editingContact}
          >
            <Row
              gutter={[
                window.innerWidth < 576
                  ? 16
                  : window.innerWidth < 768
                  ? 20
                  : 24,
                16,
              ]}
            >
              <Col xs={24} sm={12}>
                <Form.Item name="phone" label="Số điện thoại">
                  <Input
                    placeholder="Nhập số điện thoại"
                    prefix={<PhoneOutlined />}
                    size={window.innerWidth < 576 ? "middle" : "large"}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="emergencyContact" label="Liên hệ khẩn cấp">
                  <Input
                    placeholder="Số điện thoại khẩn cấp"
                    prefix={<ExclamationCircleOutlined />}
                    size={window.innerWidth < 576 ? "middle" : "large"}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="address" label="Địa chỉ chi tiết">
              <Input.TextArea rows={4} placeholder="Nhập địa chỉ chi tiết" />
            </Form.Item>
          </Form>

          {/* Parent Contact Info */}
          {parentInfo && (
            <Card
              size="small"
              title={
                <span style={{ color: "#1890ff" }}>
                  <TeamOutlined style={{ marginRight: "0.5rem" }} />
                  Thông tin phụ huynh
                </span>
              }
              style={{
                marginTop: "clamp(1rem, 3vw, 1.5rem)",
                borderRadius: "0.75rem",
              }}
              bodyStyle={{
                padding: "clamp(1rem, 3vw, 1.5rem)",
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <UserOutlined style={{ color: "#1890ff" }} />
                    <Text type="secondary">Họ tên:</Text>
                    <Text strong>{parentInfo.name || "—"}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <PhoneOutlined style={{ color: "#1890ff" }} />
                    <Text type="secondary">Số điện thoại:</Text>
                    <Text>
                      {parentInfo.phoneNumber || parentInfo.phone || "—"}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: "3",
      label: (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "clamp(0.75rem, 3vw, 0.875rem)",
          }}
        >
          <SettingOutlined />
          <span className="hidden-xs">Cài đặt</span>
        </span>
      ),
      children: (
        <div style={{ padding: "clamp(1rem, 3vw, 2rem)" }}>
          <Title
            level={4}
            style={{
              color: "#1890ff",
              marginBottom: "clamp(1rem, 3vw, 1.5rem)",
              fontSize: "clamp(1rem, 4vw, 1.25rem)",
              textAlign: window.innerWidth < 576 ? "center" : "left",
            }}
          >
            Cài đặt tài khoản
          </Title>

          <Row
            gutter={[
              window.innerWidth < 576 ? 16 : window.innerWidth < 768 ? 20 : 24,
              window.innerWidth < 576 ? 16 : 24,
            ]}
          >
            <Col xs={24} sm={12} lg={8}>
              <Card
                hoverable
                style={{
                  height: "100%",
                  borderRadius: "0.75rem",
                  border: "1px solid #e8f4fd",
                }}
                bodyStyle={{
                  textAlign: "center",
                  padding: "clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 1rem)",
                }}
              >
                <LockOutlined
                  style={{
                    fontSize: "clamp(1.5rem, 5vw, 2rem)",
                    color: "#1890ff",
                    marginBottom: "1rem",
                  }}
                />
                <Title
                  level={5}
                  style={{ fontSize: "clamp(0.875rem, 3vw, 1rem)" }}
                >
                  Bảo mật
                </Title>
                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    marginBottom: "1rem",
                    fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)",
                  }}
                >
                  Thay đổi mật khẩu để bảo vệ tài khoản
                </Text>
                <Button
                  type="primary"
                  onClick={() => setPwdModalVisible(true)}
                  block
                  size={window.innerWidth < 576 ? "middle" : "default"}
                >
                  Đổi mật khẩu
                </Button>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card
                hoverable
                style={{
                  height: "100%",
                  borderRadius: "0.75rem",
                  border: "1px solid #e8f4fd",
                }}
                bodyStyle={{
                  textAlign: "center",
                  padding: "clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 1rem)",
                }}
              >
                <SyncOutlined
                  style={{
                    fontSize: "clamp(1.5rem, 5vw, 2rem)",
                    color: "#52c41a",
                    marginBottom: "1rem",
                  }}
                />
                <Title
                  level={5}
                  style={{ fontSize: "clamp(0.875rem, 3vw, 1rem)" }}
                >
                  Đồng bộ dữ liệu
                </Title>
                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    marginBottom: "1rem",
                    fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)",
                  }}
                >
                  Đồng bộ thông tin giữa các hệ thống
                </Text>
                <Button
                  type="primary"
                  ghost
                  onClick={handleSyncData}
                  loading={syncLoading}
                  block
                  size={window.innerWidth < 576 ? "middle" : "default"}
                >
                  Đồng bộ ngay
                </Button>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card
                style={{
                  height: "100%",
                  borderRadius: "0.75rem",
                  border: "1px solid #e8f4fd",
                }}
                bodyStyle={{
                  textAlign: "center",
                  padding: "clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 1rem)",
                }}
              >
                <Badge
                  status={profile?.isActive ? "success" : "error"}
                  style={{
                    fontSize: "clamp(1.5rem, 5vw, 2rem)",
                    marginBottom: "1rem",
                  }}
                />
                <Title
                  level={5}
                  style={{ fontSize: "clamp(0.875rem, 3vw, 1rem)" }}
                >
                  Trạng thái tài khoản
                </Title>
                <Tag
                  color={profile?.isActive ? "success" : "error"}
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)",
                  }}
                >
                  {profile?.isActive ? "Đang hoạt động" : "Không hoạt động"}
                </Tag>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "clamp(0.75rem, 3vw, 1.5rem)",
        maxWidth: "1200px",
        margin: "0 auto",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      {/* Modern Header */}
      <div
        style={{
          marginBottom: "clamp(1.5rem, 4vw, 2rem)",
          padding: "clamp(0.5rem, 2vw, 1rem)",
        }}
      >
        <Row justify="space-between" align="top" gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <div style={{ marginBottom: "1rem" }}>
              <Title
                level={1}
                style={{
                  margin: 0,
                  fontSize: "clamp(1.5rem, 6vw, 2.5rem)",
                  background:
                    "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700,
                  textAlign: window.innerWidth < 576 ? "center" : "left",
                }}
              >
                Hồ sơ cá nhân
              </Title>
              <Text
                type="secondary"
                style={{
                  fontSize: "clamp(0.875rem, 3vw, 1.125rem)",
                  display: "block",
                  textAlign: window.innerWidth < 576 ? "center" : "left",
                }}
              >
                Quản lý thông tin tài khoản học sinh
              </Text>
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <Space
              wrap
              style={{
                width: "100%",
                justifyContent: window.innerWidth < 576 ? "center" : "flex-end",
              }}
            >
              <Tooltip title="Đồng bộ dữ liệu">
                <Button
                  icon={<SyncOutlined />}
                  onClick={handleSyncData}
                  loading={syncLoading}
                  type="text"
                  shape="circle"
                  size={window.innerWidth < 576 ? "middle" : "default"}
                />
              </Tooltip>
              <Button
                icon={<LockOutlined />}
                onClick={() => setPwdModalVisible(true)}
                type="primary"
                ghost
                size={window.innerWidth < 576 ? "middle" : "default"}
              >
                Đổi mật khẩu
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Profile Header Card */}
      <Card
        style={{
          borderRadius: "1rem",
          boxShadow: "0 4px 20px rgba(24, 144, 255, 0.1)",
          marginBottom: "clamp(1.5rem, 4vw, 2rem)",
          border: "1px solid #e8f4fd",
        }}
        bodyStyle={{ padding: "clamp(1.5rem, 4vw, 2rem)" }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={8} md={6} lg={4}>
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  size={{
                    xs: 120,
                    sm: 140,
                    md: 160,
                    lg: 180,
                  }}
                  src={avatarPreview || profile?.avatar}
                  icon={
                    !avatarPreview && !profile?.avatar ? <UserOutlined /> : null
                  }
                  style={{
                    border: "4px solid #fff",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                />
                <Upload {...uploadProps}>
                  <Button
                    size={window.innerWidth < 576 ? "small" : "middle"}
                    icon={<CameraOutlined />}
                    type="primary"
                    shape="circle"
                    style={{
                      position: "absolute",
                      bottom: "0.5rem",
                      right: "0.5rem",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                </Upload>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={16} md={18} lg={20}>
            <div>
              <Title
                level={2}
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "clamp(1.25rem, 5vw, 2rem)",
                  color: "#1890ff",
                  textAlign: window.innerWidth < 576 ? "center" : "left",
                }}
              >
                {profile?.name || "Chưa cập nhật"}
              </Title>
              <Row
                gutter={[
                  window.innerWidth < 576 ? 12 : 24,
                  window.innerWidth < 576 ? 8 : 12,
                ]}
              >
                <Col xs={24} sm={12} lg={8}>
                  <Space wrap>
                    <BookOutlined style={{ color: "#1890ff" }} />
                    <Text type="secondary">Lớp:</Text>
                    <Tag
                      color="blue"
                      style={{ fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)" }}
                    >
                      {classInfo?.name || profile?.classId || "—"}
                    </Tag>
                  </Space>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Space wrap>
                    <MailOutlined style={{ color: "#1890ff" }} />
                    <Text type="secondary">Email:</Text>
                    <Text
                      copyable
                      style={{ fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)" }}
                    >
                      {profile?.email || "—"}
                    </Text>
                  </Space>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Space wrap>
                    <CalendarOutlined style={{ color: "#1890ff" }} />
                    <Text type="secondary">Ngày sinh:</Text>
                    <Text
                      style={{ fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)" }}
                    >
                      {profile?.dob
                        ? dayjs(profile.dob).format("DD/MM/YYYY")
                        : "—"}
                    </Text>
                  </Space>
                </Col>
              </Row>
              {parentInfo && (
                <div
                  style={{
                    marginTop: "1rem",
                    textAlign: window.innerWidth < 576 ? "center" : "left",
                  }}
                >
                  <Space wrap>
                    <TeamOutlined style={{ color: "#52c41a" }} />
                    <Text type="secondary">Phụ huynh:</Text>
                    <Text strong>{parentInfo.name || "—"}</Text>
                    {parentInfo.phoneNumber && (
                      <Tag
                        color="green"
                        style={{ fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)" }}
                      >
                        {parentInfo.phoneNumber}
                      </Tag>
                    )}
                  </Space>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Tabs Content */}
      <Card
        style={{
          borderRadius: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "none",
        }}
        bodyStyle={{ padding: "0" }}
      >
        <Tabs
          items={tabItems}
          type="card"
          size={window.innerWidth < 576 ? "middle" : "large"}
          tabBarStyle={{
            margin: 0,
            paddingLeft: "clamp(1rem, 3vw, 1.5rem)",
            paddingRight: "clamp(1rem, 3vw, 1.5rem)",
            background: "#fafafa",
          }}
        />
      </Card>

      {/* Password Change Modal */}
      <Modal
        title={
          <span style={{ color: "#1890ff" }}>
            <LockOutlined style={{ marginRight: "0.5rem" }} />
            Đổi mật khẩu
          </span>
        }
        open={pwdModalVisible}
        onCancel={() => {
          setPwdModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={window.innerWidth < 576 ? "95%" : "90%"}
        style={{ maxWidth: "480px" }}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          style={{ marginTop: "1rem" }}
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: "Nhập mật khẩu hiện tại" }]}
          >
            <Input.Password
              placeholder="Nhập mật khẩu hiện tại"
              size={window.innerWidth < 576 ? "middle" : "large"}
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: "Nhập mật khẩu mới" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password
              placeholder="Nhập mật khẩu mới"
              size={window.innerWidth < 576 ? "middle" : "large"}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            rules={[{ required: true, message: "Xác nhận mật khẩu" }]}
          >
            <Input.Password
              placeholder="Nhập lại mật khẩu mới"
              size={window.innerWidth < 576 ? "middle" : "large"}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: "2rem" }}>
            <Space
              style={{
                width: "100%",
                justifyContent: "flex-end",
                flexDirection: window.innerWidth < 576 ? "column" : "row",
              }}
            >
              <Button
                onClick={() => {
                  setPwdModalVisible(false);
                  passwordForm.resetFields();
                }}
                size={window.innerWidth < 576 ? "middle" : "large"}
                block={window.innerWidth < 576}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={changingPwd}
                size={window.innerWidth < 576 ? "middle" : "large"}
                block={window.innerWidth < 576}
              >
                Đổi mật khẩu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        @media (max-width: 576px) {
          .hidden-xs {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
