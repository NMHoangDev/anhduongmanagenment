import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import DefaultAvatar from "./DefaultAvatar";

const tabList = [
    "Tổng quan",
    "Lương & Thưởng",
    "Thông tin khẩn cấp",
    "Lịch sử nghỉ phép",
    "Đánh giá hiệu suất",
];

export default function TeacherProfileDetail({ teacher, onBack }) {
    const [activeTab, setActiveTab] = useState("Tổng quan");
    const quickStats = [
        { label: "Lớp đang dạy", value: 3, icon: "🏫" },
        { label: "Năm kinh nghiệm", value: teacher.age ? teacher.age - 25 : 5, icon: "📅" },
        { label: "Học sinh phụ trách", value: 95, icon: "👦" },
        { label: "Hoàn thành CV", value: "96%", icon: "📈" }
    ];

    // Ngăn chặn việc click vào nội dung modal đóng modal
    const handleModalContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // Lớp nền mờ cho modal, click vào sẽ đóng
        <div onClick={onBack} style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)', zIndex: 1500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            {/* Khung nội dung của modal */}
            <div onClick={handleModalContentClick} style={{
                display: "flex", gap: 0, background: "#fff",
                borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
                height: '85vh', maxHeight: '700px',
                width: '90%', maxWidth: '1100px',
                overflow: 'hidden'
            }}>
                {/* Sidebar trái bên trong modal - đã được tinh chỉnh */}
                <div style={{
                    minWidth: 320, maxWidth: 320, background: '#fcfdff',
                    borderRight: "1px solid #e8eef3",
                    padding: "32px",
                    display: 'flex', flexDirection: 'column',
                    height: '100%', overflowY: 'auto', gap: '4px'
                }}>
                    <div style={{ alignSelf: 'center', position: 'relative', marginBottom: 16 }}>
                        {teacher.avatar ? (
                            <img
                                src={teacher.avatar}
                                alt="avatar"
                                style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '4px solid #fff' }}
                            />
                        ) : (
                            <DefaultAvatar name={teacher.name} size={120} />
                        )}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 4, textAlign: 'center' }}>{teacher.name}</div>
                    <div style={{ color: "#888", fontSize: 15, marginBottom: 16, textAlign: 'center' }}>#{teacher.id}</div>
                    <div style={{ color: '#1976d2', fontWeight: 600, fontSize: 16, marginBottom: 20, background: '#e3f2fd', padding: '4px 12px', borderRadius: '12px', alignSelf: 'center', display: 'inline-block' }}>{teacher.role || 'Giáo viên'}</div>

                    <div style={{ width: '100%', borderTop: '1px solid #eee', paddingTop: '24px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div><strong style={{ minWidth: '80px', display: 'inline-block', color: '#888' }}>Môn học:</strong> {teacher.subject}</div>
                        <div><strong style={{ minWidth: '80px', display: 'inline-block', color: '#888' }}>Email:</strong> {teacher.email}</div>
                        <div><strong style={{ minWidth: '80px', display: 'inline-block', color: '#888' }}>Điện thoại:</strong> {teacher.phone}</div>
                        <div><strong style={{ minWidth: '80px', display: 'inline-block', color: '#888' }}>Giới tính:</strong> {teacher.gender}</div>
                        <div><strong style={{ minWidth: '80px', display: 'inline-block', color: '#888' }}>Tuổi:</strong> {teacher.age}</div>
                    </div>

                    <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '24px' }}>
                        <div style={{ fontWeight: 600, marginBottom: 8, textAlign: 'left', width: '100%' }}>Trạng thái</div>
                        <div style={{ color: '#4caf50', fontWeight: 600, fontSize: 15, marginBottom: 0, textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4caf50' }}></span>
                            Đang công tác
                        </div>
                    </div>
                </div>

                {/* Nội dung chính bên phải trong modal */}
                <div style={{ flex: 1, padding: "32px 40px", overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '28px', color: '#333' }}>Hồ sơ giáo viên</h2>
                        <button
                            onClick={onBack}
                            style={{ background: '#eee', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            ×
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: 32, borderBottom: "1px solid #eee", marginBottom: 32 }}>
                        {tabList.map(tab => (
                            <div
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{ fontWeight: 600, fontSize: 16, padding: "12px 0", color: activeTab === tab ? "#1976d2" : "#888", borderBottom: activeTab === tab ? "2.5px solid #1976d2" : "2.5px solid transparent", cursor: "pointer", transition: 'color 0.2s' }}
                            >{tab}</div>
                        ))}
                    </div>
                    {activeTab === "Tổng quan" && <>
                        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 18 }}>Giới thiệu</div>
                        <div style={{ color: "#444", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>{teacher.about}</div>

                        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 18 }}>Chỉ số nhanh</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, width: '100%', marginBottom: 32 }}>
                            {quickStats.map((stat, i) => (
                                <div key={i} style={{ background: '#f3f6fd', border: '1px solid #e0e8f3', borderRadius: 10, padding: '16px', textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#1976d2', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                                    <span style={{ fontSize: 24 }}>{stat.icon}</span>
                                    <span style={{ fontSize: 22, color: '#222', fontWeight: 700 }}>{stat.value}</span>
                                    <span style={{ fontSize: 14, color: '#888', fontWeight: 500 }}>{stat.label}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 18 }}>Thông tin công việc</div>
                        <table style={{ width: "100%", borderRadius: 12, overflow: 'hidden', border: '1px solid #eee', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f9fafb' }}>
                                <tr style={{ color: "#888", fontWeight: 500, fontSize: 15 }}>
                                    <th style={{ textAlign: "left", padding: 12 }}>Phòng ban</th>
                                    <th style={{ textAlign: "left", padding: 12 }}>Quản lý</th>
                                    <th style={{ textAlign: "left", padding: 12 }}>Ngày vào làm</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ background: '#fff', borderTop: '1px solid #eee' }}>
                                    <td style={{ padding: 12 }}>Giáo vụ</td>
                                    <td style={{ padding: 12 }}>Nguyễn Thị Lan</td>
                                    <td style={{ padding: 12 }}>15/08/2012</td>
                                </tr>
                            </tbody>
                        </table>
                    </>}
                    {activeTab !== "Tổng quan" && <div style={{ color: '#888', fontSize: 16, marginTop: 32, textAlign: 'center' }}>Chức năng đang được phát triển...</div>}
                </div>
            </div>
        </div>
    );
} 