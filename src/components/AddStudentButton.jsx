import React from "react";

export default function AddStudentButton({ onClick }) {
    return (
        <button
            style={{
                background: '#fff',
                color: '#7c3aed',
                border: '1.5px solid #7c3aed',
                borderRadius: 8,
                padding: '8px 20px',
                fontWeight: 600,
                fontSize: 16,
                float: 'right',
                marginBottom: 18,
                cursor: 'pointer',
            }}
            onClick={onClick}
        >
            + Add Students
        </button>
    );
} 