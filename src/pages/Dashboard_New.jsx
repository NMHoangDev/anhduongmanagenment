import React from "react";
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

// Dữ liệu mẫu
const summary = {
  students: 320,
  teachers: 25,
  revenue: 120000000,
  expense: 90000000,
  activeClasses: 18,
};

const revenueExpenseData = [
  { month: "T1", revenue: 100, expense: 70 },
  { month: "T2", revenue: 120, expense: 75 },
  { month: "T3", revenue: 110, expense: 90 },
  { month: "T4", revenue: 130, expense: 80 },
  { month: "T5", revenue: 140, expense: 100 },
  { month: "T6", revenue: 120, expense: 95 },
];

const studentByGrade = [
  { name: "Khối 1", value: 40 },
  { name: "Khối 2", value: 38 },
  { name: "Khối 3", value: 35 },
  { name: "Khối 4", value: 42 },
  { name: "Khối 5", value: 38 },
];

const studentStatus = [
  { name: "Đang học", value: 300 },
  { name: "Đã nghỉ", value: 10 },
  { name: "Nợ học phí", value: 10 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#e83e8c"];

function formatMoney(n) {
  return n.toLocaleString("vi-VN") + " ₫";
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
          value="120.000.000 ₫"
          color="#06b6d4"
        />
        <SummaryCard
          icon={<FaFileInvoiceDollar size={32} />}
          label="Chi phí tháng này"
          value="90.000.000 ₫"
          color="#ef4444"
        />
        <SummaryCard
          icon={<FaSchool size={32} />}
          label="Lớp đang hoạt động"
          value={summary.activeClasses}
          color="#f59e0b"
        />
      </div>

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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis unit="tr" />
              <Tooltip />
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
      </div>
    </div>
  );
}
