import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit as fbLimit,
  startOfMonth,
  endOfMonth,
} from "firebase/firestore";
import { db } from "./firebase";
import * as facilitiesService from "./facilitiesService";
import * as teacherSalaryService from "./teacherSalaryService";

/**
 * Expense document shape (recommended fields)
 * {
 *   title: string,                // tên chi phí
 *   type: string,                 // example: "facility", "salary", "utility", "material", "other"
 *   amount: number|null,          // nếu auto tính thì đây sẽ được set tự động
 *   currency: "VND",              // optional
 *   date: Timestamp,              // khi phát sinh chi phí
 *   facilityId: string|null,      // nếu type === "facility"
 *   teacherId: string|null,       // nếu type === "salary"
 *   month: "YYYY-MM"|null,        // nếu type === "salary" (tháng payroll)
 *   source: object|null,          // meta: facility doc snapshot or payroll snapshot
 *   note: string|null,
 *   createdAt, updatedAt, createdBy...
 * }
 */

/** helpers */
const expensesCol = collection(db, "expenses");

const normalizeExpense = (raw = {}) => ({
  title: raw.title || "",
  type: raw.type || "other",
  amount:
    typeof raw.amount !== "undefined" && raw.amount !== null
      ? Number(raw.amount)
      : null,
  currency: raw.currency || "VND",
  date: raw.date || Timestamp.fromDate(new Date()),
  facilityId: raw.facilityId || null,
  teacherId: raw.teacherId || null,
  month: raw.month || null,
  source: raw.source || null,
  note: raw.note || "",
  createdAt: raw.createdAt || null,
  updatedAt: raw.updatedAt || null,
});

/**
 * Compute auto amount for special types
 * - facility: takes facility.cost (or facility.quantity * cost) if facilityId provided
 * - salary: fetch payroll by teacherId+month and take payroll.paidAmount || payroll.salary
 * Returns { amount, source } where source is minimal metadata
 */
export const computeAutoAmount = async (expense) => {
  if (!expense || !expense.type) return { amount: null, source: null };

  if (expense.type === "facility") {
    if (!expense.facilityId) return { amount: null, source: null };
    const f = await facilitiesService.getFacilityById(expense.facilityId);
    if (!f) return { amount: null, source: null };
    // prefer stored cost * quantity if present
    const qty = f.quantity != null ? Number(f.quantity) : 1;
    const cost = f.cost != null ? Number(f.cost) : 0;
    const amount = Math.round(qty * cost);
    const source = {
      id: f.id,
      name: f.name,
      code: f.code,
      cost,
      quantity: qty,
    };
    return { amount, source };
  }

  if (expense.type === "salary") {
    const { teacherId, month } = expense;
    if (!teacherId || !month) return { amount: null, source: null };
    const payroll = await teacherSalaryService.getMonthlyPayroll({
      teacherId,
      month,
    });
    if (!payroll) return { amount: null, source: null };
    const amount =
      typeof payroll.paidAmount !== "undefined" && payroll.paidAmount !== null
        ? Number(payroll.paidAmount)
        : Number(payroll.salary || 0);
    const source = {
      id: payroll.id || `${teacherId}_${month}`,
      teacherId,
      month,
      salary: payroll.salary,
      paidAmount: payroll.paidAmount ?? null,
    };
    return { amount, source };
  }

  // other types => no auto compute
  return { amount: null, source: null };
};

/**
 * Create expense
 * - If type is facility or salary and required refs provided, compute amount automatically and attach source metadata
 */
export const createExpense = async (raw) => {
  const payload = normalizeExpense(raw);
  try {
    // auto-compute when appropriate and no explicit amount provided
    if (
      (payload.type === "facility" || payload.type === "salary") &&
      (payload.amount == null || payload.amount === 0)
    ) {
      const { amount, source } = await computeAutoAmount(payload);
      if (amount != null) {
        payload.amount = amount;
        payload.source = source;
      }
    }

    payload.createdAt = serverTimestamp();
    payload.updatedAt = serverTimestamp();

    const added = await addDoc(expensesCol, payload);
    return { id: added.id, ...payload };
  } catch (err) {
    console.error("createExpense error:", err);
    throw err;
  }
};

/** Get expense by id */
export const getExpenseById = async (id) => {
  if (!id) return null;
  const snap = await getDoc(doc(db, "expenses", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * Update expense (partial)
 * - If changing type/facilityId/teacherId/month and amount is left null => recompute
 */
export const updateExpense = async (id, updates = {}) => {
  if (!id) throw new Error("Missing expense id");
  const ref = doc(db, "expenses", id);

  // fetch current
  const curSnap = await getDoc(ref);
  if (!curSnap.exists()) throw new Error("Expense not found");
  const cur = curSnap.data();

  const merged = { ...cur, ...updates };

  // Normalize merged
  const normalized = normalizeExpense(merged);

  // If type/facility/teacher/month changed or amount is null => compute
  if (
    (normalized.type === "facility" && normalized.facilityId) ||
    (normalized.type === "salary" && normalized.teacherId && normalized.month)
  ) {
    if (typeof updates.amount === "undefined" || updates.amount === null) {
      const { amount, source } = await computeAutoAmount(normalized);
      if (amount != null) {
        normalized.amount = amount;
        normalized.source = source;
      }
    }
  }

  normalized.updatedAt = serverTimestamp();

  await updateDoc(ref, normalized);
  return { id, ...normalized };
};

/** Delete expense */
export const deleteExpense = async (id) => {
  if (!id) throw new Error("Missing expense id");
  await deleteDoc(doc(db, "expenses", id));
  return true;
};

/**
 * List expenses with optional filters:
 * - type, facilityId, teacherId, month, date range (startDate, endDate), paid? (if you store paid flag)
 * - pagination: limit, orderByField, order
 */
export const listExpenses = async ({
  type,
  facilityId,
  teacherId,
  month,
  startDate, // Timestamp or Date
  endDate, // Timestamp or Date
  limit = 100,
  orderField = "date",
  orderDir = "desc",
} = {}) => {
  try {
    let q = collection(db, "expenses");
    const clauses = [];

    if (type) clauses.push(where("type", "==", type));
    if (facilityId) clauses.push(where("facilityId", "==", facilityId));
    if (teacherId) clauses.push(where("teacherId", "==", teacherId));
    if (month) clauses.push(where("month", "==", month));
    if (startDate)
      clauses.push(
        where(
          "date",
          ">=",
          startDate instanceof Date ? Timestamp.fromDate(startDate) : startDate
        )
      );
    if (endDate)
      clauses.push(
        where(
          "date",
          "<=",
          endDate instanceof Date ? Timestamp.fromDate(endDate) : endDate
        )
      );

    if (clauses.length > 0) {
      q = query(q, ...clauses);
    }

    // ordering + limit
    q = query(q, orderBy(orderField, orderDir), fbLimit(limit));

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("listExpenses error:", err);
    throw err;
  }
};

/** utility: get unpaid/uncleared expenses if you track a cleared flag */
export const listUnclearedExpenses = async ({ limit = 200 } = {}) => {
  try {
    const q = query(
      collection(db, "expenses"),
      where("cleared", "==", false),
      orderBy("date", "desc"),
      fbLimit(limit)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("listUnclearedExpenses error:", err);
    throw err;
  }
};

/**
 * Dashboard Service - Cung cấp các API để lấy dữ liệu thống kê cho dashboard
 */

// Helper functions
const formatCurrency = (amount) => {
  if (!amount) return 0;
  return Number(amount);
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthRange = (monthStr = null) => {
  const targetMonth = monthStr || getCurrentMonth();
  const [year, month] = targetMonth.split("-");
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return {
    start: Timestamp.fromDate(startDate),
    end: Timestamp.fromDate(endDate),
  };
};

/**
 * Lấy tổng số học sinh
 */
export const getTotalStudents = async () => {
  try {
    const studentsCol = collection(db, "students");
    const snapshot = await getDocs(studentsCol);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting total students:", error);
    return 0;
  }
};

/**
 * Lấy tổng số giáo viên - Tối ưu cho nhiều dữ liệu
 */
export const getTotalTeachers = async () => {
  try {
    const teachersCol = collection(db, "teachers");
    // Chỉ đếm những giáo viên active
    const q = query(teachersCol, where("isActive", "==", true));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting total teachers:", error);
    // Fallback: đếm tất cả nếu không có field isActive
    try {
      const allTeachersSnapshot = await getDocs(collection(db, "teachers"));
      return allTeachersSnapshot.size;
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError);
      return 0;
    }
  }
};

/**
 * Tính tổng chi phí trong tháng
 */
export const getTotalExpensesByMonth = async (monthStr = null) => {
  try {
    const { start, end } = getMonthRange(monthStr);
    const expensesCol = collection(db, "expenses");
    const q = query(
      expensesCol,
      where("date", ">=", start),
      where("date", "<=", end)
    );

    const snapshot = await getDocs(q);
    let total = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      total += formatCurrency(data.amount);
    });

    return total;
  } catch (error) {
    console.error("Error getting total expenses:", error);
    return 0;
  }
};

/**
 * Lấy số học sinh theo trạng thái - Cập nhật theo cấu trúc thực
 */
export const getStudentsByStatus = async () => {
  try {
    const studentsCol = collection(db, "students");
    const snapshot = await getDocs(studentsCol);

    const statusCount = {
      studying: 0,
      graduated: 0,
      suspended: 0,
      debt: 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const status = data.status || "studying";

      if (status === "studying") {
        statusCount.studying++;
      } else if (status === "graduated") {
        statusCount.graduated++;
      } else if (status === "suspended") {
        statusCount.suspended++;
      }
    });

    return [
      { name: "Đang học", value: statusCount.studying },
      { name: "Đã tốt nghiệp", value: statusCount.graduated },
      { name: "Tạm nghỉ", value: statusCount.suspended },
    ];
  } catch (error) {
    console.error("Error getting students by status:", error);
    return [];
  }
};

/**
 * Lấy số học sinh theo khối/lớp - Cập nhật theo cấu trúc thực
 */
export const getStudentsByGrade = async () => {
  try {
    const studentsCol = collection(db, "students");
    const snapshot = await getDocs(studentsCol);

    const gradeCount = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const grade = data.grade || "Khác";
      gradeCount[grade] = (gradeCount[grade] || 0) + 1;
    });

    return Object.entries(gradeCount).map(([grade, count]) => ({
      name: `Khối ${grade}`,
      value: count,
    }));
  } catch (error) {
    console.error("Error getting students by grade:", error);
    return [];
  }
};

/**
 * Lấy số lớp đang hoạt động - Cập nhật theo cấu trúc thực
 */
export const getActiveClasses = async () => {
  try {
    const classesCol = collection(db, "classes");
    const snapshot = await getDocs(classesCol);

    // Đếm tất cả các lớp có trong collection
    let activeCount = 0;
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Kiểm tra lớp có học sinh không
      if (data.students && data.students.length > 0) {
        activeCount++;
      }
    });

    return activeCount;
  } catch (error) {
    console.error("Error getting active classes:", error);
    return 0;
  }
};

/**
 * Tính tổng học phí trong tháng - Cập nhật theo cấu trúc tuition
 */
export const getTotalTuitionByMonth = async (monthStr = null) => {
  try {
    const tuitionCol = collection(db, "tuition");
    const snapshot = await getDocs(tuitionCol);
    let total = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      // Tính tổng từ feeItems
      if (data.feeItems) {
        const feeTotal = Object.values(data.feeItems).reduce((sum, amount) => {
          return sum + (Number(amount) || 0);
        }, 0);
        total += feeTotal;
      }
    });

    return total;
  } catch (error) {
    console.error("Error getting total tuition:", error);
    return 0;
  }
};

/**
 * Tính tổng học phí đã thu trong tháng - chỉ tính những hóa đơn đã thanh toán
 */
export const getPaidTuitionByMonth = async (monthStr = null) => {
  try {
    const tuitionCol = collection(db, "tuition");
    const q = query(tuitionCol, where("paid", "==", true));
    const snapshot = await getDocs(q);
    let total = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      // Tính tổng từ feeItems cho những hóa đơn đã thanh toán
      if (data.feeItems) {
        const feeTotal = Object.values(data.feeItems).reduce((sum, amount) => {
          return sum + (Number(amount) || 0);
        }, 0);
        total += feeTotal;
      }
    });

    return total;
  } catch (error) {
    console.error("Error getting paid tuition:", error);
    return 0;
  }
};

/**
 * Tính tổng lương giáo viên trong tháng - Cập nhật theo cấu trúc payroll
 */
export const getTotalSalaryByMonth = async (monthStr = null) => {
  try {
    const targetMonth = monthStr || getCurrentMonth();
    const payrollCol = collection(db, "payroll");

    // Sử dụng query để tối ưu
    const q = query(
      payrollCol,
      where("month", "==", targetMonth),
      where("locked", "==", true) // Chỉ tính những payroll đã được lock
    );

    const snapshot = await getDocs(q);
    let total = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Ưu tiên salary đã tính toán, sau đó là baseSalary
      const amount = data.salary || data.baseSalary || 0;
      total += formatCurrency(amount);
    });

    return total;
  } catch (error) {
    console.error("Error getting total salary:", error);
    return 0;
  }
};

/**
 * Lấy top 10 giáo viên có lương cao nhất tháng hiện tại
 */
export const getTopTeachersBySalary = async (
  monthStr = null,
  limitCount = 10
) => {
  try {
    const targetMonth = monthStr || getCurrentMonth();
    const payrollCol = collection(db, "payroll");

    const q = query(
      payrollCol,
      where("month", "==", targetMonth),
      where("locked", "==", true),
      orderBy("salary", "desc"),
      fbLimit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        teacherName: data.teacherName || "Chưa có tên",
        teacherId: data.teacherId,
        salary: data.salary || data.baseSalary || 0,
        totalSessions: data.totalSessionsInMonth || 0,
        actualSessions: data.actualSessions || 0,
      };
    });
  } catch (error) {
    console.error("Error getting top teachers by salary:", error);
    return [];
  }
};

/**
 * Lấy thống kê học sinh nợ học phí
 */
export const getUnpaidTuitionStudents = async () => {
  try {
    const tuitionCol = collection(db, "tuition");
    const q = query(tuitionCol, where("paid", "==", false));
    const snapshot = await getDocs(q);

    return snapshot.size;
  } catch (error) {
    console.error("Error getting unpaid tuition students:", error);
    return 0;
  }
};

/**
 * Cập nhật hàm getStudentsByStatus để bao gồm nợ học phí
 */
export const getStudentsByStatusWithDebt = async () => {
  try {
    const [statusData, debtCount] = await Promise.all([
      getStudentsByStatus(),
      getUnpaidTuitionStudents(),
    ]);

    return [...statusData, { name: "Nợ học phí", value: debtCount }];
  } catch (error) {
    console.error("Error getting students by status with debt:", error);
    return [];
  }
};

/**
 * Lấy dữ liệu doanh thu và chi phí theo từng tháng - Cập nhật để sử dụng doanh thu thực tế
 */
export const getRevenueExpenseChart = async () => {
  try {
    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(
        monthDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthLabel = `T${monthDate.getMonth() + 1}`;

      const [paidTuition, expenses, salary] = await Promise.all([
        getPaidTuitionByMonth(monthStr), // Sử dụng học phí đã thu thay vì tổng học phí
        getTotalExpensesByMonth(monthStr),
        getTotalSalaryByMonth(monthStr),
      ]);

      data.push({
        month: monthLabel,
        revenue: Math.round(paidTuition / 1000000), // Doanh thu thực tế đã thu
        expense: Math.round((expenses + salary) / 1000000), // Tổng chi phí + lương
      });
    }

    return data;
  } catch (error) {
    console.error("Error getting revenue expense chart data:", error);
    return [];
  }
};

/**
 * Dashboard summary cơ bản - Định nghĩa trước để tránh circular dependency
 */
export const getDashboardSummary = async () => {
  try {
    const [
      totalStudents,
      totalTeachers,
      activeClasses,
      paidTuition, // Thay đổi từ monthlyTuition
      monthlyExpenses,
      monthlySalary,
    ] = await Promise.all([
      getTotalStudents(),
      getTotalTeachers(),
      getActiveClasses(),
      getPaidTuitionByMonth(), // Sử dụng học phí đã thu
      getTotalExpensesByMonth(),
      getTotalSalaryByMonth(),
    ]);

    const totalMonthlyExpenses = monthlyExpenses + monthlySalary;
    const monthlyProfit = paidTuition - totalMonthlyExpenses;

    return {
      students: totalStudents,
      teachers: totalTeachers,
      activeClasses,
      revenue: paidTuition, // Doanh thu thực tế
      expense: totalMonthlyExpenses,
      profit: monthlyProfit,
    };
  } catch (error) {
    console.error("Error getting dashboard summary:", error);
    return {
      students: 0,
      teachers: 0,
      activeClasses: 0,
      revenue: 0,
      expense: 0,
      profit: 0,
    };
  }
};

/**
 * Lấy thống kê giáo viên theo kinh nghiệm
 */
export const getTeachersByExperience = async () => {
  try {
    const teachersCol = collection(db, "teachers");
    const snapshot = await getDocs(teachersCol);

    const experienceCount = {
      "0-2 năm": 0,
      "3-5 năm": 0,
      "6-10 năm": 0,
      "Trên 10 năm": 0,
      "Chưa xác định": 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const experience = parseInt(data.experience) || 0;

      if (experience === 0) {
        experienceCount["Chưa xác định"]++;
      } else if (experience >= 1 && experience <= 2) {
        experienceCount["0-2 năm"]++;
      } else if (experience >= 3 && experience <= 5) {
        experienceCount["3-5 năm"]++;
      } else if (experience >= 6 && experience <= 10) {
        experienceCount["6-10 năm"]++;
      } else if (experience > 10) {
        experienceCount["Trên 10 năm"]++;
      }
    });

    return Object.entries(experienceCount).map(([range, count]) => ({
      name: range,
      value: count,
    }));
  } catch (error) {
    console.error("Error getting teachers by experience:", error);
    return [];
  }
};

/**
 * Lấy thống kê giáo viên theo giới tính
 */
export const getTeachersByGender = async () => {
  try {
    const teachersCol = collection(db, "teachers");
    const snapshot = await getDocs(teachersCol);

    const genderCount = {
      male: 0,
      female: 0,
      other: 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const gender = data.gender?.toLowerCase() || "other";

      if (gender === "male" || gender === "nam") {
        genderCount.male++;
      } else if (gender === "female" || gender === "nữ") {
        genderCount.female++;
      } else {
        genderCount.other++;
      }
    });

    return [
      { name: "Nam", value: genderCount.male },
      { name: "Nữ", value: genderCount.female },
      { name: "Khác", value: genderCount.other },
    ].filter((item) => item.value > 0); // Chỉ trả về những nhóm có giá trị > 0
  } catch (error) {
    console.error("Error getting teachers by gender:", error);
    return [];
  }
};

/**
 * Cập nhật dashboard summary với thêm thống kê giáo viên
 */
export const getDashboardSummaryExtended = async () => {
  try {
    const [basicSummary, teachersByExp, teachersByGender, topTeachers] =
      await Promise.all([
        getDashboardSummary(),
        getTeachersByExperience(),
        getTeachersByGender(),
        getTopTeachersBySalary(null, 5),
      ]);

    return {
      ...basicSummary,
      teacherStats: {
        byExperience: teachersByExp,
        byGender: teachersByGender,
        topEarners: topTeachers,
      },
    };
  } catch (error) {
    console.error("Error getting extended dashboard summary:", error);
    return getDashboardSummary(); // Fallback to basic summary
  }
};

/**
 * Lấy top 5 lớp có nhiều học sinh nhất - Cập nhật theo cấu trúc thực
 */
export const getTopClassesByStudents = async () => {
  try {
    const classesCol = collection(db, "classes");
    const snapshot = await getDocs(classesCol);

    const classData = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const studentCount = data.students ? data.students.length : 0;

      if (studentCount > 0) {
        classData.push({
          name: data.name || doc.id,
          value: studentCount,
        });
      }
    });

    return classData.sort((a, b) => b.value - a.value).slice(0, 5);
  } catch (error) {
    console.error("Error getting top classes:", error);
    return [];
  }
};

/**
 * Lấy thống kê chi phí theo loại trong tháng hiện tại
 */
export const getExpensesByType = async (monthStr = null) => {
  try {
    const { start, end } = getMonthRange(monthStr);
    const expensesCol = collection(db, "expenses");
    const q = query(
      expensesCol,
      where("date", ">=", start),
      where("date", "<=", end)
    );

    const snapshot = await getDocs(q);
    const typeStats = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const type = data.type || "Khác";
      typeStats[type] = (typeStats[type] || 0) + formatCurrency(data.amount);
    });

    return Object.entries(typeStats).map(([type, total]) => ({
      type,
      total,
    }));
  } catch (error) {
    console.error("Error getting expenses by type:", error);
    return [];
  }
};

/**
 * Thống kê hiệu suất giáo viên (attendance rate)
 */
export const getTeacherPerformanceStats = async (monthStr = null) => {
  try {
    const targetMonth = monthStr || getCurrentMonth();
    const payrollCol = collection(db, "payroll");

    const q = query(payrollCol, where("month", "==", targetMonth));

    const snapshot = await getDocs(q);

    const performanceData = snapshot.docs.map((doc) => {
      const data = doc.data();
      const totalSessions = data.totalSessionsInMonth || 0;
      const actualSessions = data.actualSessions || 0;
      const attendanceRate =
        totalSessions > 0 ? (actualSessions / totalSessions) * 100 : 0;

      return {
        teacherName: data.teacherName || "Chưa có tên",
        teacherId: data.teacherId,
        totalSessions,
        actualSessions,
        attendanceRate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimal places
        salary: data.salary || data.baseSalary || 0,
      };
    });

    // Sắp xếp theo attendance rate giảm dần
    return performanceData.sort((a, b) => b.attendanceRate - a.attendanceRate);
  } catch (error) {
    console.error("Error getting teacher performance stats:", error);
    return [];
  }
};
