import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getDevices, addDevice, updateDevice, deleteDevice } from "../services/deviceService";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilePdf, FaImages } from "react-icons/fa";

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
    manualDocument: ""
};

const statusColors = {
    "Đang dùng": "#28a745",
    "Hỏng": "#e83e8c",
    "Bảo trì": "#ffc107"
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
    const [loading, setLoading] = useState(false);
    const [viewDevice, setViewDevice] = useState(null);

    useEffect(() => {
        fetchDevices();
    }, []);

    async function fetchDevices() {
        setLoading(true);
        const data = await getDevices();
        setDevices(data);
        setLoading(false);
    }

    function handleInput(e) {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    }

    function handleOpenAdd() {
        setForm({
            ...initialForm,
            code: generateAssetCode() // Tạo mã tự động
        });
        setEditId(null);
        setShowForm(true);
    }

    function handleOpenEdit(device) {
        setForm({
            ...device,
            purchaseDate: device.purchaseDate ? new Date(device.purchaseDate.seconds * 1000).toISOString().slice(0, 10) : "",
            warrantyExpiry: device.warrantyExpiry ? new Date(device.warrantyExpiry.seconds * 1000).toISOString().slice(0, 10) : "",
            lastMaintenanceDate: device.lastMaintenanceDate ? new Date(device.lastMaintenanceDate.seconds * 1000).toISOString().slice(0, 10) : "",
            nextMaintenanceDate: device.nextMaintenanceDate ? new Date(device.nextMaintenanceDate.seconds * 1000).toISOString().slice(0, 10) : "",
        });
        setEditId(device.id);
        setShowForm(true);
    }

    function formatCurrency(value) {
        if (value === "" || value === null || value === undefined) return "";
        let number = value.toString().replace(/\D/g, "");
        if (!number) return "";
        return Number(number).toLocaleString("vi-VN");
    }

    function handleCostChange(e) {
        const raw = e.target.value.replace(/\D/g, "");
        setForm(f => ({ ...f, cost: raw }));
    }

    function handleCostBlur(e) {
        setForm(f => ({
            ...f,
            cost: f.cost ? Number(f.cost).toLocaleString("vi-VN") : ""
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSave = {
                ...form,
                cost: form.cost ? Number(form.cost.toString().replace(/\D/g, "")) : 0
            };
            if (editId) {
                await updateDevice(editId, dataToSave);
            } else {
                await addDevice(dataToSave);
            }
            setShowForm(false);
            fetchDevices();
        } catch (err) {
            alert("Có lỗi xảy ra!");
        }
        setLoading(false);
    }

    async function handleDelete(id) {
        if (window.confirm("Bạn chắc chắn muốn xóa thiết bị này?")) {
            setLoading(true);
            await deleteDevice(id);
            fetchDevices();
            setLoading(false);
        }
    }

    const filteredDevices = devices.filter(d =>
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.code?.toLowerCase().includes(search.toLowerCase()) ||
        d.category?.toLowerCase().includes(search.toLowerCase()) ||
        d.location?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f6f6fa" }}>
            {/* Sidebar cố định */}
            <div style={{
                width: 240,
                background: "#fff",
                borderRight: "1px solid #eee",
                minHeight: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                zIndex: 100
            }}>
                <Sidebar />
            </div>
            {/* Nội dung */}
            <div style={{
                flex: 1,
                marginLeft: 240,
                padding: "32px 40px",
                overflowY: "auto",
                minHeight: "100vh"
            }}>
                <h1 style={{ fontWeight: 700, fontSize: 32, margin: "0 0 8px 0", color: "#444" }}>
                    Quản lý cơ sở vật chất
                </h1>
                <div style={{ color: "#666", fontSize: 18, marginBottom: 24 }}>
                    Danh sách thiết bị, tài sản của trường học
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, mã, loại, vị trí..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            flex: 1,
                            padding: "10px 16px",
                            borderRadius: 8,
                            border: "1px solid #ccc",
                            fontSize: 16
                        }}
                    />
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
                            cursor: "pointer"
                        }}
                    >
                        <FaPlus /> Thêm thiết bị
                    </button>
                </div>
                <div style={{
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                    padding: 24,
                    minHeight: 300
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                            {filteredDevices.map(device => (
                                <tr key={device.id} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={tdStyle}>
                                        <span
                                            style={{ color: "#007bff", cursor: "pointer", fontWeight: 600 }}
                                            onClick={() => setViewDevice(device)}
                                        >
                                            {device.name}
                                        </span>
                                    </td>
                                    <td style={tdStyle}>{device.category}</td>
                                    <td style={tdStyle}>{device.code}</td>
                                    <td style={tdStyle}>{device.location}</td>
                                    <td style={tdStyle}>{device.quantity}</td>
                                    <td style={tdStyle}>{device.cost ? device.cost.toLocaleString("vi-VN") + " ₫" : ""}</td>
                                    <td style={{ ...tdStyle, color: statusColors[device.status] || "#444", fontWeight: 600 }}>
                                        {device.status}
                                    </td>
                                    <td style={tdStyle}>{device.purchaseDate ? new Date(device.purchaseDate.seconds * 1000).toLocaleDateString() : ""}</td>
                                    <td style={tdStyle}>{device.warrantyExpiry ? new Date(device.warrantyExpiry.seconds * 1000).toLocaleDateString() : ""}</td>
                                    <td style={tdStyle}>
                                        <button onClick={() => handleOpenEdit(device)} style={iconBtn}><FaEdit /></button>
                                        <button onClick={() => handleDelete(device.id)} style={iconBtn}><FaTrash color="#e83e8c" /></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDevices.length === 0 && (
                                <tr>
                                    <td colSpan={10} style={{ textAlign: "center", color: "#888", padding: 32 }}>
                                        {loading ? "Đang tải..." : "Không có thiết bị nào"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Form thêm/sửa */}
                {showForm && (
                    <div
                        style={{
                            ...modalOverlay,
                            zIndex: 9999
                        }}
                        onClick={() => setShowForm(false)}
                    >
                        <div
                            style={{
                                width: "94vw",
                                maxWidth: 430,
                                minWidth: 0,
                                padding: "32px 24px 24px 24px", // padding lớn hơn, đều các cạnh
                                maxHeight: "94vh",
                                overflowY: "auto",
                                boxSizing: "border-box",
                                position: "relative",
                                background: "#fff",
                                borderRadius: 20,
                                boxShadow: "0 8px 32px #0002, 0 1.5px 8px #007bff22"
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Nút đóng */}
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                style={{
                                    position: "absolute",
                                    top: 16,
                                    right: 16,
                                    background: "#f3f3f3",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: 34,
                                    height: 34,
                                    fontWeight: 700,
                                    fontSize: 20,
                                    cursor: "pointer",
                                    color: "#888",
                                    boxShadow: "0 1px 4px #0001"
                                }}
                                aria-label="Đóng"
                            >×</button>
                            <h2 style={{
                                fontSize: 22,
                                marginBottom: 20,
                                textAlign: "center",
                                fontWeight: 700,
                                color: "#007bff",
                                letterSpacing: 0.5
                            }}>
                                {editId ? "Cập nhật thiết bị" : "Thêm thiết bị"}
                            </h2>
                            <form
                                onSubmit={handleSubmit}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 18
                                }}
                            >
                                {/* Nhóm 1: Thông tin chính */}
                                <div>
                                    <h3 style={{ fontSize: 16, color: "#007bff", margin: "0 0 8px 0", fontWeight: 600 }}>Thông tin thiết bị</h3>
                                    <Input label="Tên thiết bị" name="name" value={form.name} onChange={handleInput} required />
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <Select
                                            label="Loại thiết bị"
                                            name="category"
                                            value={form.category}
                                            onChange={handleInput}
                                            options={[
                                                "Thiết bị trình chiếu",
                                                "Thiết bị điện tử",
                                                "Thiết bị phòng học",
                                                "Thiết bị văn phòng",
                                                "Thiết bị thể thao",
                                                "Thiết bị y tế",
                                                "Khác"
                                            ]}
                                        />
                                        <Input label="Mã tài sản" name="code" value={form.code} onChange={handleInput} readOnly />
                                    </div>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <Input label="Vị trí" name="location" value={form.location} onChange={handleInput} />
                                        <Input label="Người phụ trách" name="assignedTo" value={form.assignedTo} onChange={handleInput} />
                                    </div>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <Input label="Số lượng" name="quantity" value={form.quantity} onChange={handleInput} type="number" min={1} />
                                        <Input
                                            label="Giá tiền (₫)"
                                            name="cost"
                                            value={formatCurrency(form.cost)}
                                            onChange={handleCostChange}
                                            onBlur={handleCostBlur}
                                            type="text"
                                            inputMode="numeric"
                                            min={0}
                                        />
                                    </div>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <Select label="Trạng thái" name="status" value={form.status} onChange={handleInput}
                                            options={["Đang dùng", "Hỏng", "Bảo trì"]} />
                                        <Input label="Tình trạng" name="condition" value={form.condition} onChange={handleInput} />
                                    </div>
                                </div>

                                {/* Nhóm 2: Thông tin bảo trì & bảo hành */}
                                <div>
                                    <h3 style={{ fontSize: 15, color: "#17a2b8", margin: "0 0 8px 0", fontWeight: 600 }}>Bảo trì & Bảo hành</h3>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <Input label="Ngày mua" name="purchaseDate" value={form.purchaseDate} onChange={handleInput} type="date" />
                                        <Input label="Ngày hết bảo hành" name="warrantyExpiry" value={form.warrantyExpiry} onChange={handleInput} type="date" />
                                    </div>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <Input label="Bảo trì gần nhất" name="lastMaintenanceDate" value={form.lastMaintenanceDate} onChange={handleInput} type="date" />
                                        <Input label="Bảo trì dự kiến" name="nextMaintenanceDate" value={form.nextMaintenanceDate} onChange={handleInput} type="date" />
                                    </div>
                                </div>

                                {/* Nhóm 3: Thông tin phụ */}
                                <div>
                                    <h3 style={{ fontSize: 15, color: "#888", margin: "0 0 8px 0", fontWeight: 600 }}>Khác</h3>
                                    <Input label="Ghi chú" name="notes" value={form.notes} onChange={handleInput} />
                                    <Input label="Ảnh (URL, cách nhau bởi dấu phẩy)" name="images" value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value.split(",").map(s => s.trim()) }))} />
                                    <Input label="Tài liệu hướng dẫn (URL)" name="manualDocument" value={form.manualDocument} onChange={handleInput} />
                                </div>

                                {/* Nút */}
                                <div style={{ width: "100%", textAlign: "right", marginTop: 8, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                    <button type="button" onClick={() => setShowForm(false)} style={{
                                        ...cancelBtn,
                                        background: "#f3f3f3",
                                        color: "#007bff",
                                        border: "1px solid #cce0ff",
                                        padding: "9px 22px"
                                    }}>Hủy</button>
                                    <button type="submit" style={{
                                        ...submitBtn,
                                        background: "linear-gradient(90deg, #007bff 60%, #0056b3 100%)",
                                        fontWeight: 700,
                                        fontSize: 16,
                                        boxShadow: "0 2px 8px #007bff22",
                                        padding: "9px 22px"
                                    }} disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Xem chi tiết thiết bị */}
                {viewDevice && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <h2>{viewDevice.name}</h2>
                            <div style={{ marginBottom: 12, color: "#888" }}>{viewDevice.category}</div>
                            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
                                <div><b>Mã:</b> {viewDevice.code}</div>
                                <div><b>Vị trí:</b> {viewDevice.location}</div>
                                <div><b>Số lượng:</b> {viewDevice.quantity}</div>
                                <div><b>Giá:</b> {viewDevice.cost ? viewDevice.cost.toLocaleString("vi-VN") + " ₫" : ""}</div>
                                <div><b>Trạng thái:</b> <span style={{ color: statusColors[viewDevice.status] || "#444", fontWeight: 600 }}>{viewDevice.status}</span></div>
                                <div><b>Tình trạng:</b> {viewDevice.condition}</div>
                                <div><b>Ngày mua:</b> {viewDevice.purchaseDate ? new Date(viewDevice.purchaseDate.seconds * 1000).toLocaleDateString() : ""}</div>
                                <div><b>Bảo hành đến:</b> {viewDevice.warrantyExpiry ? new Date(viewDevice.warrantyExpiry.seconds * 1000).toLocaleDateString() : ""}</div>
                                <div><b>Bảo trì gần nhất:</b> {viewDevice.lastMaintenanceDate ? new Date(viewDevice.lastMaintenanceDate.seconds * 1000).toLocaleDateString() : ""}</div>
                                <div><b>Bảo trì dự kiến:</b> {viewDevice.nextMaintenanceDate ? new Date(viewDevice.nextMaintenanceDate.seconds * 1000).toLocaleDateString() : ""}</div>
                                <div><b>Người phụ trách:</b> {viewDevice.assignedTo}</div>
                                <div><b>Ghi chú:</b> {viewDevice.notes}</div>
                            </div>
                            {viewDevice.images && viewDevice.images.length > 0 && (
                                <div style={{ marginBottom: 12 }}>
                                    <b>Ảnh:</b>
                                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                                        {viewDevice.images.map((img, i) => (
                                            <img key={i} src={img} alt="device" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {viewDevice.manualDocument && (
                                <div style={{ marginBottom: 12 }}>
                                    <b>Tài liệu hướng dẫn:</b>
                                    <a href={viewDevice.manualDocument} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, color: "#007bff", textDecoration: "underline" }}>
                                        <FaFilePdf /> Xem tài liệu
                                    </a>
                                </div>
                            )}
                            <div style={{ textAlign: "right", marginTop: 16 }}>
                                <button onClick={() => setViewDevice(null)} style={cancelBtn}>Đóng</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Các component nhỏ
function Input({ label, ...props }) {
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontWeight: 500, marginBottom: 3, fontSize: 15, color: "#333" }}>{label}</label>
            <input {...props} style={{
                padding: "10px 13px",
                borderRadius: 8,
                border: "1.5px solid #cce0ff",
                fontSize: 15,
                outline: "none",
                transition: "border 0.2s",
                marginBottom: 2
            }}
                onFocus={e => e.target.style.border = "1.5px solid #007bff"}
                onBlur={e => e.target.style.border = "1.5px solid #cce0ff"}
            />
        </div>
    );
}
function Select({ label, options, ...props }) {
    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ fontWeight: 500, marginBottom: 3, fontSize: 15, color: "#333" }}>{label}</label>
            <select {...props} style={{
                padding: "10px 13px",
                borderRadius: 8,
                border: "1.5px solid #cce0ff",
                fontSize: 15,
                outline: "none",
                transition: "border 0.2s",
                marginBottom: 2
            }}
                onFocus={e => e.target.style.border = "1.5px solid #007bff"}
                onBlur={e => e.target.style.border = "1.5px solid #cce0ff"}
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}

const thStyle = { padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "#333", borderBottom: "2px solid #eee" };
const tdStyle = { padding: "10px 12px", color: "#444" };
const iconBtn = { background: "none", border: "none", cursor: "pointer", fontSize: 18, marginRight: 8 };
const modalOverlay = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.18)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" };
const modalContent = { background: "#fff", borderRadius: 16, padding: 32, minWidth: 340, maxWidth: 600, boxShadow: "0 4px 32px #0002", position: "relative" };
const cancelBtn = { background: "#eee", color: "#444", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, marginRight: 8, cursor: "pointer" };
const submitBtn = { background: "#007bff", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, cursor: "pointer" }; 