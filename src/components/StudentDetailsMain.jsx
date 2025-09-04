import React from "react";
import StudentInfoCard from "./StudentInfoCard";
import ContactInfoCard from "./ContactInfoCard";
import DefaultAvatar from './DefaultAvatar';

export default function StudentDetailsMain({ student }) {
    return (
        <div style={{ padding: 32 }}>
            <h2 style={{ margin: 0, fontWeight: 700 }}>Students Details</h2>
            <div style={{ color: "#888", fontSize: 15, marginBottom: 18 }}>Students / Students details</div>
            <div style={{ fontWeight: 600, marginBottom: 18 }}>About Me</div>
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
            <div style={{ display: "flex", gap: 24, flexWrap: 'wrap' }}>
                <StudentInfoCard student={student} />
                <ContactInfoCard student={student} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 32 }}>
                <button style={{
                    background: "#fff", color: "#7c3aed", border: "1.5px solid #7c3aed",
                    borderRadius: 8, padding: "8px 24px", fontWeight: 600, fontSize: 16, cursor: "pointer"
                }}>Remove</button>
                <button style={{
                    background: "#7c3aed", color: "#fff", border: "none",
                    borderRadius: 8, padding: "8px 24px", fontWeight: 600, fontSize: 16, cursor: "pointer"
                }}>Edit</button>
            </div>
        </div>
    );
} 