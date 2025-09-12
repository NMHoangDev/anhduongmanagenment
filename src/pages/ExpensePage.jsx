import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaDollarSign,
  FaCalendarAlt,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  listExpenses,
  getExpenseById,
  computeAutoAmount,
} from "../services/expenseManagentService";
import * as facilitiesService from "../services/facilitiesService";
import * as teacherService from "../services/teacherService";
import {
  message,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Spin,
  Tooltip,
  Tag,
  Tabs,
} from "antd";
import moment from "moment";

const { TextArea } = Input;

// Expense type configurations
const EXPENSE_TYPES = [
  { value: "facility", label: "Cơ sở vật chất", color: "#1976d2" },
  { value: "salary", label: "Lương giáo viên", color: "#28a745" },
  { value: "utility", label: "Tiện ích (điện, nước)", color: "#ff9800" },
  { value: "material", label: "Nguyên vật liệu", color: "#9c27b0" },
  { value: "rent", label: "Tiền mặt bằng", color: "#f44336" },
  { value: "other", label: "Chi phí khác", color: "#607d8b" },
];

const styles = {
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "15px",
  },
  tableHeader: {
    background: "linear-gradient(90deg, #e3f0ff, #f8fbff)",
    color: "#1976d2",
    fontWeight: 600,
    padding: "14px 16px",
    textAlign: "left",
    borderBottom: "2px solid #e3eaf5",
  },
  tableRow: {
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#f5f9ff",
    },
  },
  tableCell: {
    padding: "12px 16px",
    borderBottom: "1px solid #edf2f7",
    color: "#333",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  },
  actionButton: {
    border: "none",
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  editButton: {
    backgroundColor: "#e6f7e6",
    color: "#28a745",
  },
  deleteButton: {
    backgroundColor: "#ffebeb",
    color: "#dc3545",
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
  },
  searchContainer: {
    position: "relative",
    flex: 1,
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#aaa",
  },
  searchInput: {
    width: "100%",
    padding: "10px 15px 10px 40px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
  },
  typeTag: {
    fontSize: "12px",
    fontWeight: "500",
  },
  amountCell: {
    fontWeight: "600",
    color: "#d32f2f",
  },
  dateCell: {
    fontSize: "13px",
    color: "#666",
  },
  autoComputeNote: {
    fontSize: "12px",
    color: "#1976d2",
    fontStyle: "italic",
    marginTop: "4px",
  },
};

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [autoAmount, setAutoAmount] = useState(null);
  const [computingAmount, setComputingAmount] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchFacilities();
    fetchTeachers();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await listExpenses({ limit: 500 });
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      message.error("Có lỗi xảy ra khi tải danh sách chi phí");
    }
    setLoading(false);
  };

  const fetchFacilities = async () => {
    try {
      const data = await facilitiesService.getAllFacilities();
      setFacilities(data);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await teacherService.getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesType = !selectedType || expense.type === selectedType;

    let matchesDateRange = true;
    if (dateRange[0] && dateRange[1]) {
      const expenseDate = expense.date?.toDate
        ? expense.date.toDate()
        : new Date(expense.date);
      const startDate = dateRange[0].toDate();
      const endDate = dateRange[1].toDate();
      matchesDateRange = expenseDate >= startDate && expenseDate <= endDate;
    }

    return matchesSearch && matchesType && matchesDateRange;
  });

  const handleAddExpense = () => {
    setEditingExpense(null);
    form.resetFields();
    setAutoAmount(null);
    setIsModalVisible(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    const formValues = {
      title: expense.title,
      type: expense.type,
      amount: expense.amount,
      date: expense.date?.toDate
        ? moment(expense.date.toDate())
        : moment(expense.date),
      facilityId: expense.facilityId,
      teacherId: expense.teacherId,
      month: expense.month,
      note: expense.note,
    };
    form.setFieldsValue(formValues);
    setAutoAmount(expense.source ? expense.amount : null);
    setIsModalVisible(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa khoản chi phí này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await deleteExpense(expenseId);
          message.success("Xóa chi phí thành công");
          fetchExpenses();
        } catch (error) {
          console.error("Error deleting expense:", error);
          message.error("Có lỗi xảy ra khi xóa chi phí");
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      const expenseData = {
        ...values,
        date: values.date.toDate(),
        amount: autoAmount !== null ? autoAmount : values.amount,
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
        message.success("Cập nhật chi phí thành công");
      } else {
        await createExpense(expenseData);
        message.success("Thêm chi phí mới thành công");
      }
      setIsModalVisible(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      message.error("Có lỗi xảy ra khi lưu thông tin chi phí");
    }
  };

  // Handle auto-compute amount when type/facility/teacher changes
  const handleFormValuesChange = async (changedValues, allValues) => {
    if (
      changedValues.type === "facility" ||
      changedValues.type === "salary" ||
      changedValues.facilityId ||
      changedValues.teacherId ||
      changedValues.month
    ) {
      if (allValues.type === "facility" && allValues.facilityId) {
        setComputingAmount(true);
        try {
          const { amount } = await computeAutoAmount({
            type: "facility",
            facilityId: allValues.facilityId,
          });
          setAutoAmount(amount);
        } catch (error) {
          console.error("Error computing facility amount:", error);
          setAutoAmount(null);
        }
        setComputingAmount(false);
      } else if (
        allValues.type === "salary" &&
        allValues.teacherId &&
        allValues.month
      ) {
        setComputingAmount(true);
        try {
          const { amount } = await computeAutoAmount({
            type: "salary",
            teacherId: allValues.teacherId,
            month: allValues.month,
          });
          setAutoAmount(amount);
        } catch (error) {
          console.error("Error computing salary amount:", error);
          setAutoAmount(null);
        }
        setComputingAmount(false);
      } else {
        setAutoAmount(null);
      }
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getTypeConfig = (type) => {
    return EXPENSE_TYPES.find((t) => t.value === type) || EXPENSE_TYPES[5];
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = date?.toDate ? date.toDate() : new Date(date);
    return moment(d).format("DD/MM/YYYY");
  };

  // Calculate total amount
  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f6f6fa" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <Header title="Quản lý Chi phí" />
        <main style={{ padding: "20px 40px 40px 40px" }}>
          {/* Header section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ color: "#333", fontSize: "24px", margin: 0 }}>
                Quản lý Chi phí ({filteredExpenses.length})
              </h2>
              <div
                style={{ marginTop: "8px", color: "#666", fontSize: "16px" }}
              >
                <strong>Tổng: {formatCurrency(totalAmount)}</strong>
              </div>
            </div>
            <button onClick={handleAddExpense} style={styles.addButton}>
              <FaPlus /> Thêm chi phí
            </button>
          </div>

          {/* Search and filter section */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={styles.searchContainer}>
              <FaSearch style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên chi phí..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <Select
              placeholder="Lọc theo loại chi phí"
              allowClear
              style={{ width: 200, height: "40px" }}
              onChange={setSelectedType}
            >
              {EXPENSE_TYPES.map((type) => (
                <Select.Option key={type.value} value={type.value}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaDollarSign style={{ color: type.color }} /> {type.label}
                  </div>
                </Select.Option>
              ))}
            </Select>

            <DatePicker.RangePicker
              placeholder={["Từ ngày", "Đến ngày"]}
              style={{ height: "40px" }}
              onChange={(dates) => setDateRange(dates)}
              format="DD/MM/YYYY"
            />
          </div>

          {/* Expenses table */}
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "50px",
              }}
            >
              <Spin size="large" />
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.tableHeader, width: "50px" }}>#</th>
                    <th style={styles.tableHeader}>Tên chi phí</th>
                    <th style={styles.tableHeader}>Loại</th>
                    <th style={styles.tableHeader}>Số tiền</th>
                    <th style={styles.tableHeader}>Ngày</th>
                    <th style={styles.tableHeader}>Ghi chú</th>
                    <th style={{ ...styles.tableHeader, width: "120px" }}>
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        Không tìm thấy chi phí nào.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((expense, index) => {
                      const typeConfig = getTypeConfig(expense.type);
                      return (
                        <tr key={expense.id} style={styles.tableRow}>
                          <td
                            style={{ ...styles.tableCell, textAlign: "center" }}
                          >
                            {index + 1}
                          </td>
                          <td style={styles.tableCell}>
                            <div style={{ fontWeight: "500" }}>
                              {expense.title}
                            </div>
                            {expense.source && (
                              <div style={styles.autoComputeNote}>
                                Tự động từ:{" "}
                                {expense.source.name || expense.source.id}
                              </div>
                            )}
                          </td>
                          <td style={styles.tableCell}>
                            <Tag
                              color={typeConfig.color}
                              style={styles.typeTag}
                            >
                              {typeConfig.label}
                            </Tag>
                          </td>
                          <td
                            style={{
                              ...styles.tableCell,
                              ...styles.amountCell,
                            }}
                          >
                            {formatCurrency(expense.amount)}
                          </td>
                          <td
                            style={{ ...styles.tableCell, ...styles.dateCell }}
                          >
                            {formatDate(expense.date)}
                          </td>
                          <td style={styles.tableCell}>
                            <div
                              style={{
                                maxWidth: "200px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {expense.note || "-"}
                            </div>
                          </td>
                          <td
                            style={{ ...styles.tableCell, textAlign: "center" }}
                          >
                            <div style={styles.actionButtons}>
                              <Tooltip title="Chỉnh sửa">
                                <button
                                  onClick={() => handleEditExpense(expense)}
                                  style={{
                                    ...styles.actionButton,
                                    ...styles.editButton,
                                  }}
                                >
                                  <FaEdit />
                                </button>
                              </Tooltip>
                              <Tooltip title="Xóa">
                                <button
                                  onClick={() =>
                                    handleDeleteExpense(expense.id)
                                  }
                                  style={{
                                    ...styles.actionButton,
                                    ...styles.deleteButton,
                                  }}
                                >
                                  <FaTrash />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Modal Form */}
        <Modal
          title={editingExpense ? "Cập nhật chi phí" : "Thêm chi phí mới"}
          open={isModalVisible}
          onOk={handleModalSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText={editingExpense ? "Cập nhật" : "Thêm mới"}
          cancelText="Hủy"
          maskClosable={false}
          width={700}
        >
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormValuesChange}
          >
            <div style={{ display: "flex", gap: "16px" }}>
              <Form.Item
                name="title"
                label="Tên chi phí"
                rules={[
                  { required: true, message: "Vui lòng nhập tên chi phí" },
                ]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Nhập tên chi phí" />
              </Form.Item>

              <Form.Item
                name="type"
                label="Loại chi phí"
                rules={[
                  { required: true, message: "Vui lòng chọn loại chi phí" },
                ]}
                style={{ width: "200px" }}
              >
                <Select placeholder="Chọn loại">
                  {EXPENSE_TYPES.map((type) => (
                    <Select.Option key={type.value} value={type.value}>
                      {type.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <Form.Item
                name="date"
                label="Ngày phát sinh"
                rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
                style={{ flex: 1 }}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                />
              </Form.Item>

              <Form.Item name="amount" label="Số tiền" style={{ flex: 1 }}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Nhập số tiền"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  disabled={autoAmount !== null}
                />
              </Form.Item>
            </div>

            {/* Auto-computed amount display */}
            {autoAmount !== null && (
              <div
                style={{
                  background: "#e3f0ff",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "16px",
                  border: "1px solid #1976d2",
                }}
              >
                <div style={{ color: "#1976d2", fontWeight: "500" }}>
                  {computingAmount
                    ? "Đang tính toán..."
                    : `Số tiền tự động: ${formatCurrency(autoAmount)}`}
                </div>
              </div>
            )}

            {/* Conditional fields based on type */}
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.type !== currentValues.type
              }
            >
              {({ getFieldValue }) => {
                const type = getFieldValue("type");

                if (type === "facility") {
                  return (
                    <Form.Item
                      name="facilityId"
                      label="Chọn cơ sở vật chất"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn cơ sở vật chất",
                        },
                      ]}
                    >
                      <Select
                        placeholder="Chọn cơ sở vật chất"
                        showSearch
                        optionFilterProp="children"
                      >
                        {facilities.map((facility) => (
                          <Select.Option key={facility.id} value={facility.id}>
                            {facility.name} ({facility.code}) -{" "}
                            {formatCurrency(facility.cost)}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  );
                }

                if (type === "salary") {
                  return (
                    <div style={{ display: "flex", gap: "16px" }}>
                      <Form.Item
                        name="teacherId"
                        label="Chọn giáo viên"
                        rules={[
                          {
                            required: true,
                            message: "Vui lòng chọn giáo viên",
                          },
                        ]}
                        style={{ flex: 1 }}
                      >
                        <Select
                          placeholder="Chọn giáo viên"
                          showSearch
                          optionFilterProp="children"
                        >
                          {teachers.map((teacher) => (
                            <Select.Option key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.email})
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        name="month"
                        label="Tháng lương"
                        rules={[
                          { required: true, message: "Vui lòng nhập tháng" },
                        ]}
                        style={{ width: "150px" }}
                      >
                        <Input placeholder="YYYY-MM" />
                      </Form.Item>
                    </div>
                  );
                }

                return null;
              }}
            </Form.Item>

            <Form.Item name="note" label="Ghi chú">
              <TextArea rows={3} placeholder="Ghi chú thêm (tùy chọn)" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
