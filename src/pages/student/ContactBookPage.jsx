import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  List,
  Avatar,
  Typography,
  Tag,
  Empty,
  Rate,
  Space,
  Button,
} from "antd";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

export default function ContactBookPage() {
  const { currentUser } = useAuth();

  // Demo grades data (replace with Firestore query)
  const [grades, setGrades] = useState([]);

  // Demo teacher evaluations (replace with Firestore query)
  const [evaluations, setEvaluations] = useState([]);

  useEffect(() => {
    // TODO: Replace the demo data with Firestore queries.
    // Example: listen to `grades` and `evaluations` collections where studentId === currentUser?.id
    setGrades([
      {
        key: "1",
        subject: "Toán",
        term: "HK1",
        mid: 8.5,
        final: 9.0,
        avg: 8.75,
      },
      {
        key: "2",
        subject: "Vật lý",
        term: "HK1",
        mid: 7.0,
        final: 7.5,
        avg: 7.25,
      },
      {
        key: "3",
        subject: "Ngữ văn",
        term: "HK1",
        mid: 9.0,
        final: 8.5,
        avg: 8.75,
      },
      {
        key: "4",
        subject: "Anh văn",
        term: "HK1",
        mid: 8.0,
        final: 8.0,
        avg: 8.0,
      },
    ]);

    setEvaluations([
      {
        id: "e1",
        teacher: "Cô Trần Mai",
        avatar: null,
        date: "2024-05-20",
        rating: 4,
        comment:
          "Em tiến bộ rõ rệt trong môn Toán. Cần chú ý làm bài tập về nhà đầy đủ và luyện các bài khó.",
      },
      {
        id: "e2",
        teacher: "Thầy Phạm Hùng",
        avatar: null,
        date: "2024-04-10",
        rating: 3,
        comment:
          "Cần cải thiện thái độ trong giờ học, hay trao đổi và hỏi thầy cô khi chưa hiểu.",
      },
    ]);
  }, [currentUser]);

  const columns = useMemo(
    () => [
      {
        title: "Môn",
        dataIndex: "subject",
        key: "subject",
      },
      {
        title: "Học kỳ",
        dataIndex: "term",
        key: "term",
        width: 100,
      },
      {
        title: "Điểm giữa kỳ",
        dataIndex: "mid",
        key: "mid",
        width: 120,
        render: (v) => <Text>{v}</Text>,
      },
      {
        title: "Điểm cuối kỳ",
        dataIndex: "final",
        key: "final",
        width: 120,
        render: (v) => <Text>{v}</Text>,
      },
      {
        title: "Trung bình",
        dataIndex: "avg",
        key: "avg",
        width: 120,
        render: (v) => (
          <Tag color={v >= 8.5 ? "green" : v >= 6.5 ? "gold" : "red"}>{v}</Tag>
        ),
      },
    ],
    []
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        Sổ liên lạc
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 18 }}>
        Học sinh: {currentUser?.name || currentUser?.email}
      </Text>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card
            title="Bảng điểm"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 12 }}
          >
            {grades.length === 0 ? (
              <Empty description="Chưa có điểm" />
            ) : (
              <Table
                columns={columns}
                dataSource={grades}
                pagination={false}
                rowKey={(r) => r.key}
                size="middle"
              />
            )}

            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Space>
                <Button>Yêu cầu chỉnh sửa</Button>
                <Button type="primary">Tải PDF</Button>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="Đánh giá từ giáo viên"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 12 }}
          >
            {evaluations.length === 0 ? (
              <Empty description="Chưa có đánh giá" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={evaluations}
                renderItem={(ev) => (
                  <List.Item style={{ padding: 12 }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar src={ev.avatar}>{ev.teacher?.[0]}</Avatar>
                      }
                      title={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>
                            <Text strong>{ev.teacher}</Text>
                            <div style={{ marginTop: 4 }}>
                              <Rate disabled defaultValue={ev.rating} />
                            </div>
                          </div>
                          <div style={{ color: "#888", fontSize: 12 }}>
                            {ev.date}
                          </div>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 8 }}>{ev.comment}</div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
