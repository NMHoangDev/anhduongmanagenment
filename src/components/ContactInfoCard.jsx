import React from "react";

export default function ContactInfoCard({ student }) {
    return (
        <div style={{
            flex: 1, background: "#fff", borderRadius: 12, padding: 32,
            boxShadow: "0 2px 8px #eee", minWidth: 340, marginBottom: 16
        }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Contact Information</div>
            <div style={{ color: "#888", fontSize: 15, marginBottom: 18 }}>Users</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 15 }}>
                <div><b>Primary Phone</b><br />{student.primaryPhone}</div>
                <div><b>Secondary Phone</b><br />{student.secondaryPhone}</div>
                <div><b>Primary Email</b><br />{student.primaryEmail}</div>
                <div><b>Secondary Email</b><br />{student.secondaryEmail}</div>
                <div><b>Address</b><br />{student.address}</div>
                <div><b>Street Address</b><br />{student.streetAddress}</div>
                <div><b>House Name</b><br />{student.houseName}</div>
                <div><b>House Number</b><br />{student.houseNumber}</div>
            </div>
        </div>
    );
} 