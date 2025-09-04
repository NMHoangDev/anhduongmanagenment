import React, { useState } from "react";

const fakeMaterials = [
  { id: 1, name: "Giáo án Toán tuần 1.pdf", uploaded: "2024-05-20" },
  { id: 2, name: "Bài giảng Văn - Chủ đề 1.pptx", uploaded: "2024-05-18" },
];

export default function TeacherMaterial() {
  const [materials, setMaterials] = useState(fakeMaterials);
  const [file, setFile] = useState(null);

  const handleUpload = () => {
    if (!file) return;
    setMaterials((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: file.name,
        uploaded: new Date().toISOString().slice(0, 10),
      },
    ]);
    setFile(null);
  };

  return (
    <div style={{ padding: 40, minHeight: "100vh", background: "#f6f6fa" }}>
      <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 18 }}>
        Tài liệu giảng dạy
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px #eee",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12 }}>
          Tải lên tài liệu mới
        </div>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: 12 }}
        />
        <button
          onClick={handleUpload}
          style={{
            background: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 32px",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Tải lên
        </button>
      </div>
      <div>
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>
          Danh sách tài liệu đã chia sẻ
        </h2>
        <table
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 2px 8px #eee",
            borderCollapse: "collapse",
          }}
        >
          <thead style={{ background: "#f3f6fd" }}>
            <tr>
              <th style={{ padding: 12, textAlign: "left" }}>Tên tài liệu</th>
              <th style={{ padding: 12, textAlign: "left" }}>Ngày tải lên</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: 10 }}>{m.name}</td>
                <td style={{ padding: 10 }}>{m.uploaded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
