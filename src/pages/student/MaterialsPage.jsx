import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Input,
  Select,
  List,
  Avatar,
  Button,
  Tag,
  Empty,
  Typography,
  Space,
  Tooltip,
} from "antd";
import { FaFileAlt, FaDownload, FaEye, FaFilter } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

export default function MaterialsPage() {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    // TODO: Replace with Firestore query to get materials for the student's class/subjects
    setMaterials([
      {
        id: "m1",
        title: "Toán - Bài 1: Phép cộng",
        subject: "Toán",
        uploadedBy: "Cô Lan",
        uploadedAt: "2025-09-01",
        url: "",
        size: "120KB",
        type: "pdf",
      },
      {
        id: "m2",
        title: "Tiếng Việt - Đọc hiểu",
        subject: "Ngữ văn",
        uploadedBy: "Cô My",
        uploadedAt: "2025-08-28",
        url: "",
        size: "80KB",
        type: "docx",
      },
      {
        id: "m3",
        title: "Tiết 3 - Bảng tuần hoàn (slide)",
        subject: "Hóa",
        uploadedBy: "Thầy Hùng",
        uploadedAt: "2025-09-10",
        url: "",
        size: "2.1MB",
        type: "pptx",
      },
    ]);
  }, []);

  const subjects = useMemo(() => {
    const set = new Set(materials.map((m) => m.subject));
    return ["all", ...Array.from(set)];
  }, [materials]);

  const filtered = useMemo(() => {
    return materials
      .filter((m) => (subject === "all" ? true : m.subject === subject))
      .filter(
        (m) =>
          m.title.toLowerCase().includes(query.toLowerCase()) ||
          m.subject.toLowerCase().includes(query.toLowerCase())
      );
  }, [materials, subject, query]);

  const handleDownload = (item) => {
    // TODO: If `item.url` is a Storage URL, trigger download. Otherwise, implement SDK download.
    // For demo we'll show a tooltip message
    alert(`Download: ${item.title}`);
  };

  const handleView = (item) => {
    // TODO: Open viewer or new tab to display the file
    alert(`View: ${item.title}`);
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Tài liệu học tập</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        Học sinh: {currentUser?.name || currentUser?.email}
      </Text>

      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 12 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Input.Search
            placeholder="Tìm theo tiêu đề hoặc môn"
            allowClear
            onSearch={(v) => setQuery(v)}
            style={{ width: 420 }}
          />

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Tooltip title="Lọc theo môn">
              <FaFilter />
            </Tooltip>
            <Select
              value={subject}
              onChange={setSubject}
              style={{ width: 160 }}
            >
              {subjects.map((s) => (
                <Select.Option key={s} value={s}>
                  {s === "all" ? "Tất cả môn" : s}
                </Select.Option>
              ))}
            </Select>
          </div>
        </Space>
      </Card>

      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 12 }}>
        {filtered.length === 0 ? (
          <Empty description="Không có tài liệu" />
        ) : (
          <List
            dataSource={filtered}
            itemLayout="horizontal"
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    icon={<FaEye />}
                    onClick={() => handleView(item)}
                  >
                    Xem
                  </Button>,
                  <Button
                    key="download"
                    icon={<FaDownload />}
                    onClick={() => handleDownload(item)}
                  >
                    Tải về
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<FaFileAlt />} />}
                  title={
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <Text strong>{item.title}</Text>
                      <Tag>{item.subject}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        Tải lên: {item.uploadedBy} • {item.uploadedAt} •{" "}
                        {item.size}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
