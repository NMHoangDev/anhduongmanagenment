import React from "react";
import { Modal, Descriptions, Tag, List, Typography } from "antd";
import { FaBook, FaUsers, FaClock, FaGraduationCap } from "react-icons/fa";

const { Paragraph } = Typography;

const SubjectDetailModal = ({ subject, visible, onClose }) => {
  if (!subject) return null;

  const getCategoryColor = (category) => {
    const colors = {
      "Toán học": "blue",
      "Ngữ văn": "green",
      "Tiếng Anh": "purple",
      "Vật lý": "orange",
      "Hóa học": "red",
      "Sinh học": "cyan",
      "Lịch sử": "brown",
      "Địa lý": "lime",
      "Tin học": "geekblue",
      "Thể dục": "volcano",
      "Âm nhạc": "magenta",
      "Mỹ thuật": "gold",
    };
    return colors[category] || "default";
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FaBook style={{ color: "#1976d2", fontSize: "20px" }} />
          <span style={{ fontSize: "18px", fontWeight: 600 }}>
            Chi tiết môn học
          </span>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div style={{ padding: "20px 0" }}>
        {/* Header Info */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              color: "#1976d2",
              marginBottom: "8px",
            }}
          >
            {subject.name}
          </h2>
          {subject.code && (
            <div style={{ marginBottom: "12px" }}>
              <code
                style={{
                  backgroundColor: "#e3f0ff",
                  color: "#1976d2",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {subject.code}
              </code>
            </div>
          )}
          {subject.description && (
            <Paragraph
              style={{
                margin: 0,
                fontSize: "16px",
                lineHeight: "1.6",
                color: "#555",
              }}
            >
              {subject.description}
            </Paragraph>
          )}
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: "#e6f7e6",
              padding: "16px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <FaClock
              style={{
                fontSize: "24px",
                color: "#28a745",
                marginBottom: "8px",
              }}
            />
            <div
              style={{ fontSize: "20px", fontWeight: 600, color: "#28a745" }}
            >
              {subject.duration || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>Tiết học</div>
          </div>

          <div
            style={{
              backgroundColor: "#fff3e0",
              padding: "16px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <FaUsers
              style={{
                fontSize: "24px",
                color: "#ff9800",
                marginBottom: "8px",
              }}
            />
            <div
              style={{ fontSize: "20px", fontWeight: 600, color: "#ff9800" }}
            >
              {subject.teacherCount || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>Giáo viên</div>
          </div>
        </div>

        {/* Details */}
        <Descriptions bordered column={2} style={{ marginBottom: "24px" }}>
          <Descriptions.Item label="Danh mục" span={1}>
            {subject.category && (
              <Tag
                color={getCategoryColor(subject.category)}
                style={{ fontSize: "13px" }}
              >
                {subject.category}
              </Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Cấp độ" span={1}>
            {subject.level && (
              <Tag color="blue" style={{ fontSize: "13px" }}>
                {subject.level}
              </Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái" span={1}>
            <Tag
              color={subject.isActive ? "green" : "red"}
              style={{ fontSize: "13px" }}
            >
              {subject.isActive ? "Đang hoạt động" : "Không hoạt động"}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày tạo" span={1}>
            {subject.createdAt
              ? new Date(subject.createdAt).toLocaleDateString("vi-VN")
              : "N/A"}
          </Descriptions.Item>
        </Descriptions>

        {/* Requirements */}
        {subject.requirements && (
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#333",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              📋 Yêu cầu tiên quyết
            </h4>
            <div
              style={{
                backgroundColor: "#fff9e6",
                border: "1px solid #ffd700",
                borderRadius: "6px",
                padding: "12px",
              }}
            >
              <Paragraph style={{ margin: 0, lineHeight: "1.6" }}>
                {subject.requirements}
              </Paragraph>
            </div>
          </div>
        )}

        {/* Objectives */}
        {subject.objectives && subject.objectives.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#333",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              🎯 Mục tiêu học tập
            </h4>
            <List
              size="small"
              bordered
              dataSource={subject.objectives}
              renderItem={(item, index) => (
                <List.Item>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#1976d2",
                        color: "white",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ lineHeight: "1.6" }}>{item}</span>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}

        {/* Teachers List */}
        {subject.teachers && subject.teachers.length > 0 && (
          <div>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#333",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              👨‍🏫 Giáo viên phụ trách
            </h4>
            <List
              size="small"
              bordered
              dataSource={subject.teachers}
              renderItem={(teacher) => (
                <List.Item>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {teacher.avatar ? (
                      <img
                        src={teacher.avatar}
                        alt={teacher.name}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: "#e3f0ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#1976d2",
                          fontWeight: 600,
                        }}
                      >
                        {teacher.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: "#333" }}>
                        {teacher.name}
                      </div>
                      {teacher.experience && (
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Kinh nghiệm: {teacher.experience}
                        </div>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SubjectDetailModal;
