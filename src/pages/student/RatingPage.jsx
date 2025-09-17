import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Avatar,
  Typography,
  Tag,
  Row,
  Col,
  List,
  Button,
} from "antd";
import { FaMedal, FaTrophy, FaCertificate } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

export default function RatingPage() {
  const { currentUser } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    // TODO: Replace with Firestore queries: leaderboard by class or school, badges collection per student
    setLeaders([
      { id: "HS02", name: "Trần Thị Bích", avatar: null, score: 98, badges: 5 },
      { id: "HS01", name: "Nguyễn Văn An", avatar: null, score: 95, badges: 4 },
      { id: "HS03", name: "Lê Minh Tuấn", avatar: null, score: 90, badges: 3 },
      { id: "HS04", name: "Phạm Thị Hoa", avatar: null, score: 88, badges: 2 },
    ]);

    setBadges([
      {
        id: "b1",
        name: "Chăm học",
        description: "Hoàn thành 10 bài tập",
        color: "gold",
        earned: true,
        dateEarned: "2025-05-12",
      },
      {
        id: "b2",
        name: "Tham gia tích cực",
        description: "Tham gia đầy đủ trong tháng",
        color: "green",
        earned: false,
      },
      {
        id: "b3",
        name: "Ngôi sao tuần",
        description: "Được chọn là học sinh xuất sắc trong tuần",
        color: "blue",
        earned: true,
        dateEarned: "2025-08-01",
      },
    ]);
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Xếp hạng",
        dataIndex: "rank",
        key: "rank",
        width: 80,
        render: (_, __, idx) => idx + 1,
      },
      {
        title: "Học sinh",
        dataIndex: "name",
        key: "name",
        render: (text, record) => (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar src={record.avatar}>{text?.[0]}</Avatar>
            <div>
              <Text strong>{text}</Text>
              <br />
              <Text type="secondary">{record.id}</Text>
            </div>
          </div>
        ),
      },
      {
        title: "Điểm",
        dataIndex: "score",
        key: "score",
        width: 120,
        render: (v) => <Tag color="blue">{v}</Tag>,
      },
      {
        title: "Huy hiệu",
        dataIndex: "badges",
        key: "badges",
        width: 120,
        render: (v) => <Tag color="gold">{v}</Tag>,
      },
    ],
    []
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Bảng xếp hạng & Huy hiệu</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        Học sinh: {currentUser?.name || currentUser?.email}
      </Text>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FaTrophy /> Bảng xếp hạng
              </div>
            }
            style={{ borderRadius: 12 }}
          >
            <Table
              columns={columns}
              dataSource={leaders}
              pagination={false}
              rowKey={(r) => r.id}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FaMedal /> Huy hiệu
              </div>
            }
            style={{ borderRadius: 12 }}
          >
            <List
              grid={{ gutter: 12, column: 1 }}
              dataSource={badges}
              renderItem={(b) => (
                <List.Item>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          background: b.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      >
                        <FaCertificate />
                      </div>
                      <div>
                        <Text strong>{b.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {b.description}
                        </Text>
                        <br />
                        {b.earned ? (
                          <Tag color="green">Đã đạt vào {b.dateEarned}</Tag>
                        ) : (
                          <Tag>Chưa đạt</Tag>
                        )}
                      </div>
                    </div>
                    <div>
                      {b.earned ? (
                        <Button type="default">Xem</Button>
                      ) : (
                        <Button type="primary">Nhận điều kiện</Button>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
