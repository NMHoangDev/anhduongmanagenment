import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/** Helpers */
const toMonthRangeUTC = (monthStr, tzOffsetMinutes = 0) => {
  // monthStr: "YYYY-MM" (ví dụ "2025-08")
  const [y, m] = monthStr.split("-").map(Number);
  const startLocal = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const endLocal = new Date(Date.UTC(y, m, 1, 0, 0, 0)); // đầu tháng kế tiếp
  // nếu dữ liệu lưu UTC: trừ offset để quy về UTC; nếu lưu giờ VN thì để 0
  const startUTC = new Date(startLocal.getTime() - tzOffsetMinutes * 60_000);
  const endUTC = new Date(endLocal.getTime() - tzOffsetMinutes * 60_000);
  return {
    start: Timestamp.fromDate(startUTC),
    end: Timestamp.fromDate(endUTC),
  };
};

/**
 * Lấy tất cả check-in của giáo viên trong 1 tháng (dùng để debug/hiển thị).
 * @returns {Promise<Array<{id: string, data: any}>>}
 */
export const getMonthlyCheckins = async ({
  teacherId,
  month, // "YYYY-MM"
  tzOffsetMinutes = 0, // nếu dữ liệu lưu UTC thì để 0; lưu theo VN time thì truyền 420
}) => {
  const { start, end } = toMonthRangeUTC(month, tzOffsetMinutes);

  // ⚠️ Cần composite index cho (teacherId, type, timestamp)
  const col = collection(db, "teacher_attendance");
  const qy = query(
    col,
    where("teacherId", "==", teacherId),
    where("type", "==", "check_in"),
    where("timestamp", ">=", start),
    where("timestamp", "<", end),
    orderBy("timestamp", "asc")
  );

  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Đếm số buổi dạy theo số CHECK-IN (mỗi check-in = 1 buổi)
 */
export const countMonthlySessionsByCheckin = async (params) => {
  const items = await getMonthlyCheckins(params);
  return items.length;
};

/**
 * Đếm số buổi dạy theo TỔNG SỐ PERIODS của các check-in (mỗi period = 1 buổi/tiết)
 */
export const countMonthlySessionsByPeriods = async (params) => {
  const items = await getMonthlyCheckins(params);
  return items.reduce(
    (acc, it) => acc + (Array.isArray(it.periods) ? it.periods.length : 0),
    0
  );
};

/**
 * Tính lương tháng cho 1 giáo viên
 * @returns {Promise<{
 *  teacherId, month, totalSessionsInMonth, baseSalary,
 *  actualSessions, rate, salary, mode
 * }>}
 */
export const computeMonthlySalary = async ({
  teacherId,
  month, // "YYYY-MM"
  totalSessionsInMonth, // tổng số buổi chuẩn/tháng (vd 26)
  baseSalary, // lương cơ bản/tháng (vd 10_000_000)
  mode = "byCheckin", // 'byCheckin' | 'byPeriods'
  tzOffsetMinutes = 0, // 0 nếu dữ liệu lưu UTC; 420 nếu lưu theo VN time
}) => {
  if (!teacherId) throw new Error("teacherId is required");
  if (!month) throw new Error("month is required (YYYY-MM)");
  if (!Number.isFinite(totalSessionsInMonth) || totalSessionsInMonth <= 0) {
    throw new Error("totalSessionsInMonth must be > 0");
  }
  if (!Number.isFinite(baseSalary) || baseSalary < 0) {
    throw new Error("baseSalary must be >= 0");
  }

  const actualSessions =
    mode === "byPeriods"
      ? await countMonthlySessionsByPeriods({
          teacherId,
          month,
          tzOffsetMinutes,
        })
      : await countMonthlySessionsByCheckin({
          teacherId,
          month,
          tzOffsetMinutes,
        });

  const rate =
    Math.min(actualSessions, totalSessionsInMonth) / totalSessionsInMonth;
  const salary = Math.round(baseSalary * rate);

  return {
    teacherId,
    month,
    mode,
    totalSessionsInMonth,
    baseSalary,
    actualSessions,
    rate,
    salary,
  };
};

/**
 * Lưu/chốt bảng lương tháng (overwrite theo khóa teacherId+month)
 * Path: payroll/{teacherId}_{month}
 */
export const saveMonthlyPayroll = async (payroll) => {
  const { teacherId, month } = payroll;
  if (!teacherId || !month) throw new Error("Missing teacherId/month");
  const id = `${teacherId}_${month}`;
  await setDoc(doc(db, "payroll", id), {
    ...payroll,
    calculatedAt: new Date().toISOString(),
    locked: payroll.locked ?? false,
  });
  return id;
};

/**
 * Lấy bảng lương đã lưu
 */
export const getMonthlyPayroll = async ({ teacherId, month }) => {
  const id = `${teacherId}_${month}`;
  const snap = await getDoc(doc(db, "payroll", id));
  return snap.exists() ? { id, ...snap.data() } : null;
};
