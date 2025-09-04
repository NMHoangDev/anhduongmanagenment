import React from "react";
import { FaEnvelope, FaPhone, FaUserFriends } from "react-icons/fa";

export default function TeacherDetailCard({ teacher }) {
    if (!teacher) return null;
    return (
        <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 2px 16px #4f8cff22',
            padding: '48px 48px 32px 48px',
            width: 700,
            maxWidth: '95vw',
            margin: '32px auto',
            display: 'flex',
            gap: 48,
            alignItems: 'center',
            border: '2px solid #4f8cff',
        }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
                <img src={teacher.avatar} alt="avatar" style={{ width: 180, height: 180, borderRadius: '50%', objectFit: 'cover', marginBottom: 18 }} />
                <div style={{ fontWeight: 700, fontSize: 22 }}>{teacher.name}</div>
                <div style={{ color: '#888', fontSize: 16, marginBottom: 18 }}>{teacher.role || 'Teacher'}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 18 }}>
                    <a href={`mailto:${teacher.email}`} style={{ background: '#f3f6fd', borderRadius: 8, padding: 14, color: '#4f8cff', fontSize: 22, display: 'inline-flex', alignItems: 'center' }}><FaEnvelope /></a>
                    <a href={`tel:${teacher.phone}`} style={{ background: '#f3f6fd', borderRadius: 8, padding: 14, color: '#4f8cff', fontSize: 22, display: 'inline-flex', alignItems: 'center' }}><FaPhone /></a>
                    <span style={{ background: '#f3f6fd', borderRadius: 8, padding: 14, color: '#4f8cff', fontSize: 22, display: 'inline-flex', alignItems: 'center' }}><FaUserFriends /></span>
                </div>
            </div>
            <div style={{ flex: 2, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>About</div>
                <div style={{ color: '#888', fontSize: 16, minHeight: 60, marginBottom: 24 }}>{teacher.about || ''}</div>
                <div style={{ display: 'flex', gap: 48, marginBottom: 24 }}>
                    <div>
                        <div style={{ color: '#888', fontSize: 14 }}>Age</div>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{teacher.age}</div>
                    </div>
                    <div>
                        <div style={{ color: '#888', fontSize: 14 }}>Gender</div>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{teacher.gender}</div>
                    </div>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Teachers from the same class</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(teacher.classmates || []).slice(0, 5).map((mate, idx) => (
                        <img key={idx} src={mate.avatar} alt="mate" style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #fff', marginLeft: idx ? -10 : 0, boxShadow: '0 1px 4px #0001' }} />
                    ))}
                    {teacher.classmates && teacher.classmates.length > 5 && (
                        <span style={{ color: '#888', fontSize: 15, marginLeft: 6 }}>+{teacher.classmates.length - 5} more</span>
                    )}
                </div>
            </div>
        </div>
    );
} 