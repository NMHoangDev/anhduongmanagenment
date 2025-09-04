import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          marginLeft: "240px", // Add margin to account for fixed sidebar
          minHeight: "100vh",
          background: "#f5f5f5",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
