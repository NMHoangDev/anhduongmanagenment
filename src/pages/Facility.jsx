import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
  getAllFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
} from "../services/facilitiesService";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilePdf,
  FaImages,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import FacilityAddUpdateModal from "../components/FacilityAddUpdateModal";

const initialForm = {
  name: "",
  category: "",
  code: "",
  location: "",
  quantity: 1,
  cost: 0,
  status: "Đang dùng",
  condition: "",
  purchaseDate: "",
  warrantyExpiry: "",
  lastMaintenanceDate: "",
  nextMaintenanceDate: "",
  assignedTo: "",
  notes: "",
  images: [],
  manualDocument: "",
};

const statusColors = {
  "Đang dùng": "#28a745",
  Hỏng: "#e83e8c",
  "Bảo trì": "#ffc107",
};

function generateAssetCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomStr = "";
  for (let i = 0; i < 3; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomStr + Date.now();
}

export default function Facility() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewDevice, setViewDevice] = useState(null);

  // responsive + sidebar toggle
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDevices();
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function fetchDevices() {
    setLoading(true);
    try {
      const data = await getAllFacilities();
      setDevices(data);
    } catch (err) {
      console.error("fetchDevices error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleInput(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleOpenAdd() {
    setEditDevice(null);
    setEditId(null);
    setShowForm(true);
    if (isMobile) setSidebarOpen(false);
  }

  function handleOpenEdit(device) {
    setEditDevice(device);
    setEditId(device.id);
    setShowForm(true);
    if (isMobile) setSidebarOpen(false);
  }

  function formatCurrency(value) {
    if (value === "" || value === null || value === undefined) return "";
    let number = value.toString().replace(/\D/g, "");
    if (!number) return "";
    return Number(number).toLocaleString("vi-VN");
  }

  function handleCostChange(e) {
    const raw = e.target.value.replace(/\D/g, "");
    setForm((f) => ({ ...f, cost: raw }));
  }

  function handleCostBlur(e) {
    setForm((f) => ({
      ...f,
      cost: f.cost ? Number(f.cost).toLocaleString("vi-VN") : "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...form,
        cost: form.cost ? Number(form.cost.toString().replace(/\D/g, "")) : 0,
      };
      if (editId) {
        await updateFacility(editId, dataToSave);
      } else {
        await createFacility(dataToSave);
      }
      setShowForm(false);
      await fetchDevices();
    } catch (err) {
      console.error("handleSubmit error:", err);
      alert("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn chắc chắn muốn xóa thiết bị này?")) return;
    setLoading(true);
    try {
      await deleteFacility(id);
      await fetchDevices();
    } catch (err) {
      console.error("handleDelete error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredDevices = devices.filter(
    (d) =>
      (d.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.location || "").toLowerCase().includes(search.toLowerCase())
  );

  // Mobile card component for devices
  function DeviceCard({ device }) {
    return (
      <div style={mobileDeviceCard}>
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
        >
          <div
            style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}
          >
            <div style={mobileDeviceAvatar}>
              {(device.name || "•").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{device.name}</div>
              <div style={{ color: "#666", fontSize: 13 }}>
                {device.category} • {device.location}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color: statusColors[device.status] || "#444",
                fontWeight: 700,
              }}
            >
              {device.status}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {device.quantity} cái
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            onClick={() => handleOpenEdit(device)}
            style={mobileActionBtn}
          >
            <FaEdit /> Sửa
          </button>
          <button
            onClick={() => handleDelete(device.id)}
            style={{ ...mobileActionBtn, background: "#e83e8c" }}
          >
            <FaTrash /> Xóa
          </button>
          <button
            onClick={() => setViewDevice(device)}
            style={{ ...mobileActionBtn, background: "#6c757d" }}
          >
            <FaImages /> Ảnh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f6fa" }}>
      {/* Sidebar: fixed on desktop, overlay on mobile */}
      {isMobile ? (
        <>
          <div style={mobileTopBar}>
            <button onClick={() => setSidebarOpen(true)} style={mobileMenuBtn}>
              <FaBars />
            </button>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#333" }}>
              Quản lý cơ sở vật chất
            </div>
            <div style={{ width: 36 }} />
          </div>

          {sidebarOpen && (
            <div
              style={mobileSidebarOverlay}
              onClick={() => setSidebarOpen(false)}
            >
              <div style={mobileSidebar} onClick={(e) => e.stopPropagation()}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    padding: 12,
                  }}
                >
                  <button
                    onClick={() => setSidebarOpen(false)}
                    style={mobileCloseBtn}
                  >
                    <FaTimes />
                  </button>
                </div>
                <Sidebar />
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            width: 240,
            background: "#fff",
            borderRight: "1px solid #eee",
            minHeight: "100vh",
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            zIndex: 100,
          }}
        >
          <Sidebar />
        </div>
      )}

      {/* Nội dung */}

      <div
        style={{
          flex: 1,
          marginLeft: 0,
          padding: isMobile ? "10px" : "18px 24px",
          overflowY: "auto",
          minHeight: "100vh",
        }}
      >
        {!isMobile && (
          <>
            <h1
              style={{
                fontWeight: 700,
                fontSize: 32,
                margin: "0 0 8px 0",
                color: "#444",
              }}
            >
              Quản lý cơ sở vật chất
            </h1>
            <div style={{ color: "#666", fontSize: 18, marginBottom: 24 }}>
              Danh sách thiết bị, tài sản của trường học
            </div>
          </>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mã, loại, vị trí..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 16,
              }}
            />
            {!isMobile && (
              <button
                onClick={() => {
                  setSearch("");
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                }}
                title="Clear"
              >
                <FaSearch />
              </button>
            )}
          </div>

          <button
            onClick={handleOpenAdd}
            style={{
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <FaPlus /> Thêm thiết bị
          </button>
        </div>

        {/* Desktop table or mobile cards */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 20, color: "#666" }}>
                Đang tải...
              </div>
            ) : filteredDevices.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#888" }}>
                Không có thiết bị nào
              </div>
            ) : (
              filteredDevices.map((d) => <DeviceCard key={d.id} device={d} />)
            )}
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
              /* giảm padding và minHeight để table không tạo khoảng trống lớn khi rỗng */
              padding: 12,
              minHeight: "auto",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
              }}
            >
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={thStyle}>Tên thiết bị</th>
                  <th style={thStyle}>Loại</th>
                  <th style={thStyle}>Mã</th>
                  <th style={thStyle}>Vị trí</th>
                  <th style={thStyle}>Số lượng</th>
                  <th style={thStyle}>Giá (₫)</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={thStyle}>Ngày mua</th>
                  <th style={thStyle}>Bảo hành</th>
                  <th style={thStyle}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr
                    key={device.id}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={tdStyle}>
                      <span
                        style={{
                          color: "#007bff",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                        onClick={() => setViewDevice(device)}
                      >
                        {device.name}
                      </span>
                    </td>
                    <td style={tdStyle}>{device.category}</td>
                    <td style={tdStyle}>{device.code}</td>
                    <td style={tdStyle}>{device.location}</td>
                    <td style={tdStyle}>{device.quantity}</td>
                    <td style={tdStyle}>
                      {device.cost
                        ? device.cost.toLocaleString("vi-VN") + " ₫"
                        : ""}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: statusColors[device.status] || "#444",
                        fontWeight: 600,
                      }}
                    >
                      {device.status}
                    </td>
                    <td style={tdStyle}>
                      {device.purchaseDate
                        ? new Date(
                            device.purchaseDate.seconds * 1000
                          ).toLocaleDateString()
                        : ""}
                    </td>
                    <td style={tdStyle}>
                      {device.warrantyExpiry
                        ? new Date(
                            device.warrantyExpiry.seconds * 1000
                          ).toLocaleDateString()
                        : ""}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleOpenEdit(device)}
                        style={iconBtn}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(device.id)}
                        style={iconBtn}
                      >
                        <FaTrash color="#e83e8c" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDevices.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        textAlign: "center",
                        color: "#888",
                        /* giảm padding cho trạng thái rỗng */
                        padding: 20,
                      }}
                    >
                      {loading ? "Đang tải..." : "Không có thiết bị nào"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Form thêm/sửa: sử dụng component FacilityAddUpdateModal */}
        <FacilityAddUpdateModal
          visible={showForm}
          initial={editDevice}
          onClose={() => {
            setShowForm(false);
            setEditDevice(null);
            setEditId(null);
            setForm(initialForm);
          }}
          onSaved={() => {
            fetchDevices();
            setShowForm(false);
            setEditDevice(null);
            setEditId(null);
            setForm(initialForm);
          }}
        />

        {/* Xem chi tiết thiết bị */}
        {viewDevice && (
          <div style={modalOverlay}>
            <div style={modalContent}>
              <h2>{viewDevice.name}</h2>
              <div style={{ marginBottom: 12, color: "#888" }}>
                {viewDevice.category}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <div>
                  <b>Mã:</b> {viewDevice.code}
                </div>
                <div>
                  <b>Vị trí:</b> {viewDevice.location}
                </div>
                <div>
                  <b>Số lượng:</b> {viewDevice.quantity}
                </div>
                <div>
                  <b>Giá:</b>{" "}
                  {viewDevice.cost
                    ? viewDevice.cost.toLocaleString("vi-VN") + " ₫"
                    : ""}
                </div>
                <div>
                  <b>Trạng thái:</b>{" "}
                  <span
                    style={{
                      color: statusColors[viewDevice.status] || "#444",
                      fontWeight: 600,
                    }}
                  >
                    {viewDevice.status}
                  </span>
                </div>
                <div>
                  <b>Tình trạng:</b> {viewDevice.condition}
                </div>
                <div>
                  <b>Ngày mua:</b>{" "}
                  {viewDevice.purchaseDate
                    ? new Date(
                        viewDevice.purchaseDate.seconds * 1000
                      ).toLocaleDateString()
                    : ""}
                </div>
                <div>
                  <b>Bảo hành đến:</b>{" "}
                  {viewDevice.warrantyExpiry
                    ? new Date(
                        viewDevice.warrantyExpiry.seconds * 1000
                      ).toLocaleDateString()
                    : ""}
                </div>
                <div>
                  <b>Bảo trì gần nhất:</b>{" "}
                  {viewDevice.lastMaintenanceDate
                    ? new Date(
                        viewDevice.lastMaintenanceDate.seconds * 1000
                      ).toLocaleDateString()
                    : ""}
                </div>
                <div>
                  <b>Bảo trì dự kiến:</b>{" "}
                  {viewDevice.nextMaintenanceDate
                    ? new Date(
                        viewDevice.nextMaintenanceDate.seconds * 1000
                      ).toLocaleDateString()
                    : ""}
                </div>
                <div>
                  <b>Người phụ trách:</b> {viewDevice.assignedTo}
                </div>
              </div>
              {viewDevice.images && viewDevice.images.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <b>Ảnh:</b>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {viewDevice.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt="device"
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #eee",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {viewDevice.manualDocument && (
                <div style={{ marginBottom: 12 }}>
                  <b>Tài liệu hướng dẫn:</b>
                  <a
                    href={viewDevice.manualDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginLeft: 8,
                      color: "#007bff",
                      textDecoration: "underline",
                    }}
                  >
                    <FaFilePdf /> Xem tài liệu
                  </a>
                </div>
              )}
              <div style={{ textAlign: "right", marginTop: 16 }}>
                <button onClick={() => setViewDevice(null)} style={cancelBtn}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Các component nhỏ (unchanged)
function Input({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label
        style={{
          fontWeight: 500,
          marginBottom: 3,
          fontSize: 15,
          color: "#333",
        }}
      >
        {label}
      </label>
      <input
        {...props}
        style={{
          padding: "10px 13px",
          borderRadius: 8,
          border: "1.5px solid #cce0ff",
          fontSize: 15,
          outline: "none",
          transition: "border 0.2s",
          marginBottom: 2,
        }}
        onFocus={(e) => (e.target.style.border = "1.5px solid #007bff")}
        onBlur={(e) => (e.target.style.border = "1.5px solid #cce0ff")}
      />
    </div>
  );
}
function Select({ label, options, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label
        style={{
          fontWeight: 500,
          marginBottom: 3,
          fontSize: 15,
          color: "#333",
        }}
      >
        {label}
      </label>
      <select
        {...props}
        style={{
          padding: "10px 13px",
          borderRadius: 8,
          border: "1.5px solid #cce0ff",
          fontSize: 15,
          outline: "none",
          transition: "border 0.2s",
          marginBottom: 2,
        }}
        onFocus={(e) => (e.target.style.border = "1.5px solid #007bff")}
        onBlur={(e) => (e.target.style.border = "1.5px solid #cce0ff")}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

const thStyle = {
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "#333",
  borderBottom: "2px solid #eee",
};
const tdStyle = { padding: "10px 12px", color: "#444" };
const iconBtn = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 18,
  marginRight: 8,
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.18)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalContent = {
  background: "#fff",
  borderRadius: 16,
  padding: 32,
  minWidth: 340,
  maxWidth: 600,
  boxShadow: "0 4px 32px #0002",
  position: "relative",
};
const cancelBtn = {
  background: "#eee",
  color: "#444",
  border: "none",
  borderRadius: 8,
  padding: "8px 20px",
  fontWeight: 600,
  marginRight: 8,
  cursor: "pointer",
};
const submitBtn = {
  background: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 20px",
  fontWeight: 600,
  cursor: "pointer",
};

// Mobile / responsive styles used above
const mobileTopBar = {
  position: "sticky",
  top: 0,
  zIndex: 120,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 12px",
  background: "#fff",
  borderBottom: "1px solid #eee",
};
const mobileMenuBtn = {
  background: "none",
  border: "none",
  fontSize: 18,
  padding: 8,
  cursor: "pointer",
};
const mobileSidebarOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.3)",
  zIndex: 200,
};
const mobileSidebar = {
  width: 280,
  height: "100%",
  background: "#fff",
  boxShadow: "2px 0 12px rgba(0,0,0,0.08)",
  overflowY: "auto",
};
const mobileCloseBtn = {
  background: "none",
  border: "none",
  fontSize: 18,
  padding: 6,
  cursor: "pointer",
};

const mobileDeviceCard = {
  background: "#fff",
  borderRadius: 10,
  padding: 12,
  border: "1px solid #eee",
  boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
};
const mobileDeviceAvatar = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  background: "#007bff",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
};
const mobileActionBtn = {
  flex: 1,
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "#007bff",
  color: "#fff",
  cursor: "pointer",
  display: "inline-flex",
  gap: 8,
  alignItems: "center",
  justifyContent: "center",
};
