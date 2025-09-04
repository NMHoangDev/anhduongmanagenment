import React from "react";

export default function StudentInfoCard({ student }) {
    return (
        <div style={{
            flex: 1, background: "#fff", borderRadius: 12, padding: 32,
            boxShadow: "0 2px 8px #eee", minWidth: 340, marginBottom: 16
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
                <img src={student.avatar} alt="avatar" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
                <div>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>{student.name}</div>
                    <div style={{ color: "#888", fontSize: 15 }}>Users</div>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 15 }}>
                <div><b>First Name</b><br />{student.firstName}</div>
                <div><b>Last Name</b><br />{student.lastName}</div>
                <div><b>Father Name</b><br />{student.fatherName}</div>
                <div><b>Mother Name</b><br />{student.motherName}</div>
                <div><b>Father Occupation</b><br />{student.fatherOccupation}</div>
                <div><b>Mother Occupation</b><br />{student.motherOccupation}</div>
                <div><b>Date of Birth</b><br />{student.dob}</div>
                <div><b>Religion</b><br />{student.religion}</div>
                <div><b>Class</b><br />{student.className}</div>
                <div><b>Section</b><br />{student.section}</div>
                <div><b>Roll</b><br />{student.roll}</div>
                <div><b>Admission Date</b><br />{student.admissionDate}</div>
            </div>
        </div>
    );
} 