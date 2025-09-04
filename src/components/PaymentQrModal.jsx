import React from "react";
import { FaTimes, FaCheckCircle } from "react-icons/fa";

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "30px",
  maxWidth: "400px",
  width: "90%",
  textAlign: "center",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "18px",
  cursor: "pointer",
  color: "#666",
};

// Simple QR Code placeholder component
const SimpleQRCode = ({ value, size = 200 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: "#f8f9fa",
        border: "2px dashed #dee2e6",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: "48px",
          marginBottom: "10px",
          color: "#6c757d",
        }}
      >
        📱
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "#6c757d",
          textAlign: "center",
          lineHeight: "1.4",
        }}
      >
        QR Code
        <br />
        <small style={{ fontSize: "12px" }}>Quét để thanh toán</small>
      </div>
    </div>
  );
};

const PaymentQrModal = ({ isOpen, onClose, onConfirm, teacher }) => {
  if (!isOpen || !teacher) return null;

  // Safely get salary value with fallback
  const getSalaryAmount = () => {
    if (teacher.payroll && teacher.payroll.salary) {
      return teacher.payroll.salary;
    }
    // Fallback to base salary if payroll not calculated yet
    return teacher.baseSalaryInput || 8000000;
  };

  const salaryAmount = getSalaryAmount();
  const qrData = `Thanh toán lương cho ${
    teacher.name
  }: ${salaryAmount.toLocaleString()} VNĐ`;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ margin: 0, color: "#333" }}>Thanh toán lương</h3>
          <button onClick={onClose} style={closeButtonStyle}>
            <FaTimes />
          </button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#555" }}>
            {teacher.name}
          </h4>
          <p
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#007bff",
            }}
          >
            {salaryAmount.toLocaleString()} VNĐ
          </p>

          {/* Show calculation details if payroll exists */}
          {teacher.payroll && (
            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "20px",
                textAlign: "left",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <strong>Chi tiết tính lương:</strong>
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                <div>
                  Lương cơ bản: {teacher.baseSalaryInput?.toLocaleString()} VNĐ
                </div>
                <div>
                  Buổi thực tế: {teacher.payroll.actualSessions}/
                  {teacher.totalSessionsInput}
                </div>
                <div>Tỷ lệ: {Math.round(teacher.payroll.rate * 100)}%</div>
                <div
                  style={{
                    marginTop: "8px",
                    fontWeight: "bold",
                    color: "#007bff",
                  }}
                >
                  Lương thực nhận: {teacher.payroll.salary.toLocaleString()} VNĐ
                </div>
              </div>
            </div>
          )}

          {/* Show warning if payroll not calculated */}
          {!teacher.payroll && (
            <div
              style={{
                backgroundColor: "#fff3cd",
                color: "#856404",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              ⚠️ Chưa tính lương chính xác. Đang sử dụng lương cơ bản.
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "20px",
            }}
          >
            <SimpleQRCode value={qrData} size={200} />
          </div>

          {/* Payment info */}
          <div
            style={{
              backgroundColor: "#e3f2fd",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: "8px",
                color: "#1565c0",
              }}
            >
              Thông tin chuyển khoản:
            </div>
            <div style={{ color: "#424242", lineHeight: "1.6" }}>
              <div>
                <strong>Số tài khoản:</strong> 1234567890
              </div>
              <div>
                <strong>Ngân hàng:</strong> Vietcombank
              </div>
              <div>
                <strong>Chủ tài khoản:</strong> {teacher.name}
              </div>
              <div>
                <strong>Số tiền:</strong> {salaryAmount.toLocaleString()} VNĐ
              </div>
              <div>
                <strong>Nội dung:</strong> Luong thang{" "}
                {new Date().getMonth() + 1}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              border: "1px solid #ddd",
              backgroundColor: "white",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(teacher.id)}
            style={{
              padding: "10px 20px",
              border: "none",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <FaCheckCircle /> Xác nhận đã thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentQrModal;
