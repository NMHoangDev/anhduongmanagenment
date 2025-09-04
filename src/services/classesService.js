import { db } from "./firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

// Lấy thông tin giáo viên theo id
async function getTeacherById(teacherId) {
  if (!teacherId) return null;
  const teacherRef = doc(db, "teachers", teacherId);
  const teacherSnap = await getDoc(teacherRef);
  if (teacherSnap.exists()) {
    return { id: teacherId, ...teacherSnap.data() };
  }
  return null;
}

// Lấy danh sách lớp, kèm thông tin giáo viên và chi tiết học sinh
export async function getAllClasses() {
  const classesRef = collection(db, "classes");
  const snapshot = await getDocs(classesRef);

  // Lấy thông tin giáo viên và học sinh cho từng lớp
  const classes = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const classData = docSnap.data();
      const classId = docSnap.id;

      // 1. Lấy thông tin giáo viên
      const teacherInfo = await getTeacherById(classData.teacher_id);

      // 2. Lấy chi tiết từng học sinh dựa vào mảng ID
      const studentIds = classData.students || [];
      const studentsDetails = await Promise.all(
        studentIds.map(async (studentId) => {
          const studentDoc = doc(db, "students", studentId);
          const studentSnap = await getDoc(studentDoc);
          if (studentSnap.exists()) {
            return { id: studentId, ...studentSnap.data() };
          }
          return { id: studentId }; // Trả về ít nhất ID nếu không tìm thấy chi tiết
        })
      );

      return {
        id: classId,
        ...classData,
        teacher: teacherInfo, // Trả về object giáo viên
        studentsDetails: studentsDetails, // Thông tin chi tiết học sinh
      };
    })
  );

  return classes;
}

// Tạo lớp học cùng học sinh và giáo viên
export async function createClass(classId, classData) {
  const classRef = doc(db, "classes", classId);

  // Chuẩn bị dữ liệu, loại bỏ các field undefined
  const saveData = {
    name: classData.name,
    grade: classData.grade,
    facility: classData.facility,
    students: classData.students || [],
  };

  // Chỉ thêm teacher nếu có giá trị
  if (classData.teacher) {
    saveData.teacher = classData.teacher;
  }

  await setDoc(classRef, saveData);

  return classRef;
}

// Tạo lịch trình timetable trong lớp học cụ thể
export async function createClassTimetable(classId, weekId, timetableData) {
  const timetableRef = doc(db, `classes/${classId}/timetable`, weekId);

  await setDoc(timetableRef, {
    schedule: timetableData.schedule,
  });

  return timetableRef;
}
export async function addStudentToClass(classId, studentId) {
  const classRef = doc(db, "classes", classId);

  try {
    await updateDoc(classRef, {
      students: arrayUnion(studentId),
    });
    console.log(`Đã thêm học sinh ${studentId} vào lớp ${classId}`);
  } catch (error) {
    console.error("Lỗi khi thêm học sinh vào lớp: ", error);
    throw error;
  }
}

export const removeStudentFromClass = async (classId, studentId) => {
  try {
    // Get current class data
    const classData = await getClassById(classId);

    // Remove student from the class's student list
    const updatedStudents = classData.students.filter((id) => id !== studentId);

    // Update class with new student list
    await updateClass(classId, {
      ...classData,
      students: updatedStudents,
    });

    return true;
  } catch (error) {
    console.error("Error removing student from class:", error);
    throw error;
  }
};

// Helper function to get class by ID
const getClassById = async (classId) => {
  const classes = await getAllClasses();
  return classes.find((c) => c.id === classId);
};

export const updateClass = async (classId, updatedData) => {
  try {
    const classRef = doc(db, "classes", classId);

    // Chuẩn bị dữ liệu cập nhật, loại bỏ các field undefined
    const updateData = {};

    if (updatedData.name !== undefined) updateData.name = updatedData.name;
    if (updatedData.grade !== undefined) updateData.grade = updatedData.grade;
    if (updatedData.facility !== undefined)
      updateData.facility = updatedData.facility;
    if (updatedData.students !== undefined)
      updateData.students = updatedData.students;

    // Chỉ cập nhật teacher nếu có giá trị
    if (updatedData.teacher !== undefined && updatedData.teacher !== "") {
      updateData.teacher = updatedData.teacher;
    }

    await updateDoc(classRef, updateData);
    return updateData;
  } catch (error) {
    console.error("Error updating class:", error);
    throw error;
  }
};

export const deleteClass = async (classId) => {
  try {
    const classRef = doc(db, "classes", classId);

    // Lấy thông tin lớp để lấy danh sách học sinh
    const classSnap = await getDoc(classRef); // Sửa lại dòng này
    let students = [];
    if (classSnap.exists()) {
      const classData = classSnap.data();
      students = classData.students || [];
    }

    // Xóa từng học sinh trong collection students
    for (const studentId of students) {
      const studentRef = doc(db, "students", studentId);
      await deleteDoc(studentRef);
    }

    // Xóa lớp học
    await deleteDoc(classRef);

    return true;
  } catch (error) {
    console.error("Error deleting class and students from Firestore:", error);
    throw error;
  }
};
