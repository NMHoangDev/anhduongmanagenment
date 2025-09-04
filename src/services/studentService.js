import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

const studentsCol = collection(db, "students");
const parentsCol = collection(db, "parents");

export async function createStudent(studentId, studentData, parentData) {
  const studentRef = doc(studentsCol, studentId);

  // Tạo ID mới cho phụ huynh
  const parentId = `${studentId}_parent`; // hoặc dùng random ID
  const parentRef = doc(parentsCol, parentId);

  // 1. Ghi dữ liệu học sinh, bao gồm parentId
  const studentDataWithParent = {
    ...studentData,
    parentId: parentId,
  };
  await setDoc(studentRef, studentDataWithParent);

  // 2. Ghi dữ liệu phụ huynh
  const parentDataWithStudent = {
    ...parentData,
    studentId: studentId, // hoặc studentRef nếu dùng Reference
  };
  await setDoc(parentRef, parentDataWithStudent);
}

// 📌 Lấy thông tin học sinh
export async function getStudent(studentId) {
  const studentSnap = await getDoc(doc(studentsCol, studentId));
  return studentSnap.exists() ? studentSnap.data() : null;
}

// 📌 Cập nhật học sinh
export async function updateStudent(studentId, updates) {
  const studentRef = doc(studentsCol, studentId);
  await updateDoc(studentRef, updates);
}

// 📌 Xóa học sinh
export async function deleteStudent(studentId) {
  await deleteDoc(doc(studentsCol, studentId));
}

// 📌 Lấy danh sách toàn bộ học sinh
export async function getAllStudents() {
  const snapshot = await getDocs(studentsCol);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// 📌 Ghi nhận điểm danh theo ngày cụ thể (ví dụ: "07-01-2025")
export async function setAttendance(studentId, dateString, attendanceData) {
  const attendanceRef = doc(
    db,
    `students/${studentId}/attendance/${dateString}`
  );
  await setDoc(attendanceRef, attendanceData);
}

// 📌 Lấy thông tin điểm danh theo ngày
export async function getAttendance(studentId, dateString) {
  const attendanceSnap = await getDoc(
    doc(db, `students/${studentId}/attendance/${dateString}`)
  );
  return attendanceSnap.exists() ? attendanceSnap.data() : null;
}

// 📌 Ghi học phí cho năm học
export async function setTuition(studentId, academicYear, tuitionData) {
  const tuitionRef = doc(db, `students/${studentId}/tuition/${academicYear}`);
  await setDoc(tuitionRef, tuitionData);
}

// 📌 Lấy học phí của năm học
export async function getTuition(studentId, academicYear) {
  const tuitionSnap = await getDoc(
    doc(db, `students/${studentId}/tuition/${academicYear}`)
  );
  return tuitionSnap.exists() ? tuitionSnap.data() : null;
}

const studentService = {
  getAllStudents: async () => {
    // Logic to fetch all students
  },
  updateStudent: async (studentId, updatedData) => {
    // Logic to update student
  },
  createStudent: async (studentId, studentData) => {
    // Logic to create a new student
  },
  deleteStudent: async (studentId) => {
    // Logic to delete a student
  },
};

export default studentService;
