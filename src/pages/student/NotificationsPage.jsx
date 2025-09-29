import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext"; // <-- thêm import
import {
  Badge,
  Button,
  Card,
  Empty,
  List,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import {
  getStudentClassId,
  getStudentClass,
  getNotificationsForStudent,
  subscribeClassNotifications,
  markNotificationRead,
  getNotificationSenderName,
} from "../../services/studentServices/notificationService";

const { Title, Text, Paragraph } = Typography;

const formatTs = (ts) => {
  try {
    const d =
      ts?.toDate?.() instanceof Date ? ts.toDate() : ts ? new Date(ts) : null;
    if (!d || Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
};

const pageStyles = {
  root: {
    minHeight: "100vh",
    padding: "32px 24px 48px",
    background: "linear-gradient(180deg,#f3f6ff 0%,#ffffff 40%)",
  },
  headerCard: {
    borderRadius: 18,
    border: "none",
    boxShadow: "0 8px 24px rgba(99, 123, 255, 0.08)",
  },
  listCard: {
    borderRadius: 18,
    border: "none",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
  },
  listItem: {
    borderRadius: 14,
    padding: 20,
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  listItemUnread: {
    background: "rgba(80, 125, 255, 0.08)",
    boxShadow: "0 6px 18px rgba(80, 125, 255, 0.15)",
  },
};

const typeColors = {
  normal: "processing",
  urgent: "error",
  info: "geekblue",
  reminder: "gold",
};

export default function StudentNotifications() {
  const { currentUser } = useAuth(); // <-- dùng auth context
  // ưu tiên currentUser.uid, fallback localStorage (chỉ cho debug)
  const studentId =
    (currentUser && currentUser.id) ||
    JSON.parse(localStorage.getItem("studentId") || "null");

  // debug logs để thấy giá trị khi chạy
  useEffect(() => {
    console.log(
      "NotificationsPage mounted - studentId:",
      studentId,
      "currentUser:",
      currentUser
    );
  }, [studentId, currentUser]);

  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [limit, setLimit] = useState(50);
  const [items, setItems] = useState([]);
  const [senderNames, setSenderNames] = useState({});

  useEffect(() => {
    let unsub = null;
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        if (!studentId) {
          message.warning("Không tìm thấy studentId. Vui lòng đăng nhập lại.");
          setLoading(false);
          return;
        }

        // lấy class object (id + data) cho học sinh
        const cls = await getStudentClass(studentId);
        const cid = cls?.id || (await getStudentClassId(studentId));
        console.debug("StudentNotifications -> classInfo:", cls, "cid:", cid); // <-- log lớp
        if (!mounted) return;
        setClassInfo(cls || null);
        setClassId(cid || null);

        if (!cid) {
          setItems([]);
          setLoading(false);
          return;
        }

        // load initial batch (optional) then subscribe realtime
        try {
          const initial = await getNotificationsForStudent(studentId, {
            limit,
            onlyUnread: onlyUnread,
          });
          console.debug(
            "StudentNotifications -> initial notifications:",
            initial
          ); // <-- log thông báo
          if (mounted) setItems(initial);
        } catch (err) {
          console.error("initial notifications load:", err);
        }

        unsub = subscribeClassNotifications(
          cid,
          (list) => {
            if (!mounted) return;
            let out = list;
            if (onlyUnread) {
              out = out.filter((n) => !n.readBy?.includes(String(studentId)));
            }
            setItems(out);
          },
          {
            limit,
            onlyUnreadFor: onlyUnread ? String(studentId) : null,
          }
        );
      } catch (e) {
        console.error(e);
        message.error("Không thể tải thông báo.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
      if (typeof unsub === "function") unsub();
    };
  }, [studentId, onlyUnread, limit]);

  const unreadCount = useMemo(
    () =>
      items.filter(
        (n) => !Array.isArray(n.readBy) || !n.readBy.includes(String(studentId))
      ).length,
    [items, studentId]
  );

  const handleMarkRead = async (id) => {
    try {
      if (!id || !studentId) return;
      const ok = await markNotificationRead(id, String(studentId));
      if (!ok) throw new Error();
      message.success("Đã đánh dấu đã đọc");
    } catch {
      message.error("Không thể cập nhật trạng thái đã đọc");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = items.filter(
        (n) => !Array.isArray(n.readBy) || !n.readBy.includes(String(studentId))
      );
      if (!unread.length) {
        message.info("Không còn thông báo chưa đọc");
        return;
      }
      await Promise.all(
        unread.map((n) => markNotificationRead(n.id, String(studentId)))
      );
      message.success(`Đã đánh dấu đọc ${unread.length} thông báo`);
    } catch {
      message.error("Không thể đánh dấu tất cả là đã đọc");
    }
  };

  const classSubtitle = useMemo(() => {
    if (!classInfo) return "Chưa xác định lớp";
    const parts = [];
    if (classInfo.name) parts.push(classInfo.name);
    if (classInfo.grade) parts.push(`Khối ${classInfo.grade}`);
    if (Array.isArray(classInfo.students))
      parts.push(`${classInfo.students.length} học sinh`);
    return parts.join(" • ") || classInfo.id;
  }, [classInfo]);

  useEffect(() => {
    const ids = Array.from(
      new Set(items.map((n) => n.senderId).filter(Boolean))
    );
    const missing = ids.filter((id) => !senderNames[id]);
    if (!missing.length) return;

    let cancelled = false;
    (async () => {
      const fetched = await Promise.all(
        missing.map(async (id) => [id, await getNotificationSenderName(id)])
      );
      if (cancelled) return;
      setSenderNames((prev) => {
        const next = { ...prev };
        fetched.forEach(([id, name]) => {
          next[id] = name || id;
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [items, senderNames]);

  return (
    <div style={pageStyles.root}>
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Card style={pageStyles.headerCard} bodyStyle={{ padding: 28 }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
            wrap
          >
            <Space size={18}>
              <Badge count={unreadCount} offset={[8, -4]}>
                <Title level={3} style={{ margin: 0, color: "#1d1f4a" }}>
                  <BellOutlined style={{ color: "#4c6fff", marginRight: 10 }} />
                  Thông báo của lớp
                </Title>
              </Badge>
              <Space size={8}>
                <Tag
                  color="geekblue"
                  style={{
                    borderRadius: 999,
                    padding: "2px 12px",
                  }}
                >
                  {classSubtitle}
                </Tag>
                {classInfo?.homeRoomTeacher?.name && (
                  <Tag
                    color="blue"
                    style={{
                      borderRadius: 999,
                      padding: "2px 12px",
                    }}
                  >
                    GVCN: {classInfo.homeRoomTeacher.name}
                  </Tag>
                )}
              </Space>
            </Space>

            <Space size={16} wrap>
              <Space>
                <span style={{ color: "#6b7280" }}>Chỉ hiện chưa đọc</span>
                <Switch checked={onlyUnread} onChange={setOnlyUnread} />
              </Space>
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleMarkAllRead}
                disabled={!items.length}
                type="primary"
                ghost
              >
                Đánh dấu tất cả đã đọc
              </Button>
            </Space>
          </Space>
        </Card>

        <Card
          style={pageStyles.listCard}
          bodyStyle={{ padding: 0 }}
          title={
            <Space>
              <InboxOutlined style={{ color: "#6473ff" }} />
              <Text
                strong
                style={{ fontSize: 16, color: "#1f2937" }}
              >{`Danh sách thông báo mới nhất`}</Text>
            </Space>
          }
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 6 }} style={{ padding: 24 }} />
          ) : !items.length ? (
            <Empty
              style={{ padding: "48px 0" }}
              image={
                <InboxOutlined style={{ fontSize: 64, color: "#cbd5f5" }} />
              }
              description={<Text type="secondary">Không có thông báo</Text>}
            />
          ) : (
            <List
              itemLayout="vertical"
              dataSource={items}
              style={{ padding: 24 }}
              split={false}
              renderItem={(n) => {
                const isUnread =
                  !Array.isArray(n.readBy) ||
                  !n.readBy.includes(String(studentId));
                const typeColor = typeColors[n.type] || "processing";
                return (
                  <List.Item
                    key={n.id}
                    style={{
                      ...pageStyles.listItem,
                      ...(isUnread ? pageStyles.listItemUnread : {}),
                    }}
                    className="notification-item"
                    actions={[
                      <Space key="time" style={{ color: "#6b7280" }}>
                        <ClockCircleOutlined />
                        <span>{formatTs(n.createdAt)}</span>
                      </Space>,
                      <Button
                        key="markRead"
                        type={isUnread ? "primary" : "default"}
                        ghost={!isUnread}
                        size="small"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        {isUnread ? "Đánh dấu đã đọc" : "Đã đọc"}
                      </Button>,
                    ]}
                    extra={
                      isUnread ? (
                        <Tag color="magenta" style={{ borderRadius: 999 }}>
                          Mới
                        </Tag>
                      ) : (
                        <Tag color="default" style={{ borderRadius: 999 }}>
                          Đã đọc
                        </Tag>
                      )
                    }
                  >
                    <List.Item.Meta
                      title={
                        <Space wrap size={10}>
                          <Text
                            strong
                            style={{ fontSize: 16, color: "#111827" }}
                          >
                            {n.title || "Thông báo"}
                          </Text>
                          {n.type && (
                            <Tag
                              color={typeColor}
                              style={{ borderRadius: 999 }}
                            >
                              {n.type}
                            </Tag>
                          )}
                          {n.className && (
                            <Tag color="success" style={{ borderRadius: 999 }}>
                              {n.className}
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        n.senderId ? (
                          <Text type="secondary">
                            Người gửi:{" "}
                            {senderNames[n.senderId] ||
                              n.senderName ||
                              n.senderId}
                          </Text>
                        ) : null
                      }
                    />
                    <Paragraph style={{ marginBottom: 0, color: "#374151" }}>
                      {n.content}
                    </Paragraph>
                  </List.Item>
                );
              }}
            />
          )}
        </Card>
      </Space>
    </div>
  );
}
