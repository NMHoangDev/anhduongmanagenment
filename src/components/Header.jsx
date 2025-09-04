import React from "react";

export default function Header() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        // padding: "18px 32px",
        background: "#fff",
        borderBottom: "1px solid #eee",
      }}
    >
      {/* <input
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #eee', width: 320 }}
                placeholder="What do you want to find?"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <span style={{ fontWeight: 500 }}>Priscilla Lily</span>
                <span style={{ fontSize: 12, color: '#888' }}>Admin</span>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eee' }}></div>
            </div> */}
    </header>
  );
}
