import React from "react";
import StudentSidebar from "./StudentSidebar";

const StudentLayout = ({ children }) => {
  return (
    <div style={{ display: "flex" }}>
      <StudentSidebar />
      <div
        style={{
          flex: 1,
          minHeight: "100vh",
          background: "#f5f5f5",
          padding: 20,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default StudentLayout;
