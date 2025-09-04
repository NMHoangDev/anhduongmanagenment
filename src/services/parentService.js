import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// Helper: Lấy tên lớp của học sinh từ collection classes
async function getStudentClassName(studentId) {
  const classesSnapshot = await getDocs(collection(db, "classes"));
  for (const classDoc of classesSnapshot.docs) {
    const classData = classDoc.data();
    const students = classData.students || [];
    if (students.includes(studentId)) {
      return classData.name || classDoc.id;
    }
  }
  return "";
}

// Lấy tất cả phụ huynh kèm thông tin học sinh (tên và lớp)
export const getAllParents = async () => {
  const querySnapshot = await getDocs(collection(db, "parents"));
  const parents = [];

  for (const parentDoc of querySnapshot.docs) {
    const parentData = parentDoc.data();
    let studentName = "";
    let studentClass = "";

    // Nếu có studentId (là id hoặc là path)
    if (parentData.studentId) {
      let studentId = parentData.studentId;
      // Nếu là dạng /students/xxx thì lấy phần cuối
      if (typeof studentId === "string" && studentId.includes("/")) {
        studentId = studentId.split("/").pop();
      }
      try {
        const studentSnap = await getDoc(doc(db, "students", studentId));
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          studentName = studentData.name || "";
          // Lấy tên lớp thực tế từ collection classes
          studentClass = await getStudentClassName(studentId);
        }
      } catch (e) {
        // Không tìm thấy học sinh
      }
    }

    parents.push({
      id: parentDoc.id,
      ...parentData,
      studentName,
      studentClass,
    });
  }

  return parents;
};

// Không cho phép thêm mới phụ huynh ở đây

// Cập nhật phụ huynh
export const updateParent = async (id, data) => {
  await updateDoc(doc(db, "parents", id), data);
};

// Xóa phụ huynh
export const deleteParent = async (id) => {
  await deleteDoc(doc(db, "parents", id));
};
