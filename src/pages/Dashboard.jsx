import React, { useState, useEffect } from "react";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaSchool,
  FaDownload,
  FaEllipsisH,
  FaTrendingUp,
  FaTrendingDown,
  FaCalendarAlt,
  FaFilter,
  FaSync,
  FaExpand,
  FaBell,
  FaChevronRight,
  FaPlay,
  FaPause,
  FaExternalLinkAlt,
  FaArrowUp,
  FaArrowDown,
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
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import {
  Spin,
  message,
  Avatar,
  Progress,
  Select,
  DatePicker,
  Badge,
} from "antd";
import {
  getDashboardSummary,
  getRevenueExpenseChart,
  getStudentsByGrade,
  getStudentsByStatus,
} from "../services/adminServices/dashboardService";

const { Option } = Select;
const { RangePicker } = DatePicker;

const COLORS = ["#8B5CF6", "#06B6D4", "#F59E0B", "#EF4444", "#10B981"];

function formatMoney(amount) {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

// Enhanced Summary Card Component with Animation
function SummaryCard({
  icon,
  label,
  value,
  color,
  trend,
  percentage,
  isLoading = false,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: isHovered
          ? "0 20px 40px rgba(0,0,0,0.15)"
          : "0 8px 25px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transform: isHovered ? "translateY(-8px)" : "translateY(0)",
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Background Gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
          borderRadius: "20px 20px 0 0",
        }}
      />

      {/* Floating Background Decoration */}
      <div
        style={{
          position: "absolute",
          top: "-60%",
          right: "-30%",
          width: "150px",
          height: "150px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${color}15, ${color}08)`,
          opacity: isHovered ? 0.8 : 0.5,
          transition: "all 0.3s ease",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: `linear-gradient(135deg, ${color}, ${color}dd)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "24px",
              boxShadow: `0 8px 20px ${color}40`,
              transform: isHovered ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.3s ease",
            }}
          >
            {icon}
          </div>

          {trend && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: trend === "up" ? "#dcfce7" : "#fef2f2",
                color: trend === "up" ? "#16a34a" : "#dc2626",
                fontSize: "13px",
                fontWeight: "600",
                padding: "6px 12px",
                borderRadius: "20px",
                border: `1px solid ${trend === "up" ? "#bbf7d0" : "#fecaca"}`,
              }}
            >
              {trend === "up" ? (
                <FaArrowUp size={10} />
              ) : (
                <FaArrowDown size={10} />
              )}
              {percentage}%
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: "32px",
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: "8px",
            lineHeight: "1.1",
            background: `linear-gradient(135deg, #0f172a, ${color})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {isLoading ? "---" : value}
        </div>

        <div
          style={{
            color: "#64748b",
            fontSize: "15px",
            fontWeight: "500",
            letterSpacing: "0.3px",
          }}
        >
          {label}
        </div>

        {/* Progress Bar */}
        <div
          style={{
            marginTop: "16px",
            background: "#f1f5f9",
            height: "6px",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${color}, ${color}80)`,
              width: isHovered ? "85%" : "70%",
              transition: "width 0.8s ease",
              borderRadius: "3px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Enhanced Chart Container with Actions
function ChartContainer({
  title,
  subtitle,
  children,
  actions = null,
  isFullscreen = false,
}) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
        position: "relative",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#0f172a",
              margin: "0 0 4px 0",
              letterSpacing: "-0.025em",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {actions}
          </div>
        )}
      </div>

      {/* Content with Loading State */}
      <div style={{ position: "relative" }}>
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <Spin size="large" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Action Button Component
function ActionButton({ icon, onClick, variant = "default", size = "medium" }) {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    default: {
      background: "#f8fafc",
      color: "#64748b",
      border: "1px solid #e2e8f0",
    },
    primary: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "#ffffff",
      border: "none",
    },
    success: {
      background: "#dcfce7",
      color: "#16a34a",
      border: "1px solid #bbf7d0",
    },
  };

  const sizes = {
    small: { padding: "8px", fontSize: "12px" },
    medium: { padding: "10px", fontSize: "14px" },
    large: { padding: "12px", fontSize: "16px" },
  };

  return (
    <button
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: "12px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        transform: isHovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: isHovered
          ? "0 4px 12px rgba(0,0,0,0.15)"
          : "0 2px 4px rgba(0,0,0,0.05)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

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
  }, [selectedPeriod, dateRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
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

  const handleExport = () => {
    message.success("Đang xuất báo cáo...");
  };

  const handleRefresh = () => {
    message.info("Đang làm mới dữ liệu...");
    fetchDashboardData();
  };

  if (loading && !summary.students) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px", color: "#64748b" }}>
            Đang tải dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "32px",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        minHeight: "100vh",
        paddingLeft: "2rem",
        marginLeft: "2rem",
      }}
    >
      {/* Enhanced Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1, minWidth: "300px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <h1
              style={{
                fontSize: "36px",
                fontWeight: "800",
                color: "#0f172a",
                margin: 0,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
              }}
            >
              Dashboard
            </h1>
            <Badge count={5} style={{ backgroundColor: "#ff4d4f" }}>
              <FaBell style={{ fontSize: "20px", color: "#64748b" }} />
            </Badge>
          </div>

          <p
            style={{
              color: "#64748b",
              fontSize: "16px",
              margin: "0 0 16px 0",
              lineHeight: "1.5",
            }}
          >
            Chào mừng trở lại! Đây là tổng quan hệ thống quản lý trường học Ánh
            Dương
          </p>

          {/* Quick Stats */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              fontSize: "14px",
              color: "#64748b",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
              Hệ thống hoạt động bình thường
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FaCalendarAlt />
              Cập nhật lần cuối: {new Date().toLocaleString("vi-VN")}
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            style={{ width: 140 }}
            size="large"
          >
            <Option value="today">Hôm nay</Option>
            <Option value="thisWeek">Tuần này</Option>
            <Option value="thisMonth">Tháng này</Option>
            <Option value="thisYear">Năm này</Option>
          </Select>

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            size="large"
            style={{ borderRadius: "12px" }}
          />

          <ActionButton
            icon={autoRefresh ? <FaPause /> : <FaPlay />}
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "success" : "default"}
          />

          <ActionButton icon={<FaSync />} onClick={handleRefresh} />

          <ActionButton
            icon={<FaDownload />}
            onClick={handleExport}
            variant="primary"
          />
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        <SummaryCard
          icon={<FaUserGraduate />}
          label="Tổng số học sinh"
          value={formatNumber(summary.students || 0)}
          color="#8B5CF6"
          trend="up"
          percentage="12"
          isLoading={loading}
        />
        <SummaryCard
          icon={<FaChalkboardTeacher />}
          label="Tổng số giáo viên"
          value={formatNumber(summary.teachers || 0)}
          color="#06B6D4"
          trend="up"
          percentage="8"
          isLoading={loading}
        />
        <SummaryCard
          icon={<FaMoneyBillWave />}
          label="Doanh thu tháng này"
          value={formatMoney(summary.revenue)}
          color="#10B981"
          trend="up"
          percentage="23"
          isLoading={loading}
        />
        <SummaryCard
          icon={<FaFileInvoiceDollar />}
          label="Chi phí tháng này"
          value={formatMoney(summary.expense)}
          color="#EF4444"
          trend="down"
          percentage="5"
          isLoading={loading}
        />
        <SummaryCard
          icon={<FaSchool />}
          label="Lớp đang hoạt động"
          value={formatNumber(summary.activeClasses || 0)}
          color="#F59E0B"
          trend="up"
          percentage="15"
          isLoading={loading}
        />
      </div>

      {/* Enhanced Main Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Enhanced Revenue Chart */}
        <ChartContainer
          title="Phân tích Doanh thu & Chi phí"
          subtitle="Theo dõi xu hướng tài chính theo thời gian"
          actions={[
            <ActionButton key="filter" icon={<FaFilter />} />,
            <ActionButton key="expand" icon={<FaExpand />} />,
            <ActionButton key="options" icon={<FaEllipsisH />} />,
          ]}
        >
          {revenueExpenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={revenueExpenseData}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient
                    id="expenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    padding: "16px",
                  }}
                  formatter={(value, name) => [
                    `${formatMoney(value * 1000000)}`,
                    name === "revenue" ? "Doanh thu" : "Chi phí",
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#revenueGradient)"
                  name="Doanh thu"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                  name="Chi phí"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "380px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "2px dashed #e2e8f0",
              }}
            >
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>📊</div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Chưa có dữ liệu biểu đồ
              </div>
              <div style={{ fontSize: "14px" }}>
                Dữ liệu sẽ được hiển thị khi có giao dịch
              </div>
            </div>
          )}
        </ChartContainer>

        {/* Enhanced Students by Grade */}
        <ChartContainer
          title="Phân bố Học sinh"
          subtitle="Theo khối lớp"
          actions={[<ActionButton key="options" icon={<FaEllipsisH />} />]}
        >
          {studentByGrade.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={studentByGrade}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={130}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {studentByGrade.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginTop: "16px",
                }}
              >
                {studentByGrade.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: `${COLORS[index % COLORS.length]}10`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: COLORS[index % COLORS.length],
                        }}
                      />
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {item.name}
                      </span>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                height: "380px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "2px dashed #e2e8f0",
              }}
            >
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>👥</div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Chưa có dữ liệu học sinh
              </div>
              <div style={{ fontSize: "14px" }}>
                Thêm học sinh để xem phân bố theo khối
              </div>
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Enhanced Bottom Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* Enhanced Student Status */}
        <ChartContainer
          title="Tình trạng Học sinh"
          subtitle={`Cập nhật tháng ${new Date().getMonth() + 1}/2024`}
          actions={[
            <ActionButton key="view-all" icon={<FaExternalLinkAlt />} />,
          ]}
        >
          {studentStatus.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {studentStatus.map((status, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px",
                    borderRadius: "16px",
                    background: `linear-gradient(135deg, ${COLORS[index]}08, ${COLORS[index]}04)`,
                    border: `1px solid ${COLORS[index]}20`,
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateX(4px)";
                    e.currentTarget.style.boxShadow = `0 4px 20px ${COLORS[index]}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: COLORS[index],
                        boxShadow: `0 0 0 4px ${COLORS[index]}20`,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          color: "#374151",
                          fontWeight: "600",
                          marginBottom: "4px",
                        }}
                      >
                        {status.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        {Math.round((status.value / summary.students) * 100)}%
                        tổng số
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "700",
                          color: "#1f2937",
                          textAlign: "right",
                        }}
                      >
                        {status.value}
                      </div>
                      <div style={{ width: "80px", marginTop: "8px" }}>
                        <Progress
                          percent={Math.round(
                            (status.value / summary.students) * 100
                          )}
                          size="small"
                          strokeColor={COLORS[index]}
                          showInfo={false}
                          strokeWidth={6}
                        />
                      </div>
                    </div>
                    <FaChevronRight
                      style={{ color: "#9ca3af", fontSize: "12px" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#94a3b8",
                padding: "60px 20px",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "2px dashed #e2e8f0",
              }}
            >
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>📈</div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Chưa có dữ liệu trạng thái
              </div>
              <div style={{ fontSize: "14px" }}>
                Dữ liệu sẽ hiển thị khi có học sinh đăng ký
              </div>
            </div>
          )}
        </ChartContainer>

        {/* Enhanced Recent Activities */}
        <ChartContainer
          title="Hoạt động Gần đây"
          subtitle="Cập nhật realtime"
          actions={[
            <div
              key="live"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "#10b981",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10b981",
                  animation: "pulse 2s infinite",
                }}
              />
              LIVE
            </div>,
          ]}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {/* Enhanced Activity Items */}
            {[
              {
                icon: <FaUserGraduate />,
                title: "15 học sinh mới đăng ký",
                subtitle: "Khóa học Toán lớp 5",
                time: "2 phút trước",
                color: "#8B5CF6",
                value: "+15",
                type: "success",
              },
              {
                icon: <FaChalkboardTeacher />,
                title: "3 giáo viên hoàn thành đào tạo",
                subtitle: "Chương trình nâng cao",
                time: "1 giờ trước",
                color: "#06B6D4",
                value: "+3",
                type: "success",
              },
              {
                icon: <FaMoneyBillWave />,
                title: "Thanh toán học phí thành công",
                subtitle: "Tổng: 25.000.000 VNĐ",
                time: "3 giờ trước",
                color: "#10B981",
                value: formatMoney(25000000),
                type: "revenue",
              },
              {
                icon: <FaSchool />,
                title: "2 lớp học mới được mở",
                subtitle: "Môn Tiếng Anh & Văn",
                time: "1 ngày trước",
                color: "#F59E0B",
                value: "+2",
                type: "success",
              },
              {
                icon: <FaBell />,
                title: "Thông báo bảo trì hệ thống",
                subtitle: "Dự kiến 2h sáng mai",
                time: "2 ngày trước",
                color: "#EF4444",
                value: "!",
                type: "warning",
              },
            ].map((activity, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  borderRadius: "12px",
                  background: `${activity.color}05`,
                  border: `1px solid ${activity.color}15`,
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${activity.color}10`;
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${activity.color}05`;
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flex: 1,
                  }}
                >
                  <Avatar
                    style={{
                      backgroundColor: activity.color,
                      boxShadow: `0 4px 12px ${activity.color}40`,
                    }}
                    icon={activity.icon}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: "2px",
                      }}
                    >
                      {activity.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "4px",
                      }}
                    >
                      {activity.subtitle}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <FaCalendarAlt />
                      {activity.time}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background:
                      activity.type === "success"
                        ? "#dcfce7"
                        : activity.type === "revenue"
                        ? "#d1fae5"
                        : "#fef3cd",
                    color:
                      activity.type === "success"
                        ? "#16a34a"
                        : activity.type === "revenue"
                        ? "#059669"
                        : "#d97706",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {activity.value}
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
