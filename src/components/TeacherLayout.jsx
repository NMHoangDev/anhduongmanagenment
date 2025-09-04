import React from "react";
import TeacherSidebar from "./TeacherSidebar";

const TeacherLayout = ({ children }) => {
  return (
    <div style={{ display: "flex" }}>
      <TeacherSidebar />
      <div
        style={{
          flex: 1,
          minHeight: "100vh",
          background: "#f5f5f5",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default TeacherLayout;
