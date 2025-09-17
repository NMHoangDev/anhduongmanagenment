import React, { useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Upload,
  Button,
  Table,
  Modal,
  message,
  Tag,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { FaBookOpen } from "react-icons/fa";

const { Title, Text } = Typography;

const fakeMaterials = [
  {
    id: 1,
    name: "Giáo án Toán tuần 1.pdf",
    uploaded: "2024-05-20",
    size: "120KB",
  },
  {
    id: 2,
    name: "Bài giảng Văn - Chủ đề 1.pptx",
    uploaded: "2024-05-18",
    size: "2.4MB",
  },
];

export default function TeacherMaterial() {
  const [materials, setMaterials] = useState(fakeMaterials);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    visible: false,
    item: null,
  });

  const handleBeforeUpload = (file) => {
    setUploadingFile(file);
    // prevent auto upload by returning false
    return false;
  };

  const handleUpload = () => {
    if (!uploadingFile) {
      message.warning("Vui lòng chọn tệp trước khi tải lên.");
      return;
    }

    setMaterials((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: uploadingFile.name,
        uploaded: new Date().toISOString().slice(0, 10),
        size: `${Math.round(uploadingFile.size / 1024)}KB`,
      },
    ]);
    setUploadingFile(null);
    message.success("Tải lên thành công");
  };

  const confirmDelete = (item) => {
    setDeleteModal({ visible: true, item });
  };

  const handleDelete = () => {
    const item = deleteModal.item;
    setMaterials((prev) => prev.filter((m) => m.id !== item.id));
    setDeleteModal({ visible: false, item: null });
    message.success("Đã xóa tài liệu");
  };

  const columns = [
    {
      title: "Tên tài liệu",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    { title: "Kích thước", dataIndex: "size", key: "size", width: 120 },
    {
      title: "Ngày tải lên",
      dataIndex: "uploaded",
      key: "uploaded",
      width: 140,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 160,
      align: "center",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button icon={<DownloadOutlined />} size="small">
            Tải xuống
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => confirmDelete(record)}
          >
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  const totalCount = useMemo(() => materials.length, [materials]);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 16,
          border: "none",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title
              level={2}
              style={{
                color: "#fff",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: 12,
                  borderRadius: 12,
                }}
              >
                <FaBookOpen />
              </div>
              Tài liệu giảng dạy
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.9)" }}>
              Quản lý tài liệu, tải lên và chia sẻ cho học sinh
            </Text>
          </Col>
          <Col>
            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                padding: "8px 12px",
                borderRadius: 12,
              }}
            >
              <Text strong style={{ color: "#fff", marginRight: 8 }}>
                Tổng
              </Text>
              <Tag color="blue" style={{ fontWeight: 700 }}>
                {totalCount}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        style={{ marginBottom: 24, borderRadius: 16 }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={16} align="middle">
          <Col xs={24} sm={16}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              Tải lên tài liệu mới
            </div>
            <Upload
              beforeUpload={handleBeforeUpload}
              maxCount={1}
              accept=".pdf,.ppt,.pptx,.doc,.docx"
            >
              <Button icon={<UploadOutlined />}>Chọn tệp</Button>
            </Upload>
            <div style={{ marginTop: 12 }}>
              <Button
                type="primary"
                onClick={handleUpload}
                disabled={!uploadingFile}
              >
                Tải lên
              </Button>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: "right" }}>
              <Text type="secondary">Lưu ý:</Text>
              <div style={{ color: "#888" }}>Chỉ chấp nhận PDF/PPT/DOC</div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 16 }} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={materials}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        visible={deleteModal.visible}
        title="Xác nhận xóa"
        onOk={handleDelete}
        onCancel={() => setDeleteModal({ visible: false, item: null })}
        okText="Xóa"
        okButtonProps={{ danger: true }}
      >
        <p>
          Bạn có chắc muốn xóa tài liệu{" "}
          <strong>{deleteModal.item?.name}</strong> không?
        </p>
      </Modal>
    </div>
  );
}
