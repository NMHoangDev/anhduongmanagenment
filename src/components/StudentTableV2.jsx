import React from "react";

export default function StudentTableV2({ students, selectedId, onSelectStudent }) {
    return (
        <div style={{ position: 'relative' }}>
            <table style={{ width: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px #eee', borderCollapse: 'collapse', marginTop: 24 }}>
                <thead style={{ background: '#f3f6fd' }}>
                    <tr>
                        <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Student ID</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Email address</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Class</th>
                        <th style={{ padding: 12, textAlign: 'left' }}>Gender</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student, idx) => (
                        <tr
                            key={student.id}
                            style={{
                                background: selectedId === student.id ? '#4f8cff' : idx % 2 === 1 ? '#f7faff' : '#fff',
                                color: selectedId === student.id ? '#fff' : '#222',
                                cursor: 'pointer',
                                transition: 'background 0.2s, color 0.2s',
                            }}
                            onClick={() => onSelectStudent(student.id)}
                        >
                            <td style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <img src={student.avatar} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: selectedId === student.id ? '2px solid #fff' : '2px solid #eee' }} />
                                {student.name}
                            </td>
                            <td style={{ padding: 10 }}>{student.id}</td>
                            <td style={{ padding: 10 }}>{student.email}</td>
                            <td style={{ padding: 10 }}>{student.className}</td>
                            <td style={{ padding: 10 }}>{student.gender}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
} 