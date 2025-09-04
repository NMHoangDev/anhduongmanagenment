import React from "react";
import { FaEnvelope, FaPhone, FaUserFriends } from "react-icons/fa";
import DefaultAvatar from './DefaultAvatar';

export default function StudentDetailCard({ student }) {
    if (!student) return null;
    return (
        <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 2px 16px #0001',
            padding: '32px 32px 24px 32px',
            width: 320,
            minWidth: 280,
            textAlign: 'center',
            marginTop: 32
        }}>
            <div style={{ fontSize: 22, color: '#888', marginBottom: 8 }}>{student.id}</div>
            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', marginBottom: 24 }}>
                {student.avatar ? (
                    <img
                        src={student.avatar}
                        alt={student.name}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid #f0f0f0',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                            marginBottom: 8,
                            background: '#fff'
                        }}
                        onError={e => { e.target.onerror = null; e.target.src = "/default-avatar.png"; }}
                    />
                ) : (
                    <DefaultAvatar name={student.name} size={100} />
                )}
                <div style={{ fontWeight: 600, fontSize: 20, marginTop: 8 }}>{student.name}</div>
            </div>
            <div style={{ color: '#888', fontSize: 16, marginBottom: 18 }}>{student.role || 'Science student'}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 18 }}>
                <a href={`mailto:${student.email}`} style={{ background: '#f3f6fd', borderRadius: 8, padding: 10, color: '#4f8cff', fontSize: 20, display: 'inline-flex', alignItems: 'center' }}><FaEnvelope /></a>
                <a href={`tel:${student.phone}`} style={{ background: '#f3f6fd', borderRadius: 8, padding: 10, color: '#4f8cff', fontSize: 20, display: 'inline-flex', alignItems: 'center' }}><FaPhone /></a>
                <span style={{ background: '#f3f6fd', borderRadius: 8, padding: 10, color: '#4f8cff', fontSize: 20, display: 'inline-flex', alignItems: 'center' }}><FaUserFriends /></span>
            </div>
            <div style={{ textAlign: 'left', marginTop: 18 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>About</div>
                <div style={{ color: '#888', fontSize: 15, minHeight: 32 }}>{student.about || ''}</div>
                <div style={{ display: 'flex', gap: 24, margin: '18px 0' }}>
                    <div>
                        <div style={{ color: '#888', fontSize: 13 }}>Age</div>
                        <div style={{ fontWeight: 600 }}>{student.age}</div>
                    </div>
                    <div>
                        <div style={{ color: '#888', fontSize: 13 }}>Gender</div>
                        <div style={{ fontWeight: 600 }}>{student.gender}</div>
                    </div>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>People from the same class</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(student.classmates || []).slice(0, 5).map((mate, idx) => (
                        <img key={idx} src={mate.avatar} alt="mate" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #fff', marginLeft: idx ? -10 : 0, boxShadow: '0 1px 4px #0001' }} />
                    ))}
                    {student.classmates && student.classmates.length > 5 && (
                        <span style={{ color: '#888', fontSize: 15, marginLeft: 6 }}>+{student.classmates.length - 5} more</span>
                    )}
                </div>
            </div>
        </div>
    );
} 