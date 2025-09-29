import React, { useState, useEffect } from "react";
import { InputNumber, Select, Button, message } from "antd";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getAllStudents } from "../services/adminServices/studentService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import dayjs from "dayjs";

const TUITION_PER_SESSION = 100000; // 100 nghìn đồng 1 buổi

export function calcFee(attendedSessions, totalSessions) {
  if (totalSessions === 0) return 0;
  const total = totalSessions * TUITION_PER_SESSION;
  return Math.round((attendedSessions / totalSessions) * total);
}

export default function TuitionFee() {
  const [studentData, setStudentData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tất cả");
  const [loading, setLoading] = useState(false);
  const [totalSessions, setTotalSessions] = useState(21);
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const students = await getAllStudents();
      const studentsWithAttendance = await Promise.all(
        students.map(async (student) => {
          const attendanceCount = await getAttendanceCount(
            student.id,
            month,
            year
          );
          return {
            ...student,
            attendanceCount,
            tuition: calcFee(attendanceCount, totalSessions),
            status: "chưa trả", // Default status
          };
        })
      );
      setStudentData(studentsWithAttendance);
    } catch (error) {
      message.error("Lỗi khi tải danh sách học sinh");
    }
    setLoading(false);
  };

  // Lấy số buổi có mặt trong tháng của học sinh
  const getAttendanceCount = async (studentId, month, year) => {
    try {
      const attendanceCol = collection(db, `student_attendance`);
      const snapshot = await getDocs(attendanceCol);
      let count = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Kiểm tra studentId và ngày
        if (data.studentId === studentId) {
          // date dạng "2025-08-09" (YYYY-MM-DD)
          const [y, m, d] = data.date.split("-").map(Number);
          if (m === month && y === year && data.status === "present") {
            count++;
          }
        }
      });
      return count;
    } catch (error) {
      console.error("Error getting attendance:", error);
      return 0;
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const updatedStudents = await Promise.all(
        studentData.map(async (student) => {
          const attendanceCount = await getAttendanceCount(
            student.id,
            month,
            year
          );
          return {
            ...student,
            attendanceCount,
            tuition: calcFee(attendanceCount, totalSessions),
          };
        })
      );
      setStudentData(updatedStudents);
      message.success("Đã tính toán học phí thành công!");
    } catch (error) {
      message.error("Lỗi khi tính toán học phí");
    }
    setLoading(false);
  };

  const handleStatusChange = (studentId, newStatus) => {
    setStudentData((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const filteredStudents = studentData.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.includes(searchTerm) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "tất cả" || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = studentData.filter((s) => s.status === "đã trả").length;
  const totalUnpaid = studentData.filter((s) => s.status === "chưa trả").length;
  const totalAmount = studentData.reduce(
    (sum, student) => sum + (student.tuition || 0),
    0
  );
  const paidAmount = studentData
    .filter((s) => s.status === "đã trả")
    .reduce((sum, student) => sum + (student.tuition || 0), 0);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8fafc",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100vh",
          position: "sticky",
          top: 0,
          flexShrink: 0,
          zIndex: 2,
          background: "#fff",
        }}
      >
        <Sidebar />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          height: "100vh",
        }}
      >
        <Header />
        <div style={{ padding: "32px 40px", flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 28, color: "#1e293b" }}>
              Quản lý học phí
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    background: "#dcfce7",
                    color: "#166534",
                    padding: "8px 16px",
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Đã trả: {totalPaid}
                </div>
                <div
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "8px 16px",
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Chưa trả: {totalUnpaid}
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Form */}
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Tháng:
                </label>
                <Select value={month} onChange={setMonth} style={{ width: 80 }}>
                  {[...Array(12)].map((_, i) => (
                    <Select.Option key={i + 1} value={i + 1}>
                      {i + 1}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Năm:
                </label>
                <InputNumber
                  min={2000}
                  max={2100}
                  value={year}
                  onChange={setYear}
                />
              </div>
              <div>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Tổng số buổi:
                </label>
                <InputNumber
                  min={1}
                  max={31}
                  value={totalSessions}
                  onChange={setTotalSessions}
                />
              </div>
              <div>
                <Button
                  type="primary"
                  onClick={handleCalculate}
                  loading={loading}
                  style={{ marginTop: 32 }}
                >
                  Tính học phí
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 20,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: 24,
                borderRadius: 16,
                color: "white",
                boxShadow: "0 4px 20px rgba(102, 126, 234, 0.3)",
              }}
            >
              <div style={{ fontSize: 14, opacity: 0.9 }}>Tổng học phí</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>
                {totalAmount.toLocaleString()} đ
              </div>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                padding: 24,
                borderRadius: 16,
                color: "white",
                boxShadow: "0 4px 20px rgba(240, 147, 251, 0.3)",
              }}
            >
              <div style={{ fontSize: 14, opacity: 0.9 }}>Đã thu</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>
                {paidAmount.toLocaleString()} đ
              </div>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                padding: 24,
                borderRadius: 16,
                color: "white",
                boxShadow: "0 4px 20px rgba(79, 172, 254, 0.3)",
              }}
            >
              <div style={{ fontSize: 14, opacity: 0.9 }}>Còn lại</div>
              <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>
                {(totalAmount - paidAmount).toLocaleString()} đ
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 16,
              marginBottom: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã học sinh, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              <option value="tất cả">Tất cả trạng thái</option>
              <option value="đã trả">Đã trả</option>
              <option value="chưa trả">Chưa trả</option>
            </select>
          </div>

          {/* Table */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <tr>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "left",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Học sinh
                    </th>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "left",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Mã HS
                    </th>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "left",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "left",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Lớp
                    </th>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "left",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Có mặt
                    </th>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "left",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Tổng buổi
                    </th>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "left",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Học phí
                    </th>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "left",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Trạng thái
                    </th>
                    <th
                      style={{
                        padding: "16px 12px",
                        textAlign: "center",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => (
                    <tr
                      key={student.id}
                      style={{
                        background: idx % 2 === 1 ? "#f8fafc" : "#fff",
                        transition: "background-color 0.2s",
                      }}
                    >
                      <td style={{ padding: "16px 12px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 600,
                            }}
                          >
                            {student.name?.charAt(0) || "H"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>
                              {student.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {student.gender || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "16px 12px",
                          fontWeight: 600,
                          color: "#3b82f6",
                        }}
                      >
                        {student.id}
                      </td>
                      <td style={{ padding: "16px 12px", color: "#64748b" }}>
                        {student.email || "N/A"}
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <span
                          style={{
                            background: "#dbeafe",
                            color: "#1e40af",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {student.className || "N/A"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <span
                          style={{
                            background: "#f0fdf4",
                            color: "#166534",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {student.attendanceCount || 0} buổi
                        </span>
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <span
                          style={{
                            background: "#dbeafe",
                            color: "#1e40af",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {totalSessions} buổi
                        </span>
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <div
                          style={{
                            color: "#1976d2",
                            fontWeight: 700,
                            fontSize: 16,
                          }}
                        >
                          {(student.tuition || 0).toLocaleString()} đ
                        </div>
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            whiteSpace: "nowrap",
                            background:
                              student.status === "đã trả"
                                ? "#dcfce7"
                                : "#fef3c7",
                            color:
                              student.status === "đã trả"
                                ? "#166534"
                                : "#92400e",
                            padding: "6px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {student.status === "đã trả" ? (
                            <>
                              <span style={{ fontSize: 16, marginRight: 4 }}>
                                ✓
                              </span>
                              Đã trả
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: 16, marginRight: 4 }}>
                                ⏳
                              </span>
                              Chưa trả
                            </>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: "16px 12px", textAlign: "center" }}>
                        <select
                          value={student.status}
                          onChange={(e) =>
                            handleStatusChange(student.id, e.target.value)
                          }
                          style={{
                            padding: "6px 12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            fontSize: 12,
                            background: "#fff",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          <option value="chưa trả">Chưa trả</option>
                          <option value="đã trả">Đã trả</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredStudents.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#64748b",
                background: "#fff",
                borderRadius: 16,
                marginTop: 20,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Không tìm thấy học sinh
              </div>
              <div style={{ fontSize: 14 }}>
                Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Support Button */}
    </div>
  );
}
