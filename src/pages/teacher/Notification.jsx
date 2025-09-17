import React, { useMemo, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  List,
  Tag,
  message,
  Select,
  Empty,
  Row,
  Col,
  Space,
  Badge,
  Segmented,
  Tooltip,
  Popover,
} from "antd";
import {
  FaBell,
  FaEllipsisV,
  FaTrashAlt,
  FaRegEnvelopeOpen,
} from "react-icons/fa";

const { Title, Text } = Typography;

const fakeNotifications = [
  {
    id: 1,
    title: "Lịch họp giáo viên",
    content: "Họp toàn trường vào 14h ngày 25/5.",
    date: "2024-05-20",
    read: false,
  },
  {
    id: 2,
    title: "Nhắc nhở nộp bài tập",
    content: "Hạn nộp bài tập Toán là 22/5.",
    date: "2024-05-18",
    read: true,
  },
];

export default function TeacherNotification() {
  const [notifications, setNotifications] = useState(fakeNotifications);
  const [createVisible, setCreateVisible] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [form] = Form.useForm();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const openCreate = () => setCreateVisible(true);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    message.success("Đã đánh dấu tất cả là đã đọc");
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const item = {
        id: notifications.length + 1,
        title: values.title,
        content: values.content,
        date: new Date().toLocaleDateString(),
        read: false,
        recipients: values.recipients || ["all"],
      };
      setNotifications((prev) => [item, ...prev]);
      form.resetFields();
      setCreateVisible(false);
      message.success("Đã gửi thông báo");
    } catch (err) {
      // validation failed
    }
  };

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const filtered = useMemo(() => {
    return notifications
      .filter((n) => (filter === "unread" ? !n.read : true))
      .filter(
        (n) =>
          n.title.toLowerCase().includes(query.toLowerCase()) ||
          n.content.toLowerCase().includes(query.toLowerCase())
      );
  }, [notifications, filter, query]);

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc muốn xóa thông báo này?",
      okText: "Xóa",
      okType: "danger",
      onOk: () => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        message.success("Đã xóa thông báo");
      },
    });
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f6f9fc 0%, #eef2ff 100%)",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <Card
        style={{ marginBottom: 18, borderRadius: 12 }}
        bodyStyle={{ padding: 12 }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Badge count={unreadCount} size="small" offset={[6, 6]}>
                <div
                  style={{
                    background: "linear-gradient(90deg, #eef2ff, #e9f5ff)",
                    padding: 10,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FaBell style={{ color: "#4066f5", fontSize: 18 }} />
                </div>
              </Badge>
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Thông báo
                </Title>
                <Text type="secondary">
                  Quản lý thông báo gửi tới học sinh, phụ huynh và giáo viên.
                </Text>
              </div>
            </div>
          </Col>

          <Col>
            <Space align="center" style={{ gap: 8 }}>
              <Input.Search
                placeholder="Tìm tiêu đề hoặc nội dung"
                allowClear
                onSearch={(v) => setQuery(v)}
                style={{ width: 320 }}
              />

              <Segmented
                value={filter}
                onChange={(v) => setFilter(v)}
                options={[
                  { label: "Tất cả", value: "all" },
                  { label: "Chưa đọc", value: "unread" },
                ]}
              />

              <Tooltip title="Đánh dấu tất cả là đã đọc">
                <Button onClick={handleMarkAllRead}>Đánh dấu đã đọc</Button>
              </Tooltip>

              <Button type="primary" onClick={openCreate}>
                Tạo
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
        {filtered.length === 0 ? (
          <Empty description="Không có thông báo" />
        ) : (
          <List
            dataSource={filtered}
            itemLayout="horizontal"
            renderItem={(item) => (
              <List.Item
                key={item.id}
                style={{
                  background: item.read ? "#fff" : "#fffaf0",
                  borderRadius: 10,
                  marginBottom: 12,
                  padding: 14,
                  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
                }}
                actions={[
                  <Button
                    key="read"
                    type="link"
                    onClick={() => toggleRead(item.id)}
                  >
                    {item.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                  </Button>,
                  <Popover
                    key="more"
                    placement="bottomRight"
                    content={
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <Button
                          type="text"
                          icon={<FaRegEnvelopeOpen />}
                          onClick={() => message.info("Gửi lại (demo)")}
                        >
                          Gửi lại
                        </Button>
                        <Button
                          type="text"
                          icon={<FaTrashAlt />}
                          danger
                          onClick={() => handleDelete(item.id)}
                        >
                          Xóa
                        </Button>
                      </div>
                    }
                  >
                    <Button icon={<FaEllipsisV />} />
                  </Popover>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <Text strong style={{ fontSize: 16 }}>
                          {item.title}
                        </Text>
                        {!item.read && <Tag color="red">Mới</Tag>}
                      </div>
                      <div style={{ color: "#888", fontSize: 12 }}>
                        {item.date}
                      </div>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 8, color: "#444" }}>
                      {item.content}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaBell /> Tạo thông báo mới
          </div>
        }
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        okText="Gửi"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
          >
            <Input placeholder="Tiêu đề thông báo" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
          >
            <Input.TextArea rows={4} placeholder="Nội dung thông báo" />
          </Form.Item>

          <Form.Item name="recipients" label="Gửi tới" initialValue={["all"]}>
            <Select mode="multiple" placeholder="Chọn đối tượng nhận">
              <Select.Option value="all">Tất cả học sinh</Select.Option>
              <Select.Option value="class_1">Lớp 1</Select.Option>
              <Select.Option value="class_2">Lớp 2</Select.Option>
              <Select.Option value="parents">Phụ huynh</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
