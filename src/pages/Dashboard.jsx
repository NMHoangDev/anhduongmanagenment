import React, { useState, useEffect } from "react";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaSchool,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { Spin, message } from "antd";
import {
  getDashboardSummary,
  getRevenueExpenseChart,
  getStudentsByGrade,
  getStudentsByStatus,
} from "../services/expenseManagentService";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#e83e8c"];

function formatMoney(amount) {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Component SummaryCard
function SummaryCard({ icon, label, value, color, bgColor }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: `3px solid ${color}`,
        textAlign: "center",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
      }}
    >
      <div style={{ marginBottom: "16px", color: color }}>{icon}</div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: "700",
          color: color,
          marginBottom: "8px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: "500",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    students: 0,
    teachers: 0,
    revenue: 0,
    expense: 0,
    activeClasses: 0,
    profit: 0,
  });
  const [revenueExpenseData, setRevenueExpenseData] = useState([]);
  const [studentByGrade, setStudentByGrade] = useState([]);
  const [studentStatus, setStudentStatus] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [summaryData, chartData, gradeData, statusData] = await Promise.all(
        [
          getDashboardSummary(),
          getRevenueExpenseChart(),
          getStudentsByGrade(),
          getStudentsByStatus(),
        ]
      );

      setSummary(summaryData);
      setRevenueExpenseData(chartData);
      setStudentByGrade(gradeData);
      setStudentStatus(statusData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      message.error("Có lỗi xảy ra khi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f8fafc",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#1e293b",
            margin: "0 0 8px 0",
          }}
        >
          🎓 Dashboard Trường Học
        </h1>
        <p style={{ color: "#64748b", fontSize: "16px", margin: 0 }}>
          Thống kê nhanh các chỉ số quan trọng
        </p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "32px",
        }}
      >
        <SummaryCard
          icon={<FaUserGraduate size={32} />}
          label="Số học sinh"
          value={summary.students}
          color="#3b82f6"
        />
        <SummaryCard
          icon={<FaChalkboardTeacher size={32} />}
          label="Số giáo viên"
          value={summary.teachers}
          color="#10b981"
        />
        <SummaryCard
          icon={<FaMoneyBillWave size={32} />}
          label="Doanh thu tháng này"
          value={formatMoney(summary.revenue)}
          color="#06b6d4"
        />
        <SummaryCard
          icon={<FaFileInvoiceDollar size={32} />}
          label="Chi phí tháng này"
          value={formatMoney(summary.expense)}
          color="#ef4444"
        />
        <SummaryCard
          icon={<FaSchool size={32} />}
          label="Lớp đang hoạt động"
          value={summary.activeClasses}
          color="#f59e0b"
        />
      </div>

      {/* Profit Summary */}
      {summary.profit !== 0 && (
        <div
          style={{
            background: summary.profit > 0 ? "#dcfce7" : "#fee2e2",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "32px",
            textAlign: "center",
            border: `2px solid ${summary.profit > 0 ? "#16a34a" : "#dc2626"}`,
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: summary.profit > 0 ? "#16a34a" : "#dc2626",
              margin: "0 0 8px 0",
            }}
          >
            {summary.profit > 0 ? "📈 Lợi nhuận tháng này" : "📉 Lỗ tháng này"}
          </h3>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: summary.profit > 0 ? "#16a34a" : "#dc2626",
            }}
          >
            {formatMoney(Math.abs(summary.profit))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Revenue Chart */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#1e293b",
              marginBottom: "20px",
            }}
          >
            📈 Doanh thu & Chi phí theo tháng
          </h3>
          {revenueExpenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueExpenseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis unit="tr" />
                <Tooltip
                  formatter={(value, name) => [
                    `${value} triệu đồng`,
                    name === "revenue" ? "Doanh thu" : "Chi phí",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#06b6d4"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Chi phí"
                  stroke="#ef4444"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
              }}
            >
              Chưa có dữ liệu biểu đồ
            </div>
          )}
        </div>

        {/* Students by Grade */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1e293b",
              marginBottom: "20px",
            }}
          >
            👥 Học sinh theo khối
          </h3>
          {studentByGrade.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={studentByGrade}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {studentByGrade.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
              }}
            >
              Chưa có dữ liệu học sinh
            </div>
          )}
        </div>
      </div>

      {/* Student Status */}
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: "600",
            color: "#1e293b",
            marginBottom: "20px",
          }}
        >
          📊 Tình trạng học sinh
        </h3>
        {studentStatus.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {studentStatus.map((status, index) => (
              <div
                key={index}
                style={{
                  padding: "20px",
                  borderRadius: "8px",
                  backgroundColor: COLORS[index],
                  color: "#fff",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    marginBottom: "8px",
                  }}
                >
                  {status.value}
                </div>
                <div style={{ fontSize: "14px", opacity: 0.9 }}>
                  {status.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "#666",
              padding: "20px",
            }}
          >
            Chưa có dữ liệu trạng thái học sinh
          </div>
        )}
      </div>
    </div>
  );
}
