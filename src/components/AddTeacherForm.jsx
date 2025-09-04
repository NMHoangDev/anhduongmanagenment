import React, { useState, useEffect } from "react";
// Bỏ import các hàm của firestore, vì đã chuyển qua teacherService
import { addTeacher, updateTeacher } from "../service/teacherService";

export default function AddTeacherForm({ onClose, onTeacherAdded, teacherToEdit }) {
    const [tab, setTab] = useState("manual");
    const [form, setForm] = useState({
        name: "",
        age: "",
        email: "",
        phone: "",
        subject: "",
        gender: "",
        about: "",
        avatar: ""
    });
    const [isLoading, setIsLoading] = useState(false);

    // Xác định xem form đang ở chế độ sửa hay thêm mới
    const isEditMode = Boolean(teacherToEdit);

    // Sử dụng useEffect để điền dữ liệu vào form khi ở chế độ sửa
    useEffect(() => {
        if (isEditMode) {
            setForm({
                name: teacherToEdit.name || "",
                age: teacherToEdit.age || "",
                email: teacherToEdit.email || "",
                phone: teacherToEdit.phone || "",
                subject: teacherToEdit.subject || "",
                gender: teacherToEdit.gender || "",
                about: teacherToEdit.about || "",
                avatar: teacherToEdit.avatar || ""
            });
        }
    }, [teacherToEdit, isEditMode]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.subject) {
            alert("Vui lòng nhập đầy đủ các trường bắt buộc (Tên, Email, Môn học).");
            return;
        }
        setIsLoading(true);

        const teacherData = {
            ...form,
            age: Number(form.age) || 0,
        };

        try {
            if (isEditMode) {
                // Chế độ sửa
                await updateTeacher(teacherToEdit.id, teacherData);
                alert("Cập nhật thông tin giáo viên thành công!");
            } else {
                // Chế độ thêm mới
                await addTeacher(teacherData);
                alert("Thêm giáo viên mới thành công!");
            }
            onTeacherAdded(); // Tải lại danh sách
            onClose(); // Đóng form
        } catch (error) {
            alert(`Thao tác thất bại: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#fff', borderRadius: 16, padding: 40, minWidth: 600, maxWidth: '90vw', boxShadow: '0 8px 32px #0002', position: 'relative'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#888', cursor: 'pointer' }}>×</button>
                <h2 style={{ fontWeight: 700, marginBottom: 18 }}>{isEditMode ? "Cập nhật thông tin giáo viên" : "Thêm giáo viên mới"}</h2>
                <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
                    <button onClick={() => setTab('manual')} style={{ background: 'none', border: 'none', fontWeight: tab === 'manual' ? 700 : 500, fontSize: 17, color: tab === 'manual' ? '#222' : '#888', borderBottom: tab === 'manual' ? '2px solid #4f8cff' : '2px solid transparent', paddingBottom: 6, cursor: 'pointer' }}>Nhập thủ công</button>
                    {!isEditMode && <button onClick={() => setTab('csv')} style={{ background: 'none', border: 'none', fontWeight: tab === 'csv' ? 700 : 500, fontSize: 17, color: tab === 'csv' ? '#222' : '#888', borderBottom: tab === 'csv' ? '2px solid transparent' : '2px solid transparent', paddingBottom: 6, cursor: 'pointer' }}>Nhập từ file CSV</button>}
                </div>
                {tab === 'manual' ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Các trường input tương tự như trước */}
                        <div style={{ display: 'flex', gap: 24 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: 500 }}>Họ và tên</label>
                                <input name="name" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }} value={form.name} onChange={handleInputChange} required />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: 500 }}>Tuổi</label>
                                <input name="age" type="number" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }} value={form.age} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 24 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: 500 }}>Địa chỉ Email</label>
                                <input name="email" type="email" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }} value={form.email} onChange={handleInputChange} required />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: 500 }}>Số điện thoại</label>
                                <input name="phone" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }} value={form.phone} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 24 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: 500 }}>Môn dạy chính</label>
                                <select name="subject" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }} value={form.subject} onChange={handleInputChange} required>
                                    <option value="">Chọn môn học</option>
                                    <option value="Toán">Toán</option>
                                    <option value="Tiếng Việt">Tiếng Việt</option>
                                    <option value="Anh">Anh</option>
                                    <option value="Tự nhiên & Xã hội">Tự nhiên & Xã hội</option>
                                    <option value="Mỹ thuật">Mỹ thuật</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontWeight: 500 }}>Giới tính</label>
                                <select name="gender" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }} value={form.gender} onChange={handleInputChange}>
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontWeight: 500 }}>Link ảnh đại diện</label>
                            <input name="avatar" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4 }} value={form.avatar} onChange={handleInputChange} />
                        </div>
                        <div>
                            <label style={{ fontWeight: 500 }}>Giới thiệu ngắn</label>
                            <textarea name="about" rows="3" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', marginTop: 4, resize: 'vertical' }} value={form.about} onChange={handleInputChange}></textarea>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 18, marginTop: 12 }}>
                            <button type="button" onClick={onClose} style={{ background: '#f1f1f1', border: '1px solid #ddd', color: '#333', borderRadius: 6, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
                                Hủy
                            </button>
                            <button type="submit" style={{ background: '#4f8cff', color: 'white', border: 'none', borderRadius: 6, padding: '10px 32px', fontWeight: 600, fontSize: 16, cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
                                {isLoading ? 'Đang lưu...' : 'Lưu lại'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: 18 }}>
                        <div>Chức năng nhập từ file CSV sẽ sớm được cập nhật.</div>
                    </div>
                )}
            </div>
        </div>
    );
} 