import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DefaultAvatar from "../components/DefaultAvatar";
import PaymentQrModal from "../components/PaymentQrModal";
import {
  FaFileCsv,
  FaFilter,
  FaCheckCircle,
  FaCog,
  FaEye,
  FaEdit,
} from "react-icons/fa";
import {
  computeMonthlySalary,
  saveMonthlyPayroll,
  getMonthlyPayroll,
  markPayrollAsPaid,
  getUnpaidPayrolls,
} from "../services/teacherSalaryService";

// Hàm tạo dữ liệu giáo viên cơ bản (status sẽ được sync với payroll service)
const generateTeacherData = (teacher) => ({
  ...teacher,
  // status: 'paid' | 'unpaid' (unpaid covers "chưa tính" / "chưa trả")
  status: "unpaid",
  payroll: null,
  payrollSaved: false,
  baseSalaryInput: 8000000,
  totalSessionsInput: 26,
});

export default function TeacherSalary() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedRow, setExpandedRow] = useState(null);

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [globalBaseSalary, setGlobalBaseSalary] = useState(8000000);
  const [globalTotalSessions, setGlobalTotalSessions] = useState(26);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchTeachersAndSalaries = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "teachers"));
        const teachersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const salaryData = teachersData.map(generateTeacherData);

        // check saved payrolls for visible teachers and set consistent status
        await Promise.all(
          salaryData.map(async (t) => {
            try {
              const existing = await getMonthlyPayroll({
                teacherId: t.id,
                month,
              });
              if (existing) {
                t.payrollSaved = true;
                t.payroll = existing;
                // if payroll doc exists, paid flag determines status
                t.status = existing.paid ? "paid" : "unpaid";
              } else {
                // no payroll stored -> keep unpaid (means not computed/saved => not paid)
                t.payrollSaved = false;
                t.payroll = null;
                t.status = "unpaid";
              }
            } catch (err) {
              console.warn("error checking payroll for", t.id, err);
              t.payrollSaved = false;
              t.payroll = null;
              t.status = "unpaid";
            }
          })
        );
        setSalaries(salaryData);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu lương: ", error);
      }
      setLoading(false);
    };
    fetchTeachersAndSalaries();
  }, [month]);

  const filteredSalaries = salaries.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenQrModal = (teacher) => {
    setSelectedTeacher(teacher);
    setIsQrModalOpen(true);
  };

  const handleCloseQrModal = () => {
    setSelectedTeacher(null);
    setIsQrModalOpen(false);
  };

  const handleConfirmPayment = async (teacherId) => {
    try {
      const t = salaries.find((s) => s.id === teacherId);
      if (!t || !t.payrollSaved) {
        alert("Bảng lương chưa được lưu, vui lòng lưu trước khi chi trả.");
        return;
      }
      await markPayrollAsPaid({
        teacherId,
        month,
        paidBy: "ui",
        paidAmount: t.payroll?.salary ?? null,
      });
      setSalaries((currentSalaries) =>
        currentSalaries.map((s) =>
          s.id === teacherId
            ? {
                ...s,
                status: "paid",
                payroll: { ...(s.payroll || {}), paid: true },
              }
            : s
        )
      );
      handleCloseQrModal();
    } catch (err) {
      console.error("Error marking paid:", err);
      alert("Lỗi khi xác nhận chi trả: " + (err.message || err));
    }
  };

  const updateBaseSalary = (teacherId, value) => {
    setSalaries((current) =>
      current.map((t) =>
        t.id === teacherId ? { ...t, baseSalaryInput: Number(value) } : t
      )
    );
  };

  const updateTotalSessions = (teacherId, value) => {
    setSalaries((current) =>
      current.map((t) =>
        t.id === teacherId ? { ...t, totalSessionsInput: Number(value) } : t
      )
    );
  };

  const applyGlobalSettings = () => {
    setSalaries((current) =>
      current.map((t) => ({
        ...t,
        baseSalaryInput: globalBaseSalary,
        totalSessionsInput: globalTotalSessions,
      }))
    );
    setShowGlobalSettings(false);
  };

  const handleComputePayroll = async (teacher) => {
    try {
      const baseSalary = Number(teacher.baseSalaryInput || 8000000);
      const totalSessionsInMonth = Number(teacher.totalSessionsInput || 26);

      const res = await computeMonthlySalary({
        teacherId: teacher.id,
        month,
        totalSessionsInMonth,
        baseSalary,
        mode: "byCheckin",
        tzOffsetMinutes: 420,
      });

      setSalaries((current) =>
        current.map((t) =>
          t.id === teacher.id
            ? {
                ...t,
                payroll: { ...res },
                payrollSaved: false,
                status: "unpaid",
              }
            : t
        )
      );

      console.log("Lương đã tính xong cho", teacher?.id || teacher?.name, res);
    } catch (err) {
      console.log("Lỗi khi tính lương cho", teacher?.id || teacher?.name, err);
      alert("Lỗi khi tính lương: " + (err.message || err));
    }
  };

  const handleSavePayroll = async (teacher) => {
    try {
      if (!teacher.payroll) {
        alert("Chưa có dữ liệu lương để lưu. Vui lòng tính lương trước.");
        return;
      }
      const payload = {
        ...teacher.payroll,
        teacherId: teacher.id,
        teacherName: teacher.name,
        month,
        savedBy: "ui",
        locked: true,
      };
      const id = await saveMonthlyPayroll(payload);
      setSalaries((current) =>
        current.map((t) =>
          t.id === teacher.id
            ? {
                ...t,
                payrollSaved: true,
                payroll: payload,
                status: payload.paid ? "paid" : "unpaid",
              }
            : t
        )
      );
      alert("Lưu bảng lương thành công.");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu bảng lương: " + (err.message || err));
    }
  };

  const handleComputeAll = async () => {
    try {
      setLoading(true);
      await Promise.all(filteredSalaries.map((t) => handleComputePayroll(t)));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandedRow = (teacherId) => {
    setExpandedRow(expandedRow === teacherId ? null : teacherId);
  };

  // Mobile Card Component
  const MobileTeacherCard = ({ item }) => (
    <div style={mobileCardStyle}>
      {/* Header */}
      <div style={mobileCardHeaderStyle}>
        <div
          style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}
        >
          {item.avatar ? (
            <img src={item.avatar} alt={item.name} style={smallAvatarStyle} />
          ) : (
            <div style={mobileAvatarStyle}>
              {item.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "600", fontSize: "14px", color: "#333" }}>
              {item.name}
            </div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {item.payroll ? (
                <span style={{ color: "#1a73e8", fontWeight: "600" }}>
                  {(item.payroll.salary / 1000000).toFixed(1)}M VNĐ
                </span>
              ) : (
                "Chưa tính lương"
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={
              item.status === "paid"
                ? mobileStatusPaidStyle
                : mobileStatusPendingStyle
            }
          >
            {item.status === "paid" ? "Đã trả" : "Chờ"}
          </span>
          <button
            onClick={() => toggleExpandedRow(item.id)}
            style={mobileExpandButtonStyle}
          >
            <FaEye size={12} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expandedRow === item.id && (
        <div style={mobileExpandedContentStyle}>
          <div style={mobileInputRowStyle}>
            <div style={mobileInputGroupStyle}>
              <label style={mobileInputLabelStyle}>Lương cơ bản:</label>
              <input
                type="number"
                value={item.baseSalaryInput || 8000000}
                onChange={(e) => updateBaseSalary(item.id, e.target.value)}
                style={mobileInputStyle}
              />
            </div>
            <div style={mobileInputGroupStyle}>
              <label style={mobileInputLabelStyle}>Tổng buổi:</label>
              <input
                type="number"
                value={item.totalSessionsInput || 26}
                onChange={(e) => updateTotalSessions(item.id, e.target.value)}
                style={mobileInputStyle}
              />
            </div>
          </div>

          {item.payroll && (
            <div style={mobilePayrollInfoStyle}>
              <div>
                Buổi thực tế: <strong>{item.payroll.actualSessions}</strong>
              </div>
              <div>
                Tỷ lệ: <strong>{Math.round(item.payroll.rate * 100)}%</strong>
              </div>
              <div>
                Lương:{" "}
                <strong style={{ color: "#1a73e8" }}>
                  {item.payroll.salary.toLocaleString()} VNĐ
                </strong>
              </div>
            </div>
          )}

          <div style={mobileActionRowStyle}>
            {item.status === "paid" ? (
              <span
                style={{
                  ...mobileStatusPaidStyle,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <FaCheckCircle size={12} /> Hoàn thành
              </span>
            ) : (
              <button
                onClick={() => handleOpenQrModal(item)}
                style={{ ...mobileButtonStyle, background: "#007bff" }}
              >
                Chi trả
              </button>
            )}

            <button
              onClick={() => handleComputePayroll(item)}
              style={{ ...mobileButtonStyle, background: "#17a2b8" }}
            >
              Tính lương
            </button>

            <button
              onClick={() => handleSavePayroll(item)}
              style={{
                ...mobileButtonStyle,
                background: item.payrollSaved ? "#6c757d" : "#ffc107",
                color: item.payrollSaved ? "#fff" : "#111",
                opacity: item.payrollSaved ? 0.7 : 1,
              }}
              disabled={item.payrollSaved}
            >
              {item.payrollSaved ? "Đã lưu" : "Lưu"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f6f6fa" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Header title="Quản lý Lương Giáo viên" />
        <main
          style={{
            padding: isMobile ? "10px 15px" : "15px 20px 20px 20px",
            overflow: "auto",
            flex: 1,
          }}
        >
          {/* Header section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "15px",
              flexDirection: isMobile ? "column" : "row",
              gap: "10px",
            }}
          >
            <h2
              style={{
                color: "#333",
                fontSize: isMobile ? "18px" : "20px",
                margin: 0,
                minWidth: isMobile ? "auto" : "200px",
              }}
            >
              Bảng lương {month} ({salaries.length})
            </h2>
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexWrap: "wrap",
                width: isMobile ? "100%" : "auto",
              }}
            >
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontSize: "14px",
                  flex: isMobile ? "1" : "auto",
                }}
              />
              <button
                onClick={() => setShowGlobalSettings(!showGlobalSettings)}
                style={{
                  background: "#6c757d",
                  color: "#fff",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                <FaCog size={12} /> {isMobile ? "" : "Cài đặt"}
              </button>
              <button
                onClick={handleComputeAll}
                style={{
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                {isMobile ? "Tính tất cả" : "Tính toàn bộ"}
              </button>
            </div>
          </div>

          {/* Global Settings */}
          {showGlobalSettings && (
            <div
              style={{
                background: "#fff",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "15px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                border: "1px solid #e9ecef",
              }}
            >
              <h3
                style={{
                  marginBottom: "10px",
                  color: "#495057",
                  fontSize: "16px",
                }}
              >
                Cài đặt chung
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "end",
                  flexDirection: isMobile ? "column" : "row",
                }}
              >
                <div
                  style={{
                    flex: isMobile ? "1" : "1 1 200px",
                    minWidth: "150px",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Lương cơ bản (VNĐ):
                  </label>
                  <input
                    type="number"
                    value={globalBaseSalary}
                    onChange={(e) =>
                      setGlobalBaseSalary(Number(e.target.value))
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: isMobile ? "1" : "1 1 120px",
                    minWidth: "100px",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}
                  >
                    Tổng số buổi:
                  </label>
                  <input
                    type="number"
                    value={globalTotalSessions}
                    onChange={(e) =>
                      setGlobalTotalSessions(Number(e.target.value))
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <button
                  onClick={applyGlobalSettings}
                  style={{
                    background: "#007bff",
                    color: "#fff",
                    border: "none",
                    padding: "8px 15px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontSize: "14px",
                    width: isMobile ? "100%" : "auto",
                  }}
                >
                  Áp dụng cho tất cả
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ marginBottom: "15px" }}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên giáo viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                maxWidth: isMobile ? "100%" : "400px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "14px",
              }}
            />
          </div>

          {loading ? (
            <p style={{ textAlign: "center", padding: "50px" }}>
              Đang tải dữ liệu...
            </p>
          ) : (
            <>
              {/* Mobile View */}
              {isMobile ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {filteredSalaries.map((item) => (
                    <MobileTeacherCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                /* Desktop View */
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "8px",
                    padding: "0px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: "900px",
                      }}
                    >
                      <thead style={{ background: "#f8f9fa" }}>
                        <tr>
                          <th style={responsiveThStyle}>Giáo viên</th>
                          <th style={{ ...responsiveThStyle, width: "120px" }}>
                            Lương cơ bản
                          </th>
                          <th style={{ ...responsiveThStyle, width: "80px" }}>
                            Buổi
                          </th>
                          <th style={{ ...responsiveThStyle, width: "140px" }}>
                            Lương tính được
                          </th>
                          <th
                            style={{
                              ...responsiveThStyle,
                              width: "100px",
                              textAlign: "center",
                            }}
                          >
                            Trạng thái
                          </th>
                          <th
                            style={{
                              ...responsiveThStyle,
                              width: "180px",
                              textAlign: "center",
                            }}
                          >
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSalaries.map((item) => (
                          <tr
                            key={item.id}
                            style={{ borderBottom: "1px solid #f0f0f0" }}
                          >
                            <td style={responsiveTdStyle}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  minWidth: "150px",
                                }}
                              >
                                {item.avatar ? (
                                  <img
                                    src={item.avatar}
                                    alt={item.name}
                                    style={smallAvatarStyle}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: "50%",
                                      background: "#007bff",
                                      color: "white",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "12px",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    {item.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span
                                  style={{
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td style={responsiveTdStyle}>
                              <input
                                type="number"
                                value={item.baseSalaryInput || 8000000}
                                onChange={(e) =>
                                  updateBaseSalary(item.id, e.target.value)
                                }
                                style={{
                                  width: "100%",
                                  maxWidth: "100px",
                                  padding: "4px 6px",
                                  borderRadius: "3px",
                                  border: "1px solid #ddd",
                                  fontSize: "13px",
                                }}
                              />
                            </td>
                            <td style={responsiveTdStyle}>
                              <input
                                type="number"
                                value={item.totalSessionsInput || 26}
                                onChange={(e) =>
                                  updateTotalSessions(item.id, e.target.value)
                                }
                                style={{
                                  width: "100%",
                                  maxWidth: "60px",
                                  padding: "4px 6px",
                                  borderRadius: "3px",
                                  border: "1px solid #ddd",
                                  fontSize: "13px",
                                }}
                              />
                            </td>
                            <td style={responsiveTdStyle}>
                              {item.payroll ? (
                                <div style={{ fontSize: "13px" }}>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#1a73e8",
                                    }}
                                  >
                                    {(item.payroll.salary / 1000000).toFixed(1)}
                                    M
                                  </div>
                                  <small
                                    style={{ color: "#666", fontSize: "11px" }}
                                  >
                                    {Math.round(item.payroll.rate * 100)}% (
                                    {item.payroll.actualSessions})
                                  </small>
                                </div>
                              ) : (
                                <small
                                  style={{ color: "#999", fontSize: "12px" }}
                                >
                                  Chưa tính
                                </small>
                              )}
                            </td>
                            <td
                              style={{
                                ...responsiveTdStyle,
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={
                                  item.status === "paid"
                                    ? compactStatusPaidStyle
                                    : compactStatusPendingStyle
                                }
                              >
                                {item.status === "paid" ? "Đã trả" : "Chờ"}
                              </span>
                            </td>
                            <td
                              style={{
                                ...responsiveTdStyle,
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 4,
                                  justifyContent: "center",
                                  alignItems: "center",
                                  flexWrap: "nowrap",
                                }}
                              >
                                {item.status === "paid" ? (
                                  <span
                                    style={{
                                      ...compactStatusPaidStyle,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      fontSize: "10px",
                                      padding: "3px 6px",
                                    }}
                                  >
                                    <FaCheckCircle size={10} /> Xong
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleOpenQrModal(item)}
                                    style={compactButtonStyle}
                                  >
                                    Trả
                                  </button>
                                )}

                                <button
                                  onClick={() => handleComputePayroll(item)}
                                  title="Tính lương"
                                  style={{
                                    ...compactButtonStyle,
                                    background: "#17a2b8",
                                  }}
                                >
                                  Tính
                                </button>

                                <button
                                  onClick={() => handleSavePayroll(item)}
                                  title="Lưu"
                                  style={{
                                    ...compactButtonStyle,
                                    background: item.payrollSaved
                                      ? "#6c757d"
                                      : "#ffc107",
                                    color: item.payrollSaved ? "#fff" : "#111",
                                    opacity: item.payrollSaved ? 0.7 : 1,
                                    cursor: item.payrollSaved
                                      ? "default"
                                      : "pointer",
                                  }}
                                  disabled={item.payrollSaved}
                                >
                                  {item.payrollSaved ? "OK" : "Lưu"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <PaymentQrModal
        isOpen={isQrModalOpen}
        onClose={handleCloseQrModal}
        onConfirm={handleConfirmPayment}
        teacher={selectedTeacher}
      />
    </div>
  );
}

// Existing Desktop Styles
const responsiveThStyle = {
  padding: "10px 8px",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "14px",
  borderBottom: "2px solid #dee2e6",
};

const responsiveTdStyle = {
  padding: "8px",
  color: "#555",
  fontSize: "13px",
  verticalAlign: "middle",
};

const smallAvatarStyle = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  objectFit: "cover",
};

const compactStatusStyle = {
  padding: "2px 6px",
  borderRadius: "8px",
  fontSize: "10px",
  fontWeight: "600",
  whiteSpace: "nowrap",
};

const compactStatusPaidStyle = {
  ...compactStatusStyle,
  background: "#d4edda",
  color: "#155724",
};

const compactStatusPendingStyle = {
  ...compactStatusStyle,
  background: "#fff3cd",
  color: "#856404",
};

const compactButtonStyle = {
  background: "#007bff",
  color: "white",
  border: "none",
  padding: "3px 6px",
  borderRadius: "3px",
  cursor: "pointer",
  fontSize: "10px",
  whiteSpace: "nowrap",
  minWidth: "35px",
};

// Mobile Styles
const mobileCardStyle = {
  background: "#fff",
  borderRadius: "8px",
  border: "1px solid #e9ecef",
  overflow: "hidden",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
};

const mobileCardHeaderStyle = {
  padding: "12px 15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #f0f0f0",
};

const mobileAvatarStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#007bff",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: "bold",
};

const mobileStatusPaidStyle = {
  padding: "4px 8px",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: "600",
  background: "#d4edda",
  color: "#155724",
};

const mobileStatusPendingStyle = {
  padding: "4px 8px",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: "600",
  background: "#fff3cd",
  color: "#856404",
};

const mobileExpandButtonStyle = {
  background: "#f8f9fa",
  border: "1px solid #dee2e6",
  borderRadius: "4px",
  padding: "6px",
  cursor: "pointer",
  color: "#6c757d",
};

const mobileExpandedContentStyle = {
  padding: "15px",
  borderTop: "1px solid #f0f0f0",
  background: "#fafafa",
};

const mobileInputRowStyle = {
  display: "flex",
  gap: "15px",
  marginBottom: "15px",
};

const mobileInputGroupStyle = {
  flex: 1,
};

const mobileInputLabelStyle = {
  display: "block",
  marginBottom: "4px",
  fontSize: "12px",
  fontWeight: "500",
  color: "#495057",
};

const mobileInputStyle = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid #ddd",
  fontSize: "14px",
};

const mobilePayrollInfoStyle = {
  background: "#e3f2fd",
  padding: "10px",
  borderRadius: "6px",
  marginBottom: "15px",
  fontSize: "13px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const mobileActionRowStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const mobileButtonStyle = {
  flex: 1,
  minWidth: "80px",
  padding: "8px 12px",
  border: "none",
  borderRadius: "4px",
  color: "white",
  fontSize: "12px",
  fontWeight: "500",
  cursor: "pointer",
};
