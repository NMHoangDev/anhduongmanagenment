import React from 'react';
import StudentTableRow from "./StudentTableRow";

export default function StudentTable({ students, onDetailsClick, onEdit, onDelete }) {
    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f3f6fd' }}>
                <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', width: '60px' }}>Ảnh</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Họ và tên</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Lớp</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày sinh</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>SĐT Phụ huynh</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tên phụ huynh</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Hành động</th>
                </tr>
            </thead>
            <tbody>
                {students.length === 0 ? (
                    <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#888' }}>
                            Không tìm thấy học sinh nào.
                        </td>
                    </tr>
                ) : (
                    students.map((student) => (
                        <StudentTableRow
                            key={student.id}
                            student={student}
                            onDetailsClick={onDetailsClick}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </tbody>
        </table>
    );
} 