import { db } from "../firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  serverTimestamp,
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

// Lấy danh sách lớp, kèm thông tin giáo viên và chi tiết học sinh - CẬP NHẬT THÊM GVCN
export async function getAllClasses() {
  const classesRef = collection(db, "classes");
  const snapshot = await getDocs(classesRef);

  // Lấy thông tin giáo viên và học sinh cho từng lớp
  const classes = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const classData = docSnap.data();
      const classId = docSnap.id;

      // 1. Lấy thông tin giáo viên bộ môn (teacher_id)
      const teacherInfo = await getTeacherById(classData.teacher_id);

      // 2. Lấy thông tin giáo viên chủ nhiệm (homeRoomTeacherId) - THÊM MỚI
      const homeRoomTeacherInfo = classData.homeRoomTeacherId
        ? await getTeacherById(classData.homeRoomTeacherId)
        : null;

      // 3. Lấy chi tiết từng học sinh dựa vào mảng ID
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
        teacher: teacherInfo, // Giáo viên bộ môn
        homeRoomTeacher: homeRoomTeacherInfo, // Giáo viên chủ nhiệm - THÊM MỚI
        studentsDetails: studentsDetails, // Thông tin chi tiết học sinh
        hasHomeRoomTeacher: !!classData.homeRoomTeacherId, // Flag kiểm tra có GVCN - THÊM MỚI
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
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef);

    // Nếu lớp không tồn tại thì chỉ log và trả về success (không ném lỗi)
    if (!classSnap.exists()) {
      console.warn(
        `removeStudentFromClass: Lớp với id "${classId}" không tồn tại. Bỏ qua việc xoá học sinh ${studentId}.`
      );
      return true;
    }

    // Xoá bằng arrayRemove để tránh phải đọc/ghi toàn bộ mảng students
    await updateDoc(classRef, {
      students: arrayRemove(studentId),
      lastUpdated: serverTimestamp(),
    });

    console.log(`Đã xoá học sinh ${studentId} khỏi lớp ${classId}`);
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
    const updateData = { lastUpdated: serverTimestamp() };

    if (updatedData.name !== undefined) updateData.name = updatedData.name;
    if (updatedData.grade !== undefined) updateData.grade = updatedData.grade;
    if (updatedData.facility !== undefined)
      updateData.facility = updatedData.facility;
    if (updatedData.students !== undefined)
      updateData.students = updatedData.students;

    // Cập nhật giáo viên bộ môn (teacher -> teacher_id)
    if (updatedData.teacher !== undefined && updatedData.teacher !== "") {
      updateData.teacher_id = updatedData.teacher;
    }

    // CẬP NHẬT GIÁO VIÊN CHỦ NHIỆM - THÊM MỚI
    if (updatedData.homeRoomTeacherId !== undefined) {
      if (
        updatedData.homeRoomTeacherId &&
        updatedData.homeRoomTeacherId !== ""
      ) {
        // Nếu có GVCN mới
        updateData.homeRoomTeacherId = updatedData.homeRoomTeacherId;
        updateData.assignedAt = serverTimestamp();
        updateData.assignedBy = updatedData.assignedBy || "system";

        // Cập nhật thông tin giáo viên
        const teacherRef = doc(db, "teachers", updatedData.homeRoomTeacherId);
        await updateDoc(teacherRef, {
          homeRoomClasses: arrayUnion(classId),
          isHomeRoomTeacher: true,
          lastUpdated: serverTimestamp(),
        });

        // Tạo assignment record
        const assignmentRef = doc(
          db,
          "classAssignments",
          `${classId}_${updatedData.homeRoomTeacherId}`
        );
        await setDoc(assignmentRef, {
          teacherId: updatedData.homeRoomTeacherId,
          classId,
          assignedAt: serverTimestamp(),
          assignedBy: updatedData.assignedBy || "system",
          status: "active",
          type: "homeroom",
        });
      } else {
        // Nếu xóa GVCN (set null)
        updateData.homeRoomTeacherId = null;
        updateData.unassignedAt = serverTimestamp();
      }
    }

    console.log("Updating class with data:", updateData); // Debug log

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
// ===================== PHÂN CÔNG GIÁO VIÊN CHỦ NHIỆM =====================

/**
 * Phân công giáo viên làm chủ nhiệm lớp
 * @param {string} teacherId - ID giáo viên
 * @param {string} classId - ID lớp học
 * @param {string} assignerId - ID người phân công (admin)
 * @returns {Promise<void>}
 */
export const assignHomeRoomTeacher = async (teacherId, classId, assignerId) => {
  try {
    // Kiểm tra xem lớp đã có GVCN chưa
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef);

    if (classSnap.exists() && classSnap.data().homeRoomTeacherId) {
      // Hủy phân công GVCN cũ trước
      await unassignHomeRoomTeacher(
        classSnap.data().homeRoomTeacherId,
        classId
      );
    }

    // Cập nhật thông tin lớp học
    await updateDoc(classRef, {
      homeRoomTeacherId: teacherId,
      assignedAt: serverTimestamp(),
      assignedBy: assignerId,
      lastUpdated: serverTimestamp(),
    });

    // Cập nhật danh sách lớp chủ nhiệm của giáo viên
    const teacherRef = doc(db, "teachers", teacherId);
    const teacherSnap = await getDoc(teacherRef);

    if (teacherSnap.exists()) {
      const currentHomeRoomClasses = teacherSnap.data().homeRoomClasses || [];
      await updateDoc(teacherRef, {
        homeRoomClasses: arrayUnion(classId),
        isHomeRoomTeacher: true,
        lastUpdated: serverTimestamp(),
      });
    }

    // Tạo bản ghi assignment riêng để dễ tracking
    const assignmentRef = doc(
      db,
      "classAssignments",
      `${classId}_${teacherId}`
    );
    await setDoc(assignmentRef, {
      teacherId,
      classId,
      assignedAt: serverTimestamp(),
      assignedBy: assignerId,
      status: "active",
      type: "homeroom",
    });

    console.log(
      `Đã phân công giáo viên ${teacherId} làm chủ nhiệm lớp ${classId}`
    );
  } catch (error) {
    console.error("Error assigning homeroom teacher:", error);
    throw error;
  }
};

/**
 * Hủy phân công chủ nhiệm
 * @param {string} teacherId - ID giáo viên
 * @param {string} classId - ID lớp học
 * @returns {Promise<void>}
 */
export const unassignHomeRoomTeacher = async (teacherId, classId) => {
  try {
    // Xóa chủ nhiệm khỏi lớp
    const classRef = doc(db, "classes", classId);
    await updateDoc(classRef, {
      homeRoomTeacherId: null,
      unassignedAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });

    // Xóa lớp khỏi danh sách chủ nhiệm của giáo viên
    const teacherRef = doc(db, "teachers", teacherId);
    const teacherSnap = await getDoc(teacherRef);

    if (teacherSnap.exists()) {
      const currentClasses = teacherSnap.data().homeRoomClasses || [];
      const updatedClasses = currentClasses.filter((id) => id !== classId);

      await updateDoc(teacherRef, {
        homeRoomClasses: updatedClasses,
        isHomeRoomTeacher: updatedClasses.length > 0,
        lastUpdated: serverTimestamp(),
      });
    }

    // Cập nhật bản ghi assignment
    const assignmentRef = doc(
      db,
      "classAssignments",
      `${classId}_${teacherId}`
    );
    const assignmentSnap = await getDoc(assignmentRef);

    if (assignmentSnap.exists()) {
      await updateDoc(assignmentRef, {
        status: "inactive",
        unassignedAt: serverTimestamp(),
      });
    }

    console.log(`Đã hủy phân công giáo viên ${teacherId} cho lớp ${classId}`);
  } catch (error) {
    console.error("Error unassigning homeroom teacher:", error);
    throw error;
  }
};

/**
 * Lấy danh sách lớp chủ nhiệm của giáo viên
 * @param {string} teacherId - ID giáo viên
 * @returns {Promise<Array>}
 */
export const getTeacherHomeRoomClasses = async (teacherId) => {
  try {
    const teacherRef = doc(db, "teachers", teacherId);
    const teacherSnap = await getDoc(teacherRef);

    if (!teacherSnap.exists()) return [];

    const homeRoomClasses = teacherSnap.data().homeRoomClasses || [];
    const classes = [];

    for (const classId of homeRoomClasses) {
      const classRef = doc(db, "classes", classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const classData = classSnap.data();

        // Lấy thông tin chi tiết học sinh
        const studentIds = classData.students || [];
        const studentsDetails = await Promise.all(
          studentIds.map(async (studentId) => {
            const studentDoc = doc(db, "students", studentId);
            const studentSnap = await getDoc(studentDoc);
            if (studentSnap.exists()) {
              return { id: studentId, ...studentSnap.data() };
            }
            return { id: studentId };
          })
        );

        classes.push({
          id: classId,
          ...classData,
          studentsDetails,
          assignedAt: classData.assignedAt,
        });
      }
    }

    return classes;
  } catch (error) {
    console.error("Error getting teacher homeroom classes:", error);
    return [];
  }
};

/**
 * Lấy thông tin chủ nhiệm của lớp
 * @param {string} classId - ID lớp học
 * @returns {Promise<Object|null>}
 */
export const getClassHomeRoomTeacher = async (classId) => {
  try {
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) return null;

    const teacherId = classSnap.data().homeRoomTeacherId;
    if (!teacherId) return null;

    const teacherInfo = await getTeacherById(teacherId);

    return teacherInfo
      ? {
          ...teacherInfo,
          assignedAt: classSnap.data().assignedAt,
          assignedBy: classSnap.data().assignedBy,
        }
      : null;
  } catch (error) {
    console.error("Error getting class homeroom teacher:", error);
    return null;
  }
};

/**
 * Lấy danh sách tất cả phân công chủ nhiệm
 * @returns {Promise<Array>}
 */
export const getAllClassAssignments = async () => {
  try {
    const assignmentsRef = collection(db, "classAssignments");
    const q = query(assignmentsRef, where("status", "==", "active"));
    const snapshot = await getDocs(q);

    const assignments = [];
    for (const docSnap of snapshot.docs) {
      const assignmentData = { id: docSnap.id, ...docSnap.data() };

      // Lấy thông tin lớp học
      const classRef = doc(db, "classes", assignmentData.classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        assignmentData.classInfo = { id: classSnap.id, ...classSnap.data() };
      }

      // Lấy thông tin giáo viên
      const teacherInfo = await getTeacherById(assignmentData.teacherId);
      if (teacherInfo) {
        assignmentData.teacherInfo = teacherInfo;
      }

      assignments.push(assignmentData);
    }

    return assignments;
  } catch (error) {
    console.error("Error getting all class assignments:", error);
    return [];
  }
};

/**
 * Lấy danh sách lớp chưa có GVCN
 * @returns {Promise<Array>}
 */
export const getClassesWithoutHomeRoomTeacher = async () => {
  try {
    const classesRef = collection(db, "classes");
    const snapshot = await getDocs(classesRef);

    const classesWithoutHRT = [];
    for (const docSnap of snapshot.docs) {
      const classData = { id: docSnap.id, ...docSnap.data() };
      if (!classData.homeRoomTeacherId) {
        // Lấy thông tin chi tiết học sinh
        const studentIds = classData.students || [];
        const studentsDetails = await Promise.all(
          studentIds.map(async (studentId) => {
            const studentDoc = doc(db, "students", studentId);
            const studentSnap = await getDoc(studentDoc);
            if (studentSnap.exists()) {
              return { id: studentId, ...studentSnap.data() };
            }
            return { id: studentId };
          })
        );

        classData.studentsDetails = studentsDetails;
        classesWithoutHRT.push(classData);
      }
    }

    return classesWithoutHRT;
  } catch (error) {
    console.error("Error getting classes without homeroom teacher:", error);
    return [];
  }
};

/**
 * Lấy danh sách giáo viên có thể làm chủ nhiệm
 * @param {boolean} allowMultipleClasses - Cho phép giáo viên làm chủ nhiệm nhiều lớp
 * @returns {Promise<Array>}
 */
export const getAvailableHomeRoomTeachers = async (
  allowMultipleClasses = false
) => {
  try {
    const teachersRef = collection(db, "teachers");
    const snapshot = await getDocs(teachersRef);

    const availableTeachers = [];
    for (const docSnap of snapshot.docs) {
      const teacherData = { id: docSnap.id, ...docSnap.data() };
      const homeRoomClasses = teacherData.homeRoomClasses || [];

      // Nếu cho phép làm chủ nhiệm nhiều lớp hoặc chưa làm chủ nhiệm lớp nào
      if (allowMultipleClasses || homeRoomClasses.length === 0) {
        // Thêm thông tin số lớp đang chủ nhiệm
        teacherData.currentHomeRoomCount = homeRoomClasses.length;
        availableTeachers.push(teacherData);
      }
    }

    return availableTeachers;
  } catch (error) {
    console.error("Error getting available homeroom teachers:", error);
    return [];
  }
};

/**
 * Chuyển đổi giáo viên chủ nhiệm (từ giáo viên này sang giáo viên khác)
 * @param {string} oldTeacherId - ID giáo viên cũ
 * @param {string} newTeacherId - ID giáo viên mới
 * @param {string} classId - ID lớp học
 * @param {string} assignerId - ID người thực hiện
 * @returns {Promise<void>}
 */
export const transferHomeRoomTeacher = async (
  oldTeacherId,
  newTeacherId,
  classId,
  assignerId
) => {
  try {
    // Hủy phân công cũ
    if (oldTeacherId) {
      await unassignHomeRoomTeacher(oldTeacherId, classId);
    }

    // Phân công mới
    await assignHomeRoomTeacher(newTeacherId, classId, assignerId);

    console.log(
      `Đã chuyển chủ nhiệm lớp ${classId} từ ${oldTeacherId} sang ${newTeacherId}`
    );
  } catch (error) {
    console.error("Error transferring homeroom teacher:", error);
    throw error;
  }
};

/**
 * Lấy thống kê phân công chủ nhiệm
 * @returns {Promise<Object>}
 */
export const getHomeRoomAssignmentStats = async () => {
  try {
    const [allClasses, allTeachers, assignments] = await Promise.all([
      getAllClasses(),
      getAvailableHomeRoomTeachers(true), // Lấy tất cả giáo viên
      getAllClassAssignments(),
    ]);

    const stats = {
      totalClasses: allClasses.length,
      assignedClasses: assignments.length,
      unassignedClasses: allClasses.length - assignments.length,
      totalTeachers: allTeachers.length,
      activeHomeRoomTeachers: assignments.length,
      availableTeachers: allTeachers.filter(
        (t) => (t.homeRoomClasses || []).length === 0
      ).length,
      assignmentRate:
        allClasses.length > 0
          ? ((assignments.length / allClasses.length) * 100).toFixed(1)
          : 0,
    };

    return stats;
  } catch (error) {
    console.error("Error getting homeroom assignment stats:", error);
    return {
      totalClasses: 0,
      assignedClasses: 0,
      unassignedClasses: 0,
      totalTeachers: 0,
      activeHomeRoomTeachers: 0,
      availableTeachers: 0,
      assignmentRate: 0,
    };
  }
};

// Cập nhật hàm getAllClasses để bao gồm thông tin GVCN
export async function getAllClassesWithHomeRoomTeacher() {
  const classesRef = collection(db, "classes");
  const snapshot = await getDocs(classesRef);

  // Lấy thông tin giáo viên và học sinh cho từng lớp
  const classes = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const classData = docSnap.data();
      const classId = docSnap.id;

      // 1. Lấy thông tin giáo viên bộ môn (teacher_id)
      const teacherInfo = await getTeacherById(classData.teacher_id);

      // 2. Lấy thông tin giáo viên chủ nhiệm (homeRoomTeacherId)
      const homeRoomTeacherInfo = classData.homeRoomTeacherId
        ? await getTeacherById(classData.homeRoomTeacherId)
        : null;

      // 3. Lấy chi tiết từng học sinh dựa vào mảng ID
      const studentIds = classData.students || [];
      const studentsDetails = await Promise.all(
        studentIds.map(async (studentId) => {
          const studentDoc = doc(db, "students", studentId);
          const studentSnap = await getDoc(studentDoc);
          if (studentSnap.exists()) {
            return { id: studentId, ...studentSnap.data() };
          }
          return { id: studentId };
        })
      );

      return {
        id: classId,
        ...classData,
        teacher: teacherInfo, // Giáo viên bộ môn
        homeRoomTeacher: homeRoomTeacherInfo, // Giáo viên chủ nhiệm
        studentsDetails: studentsDetails,
        hasHomeRoomTeacher: !!classData.homeRoomTeacherId,
      };
    })
  );

  return classes;
}

/**
 * Lấy tất cả môn học (subjects collection)
 */
export const getAllSubjects = async () => {
  try {
    const ref = collection(db, "subjects");
    const snap = await getDocs(ref);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting subjects:", error);
    return [];
  }
};

/**
 * Phân công giáo viên giảng dạy cho 1 lớp với 1 môn
 * Lưu vào:
 * - trường classes.{teachingAssignments} (array of objects { teacherId, subjectId, classId, assignedAt, assignedBy })
 * - tạo record trong classAssignments (id: `${classId}_${teacherId}_${subjectId}` , type: 'teaching')
 * - cập nhật teachers.{teachingAssignments} để dễ tra cứu (array of { classId, subjectId })
 */
export const assignTeachingTeacher = async (
  teacherId,
  classId,
  subjectId,
  assignerId
) => {
  try {
    if (!teacherId || !classId || !subjectId) {
      throw new Error("teacherId, classId và subjectId là bắt buộc");
    }

    const classRef = doc(db, "classes", classId);
    const teacherRef = doc(db, "teachers", teacherId);

    const assignmentObj = {
      teacherId,
      subjectId,
      classId,
      assignedAt: serverTimestamp(),
      assignedBy: assignerId || "system",
    };

    // Thêm vào mảng teachingAssignments trên lớp
    await updateDoc(classRef, {
      teachingAssignments: arrayUnion(assignmentObj),
      lastUpdated: serverTimestamp(),
    });

    // Cập nhật teacher document (danh sách môn/lớp đang dạy)
    await updateDoc(teacherRef, {
      teachingAssignments: arrayUnion({
        classId,
        subjectId,
      }),
      isTeaching: true,
      lastUpdated: serverTimestamp(),
    });

    // Tạo/ghi record trong collection classAssignments để dễ tracking
    const assignmentRef = doc(
      db,
      "classAssignments",
      `${classId}_${teacherId}_${subjectId}`
    );
    await setDoc(assignmentRef, {
      teacherId,
      classId,
      subjectId,
      assignedAt: serverTimestamp(),
      assignedBy: assignerId || "system",
      status: "active",
      type: "teaching",
    });

    console.log(
      `Assigned teacher ${teacherId} to teach subject ${subjectId} for class ${classId}`
    );
    return true;
  } catch (error) {
    console.error("Error assigning teaching teacher:", error);
    throw error;
  }
};

/**
 * Hủy phân công giảng dạy (remove)
 * - Remove object từ classes.teachingAssignments (arrayRemove)
 * - Cập nhật teachers.teachingAssignments (xoá object {classId, subjectId})
 * - Cập nhật classAssignments record (status -> inactive)
 */
export const unassignTeachingTeacher = async (
  teacherId,
  classId,
  subjectId
) => {
  try {
    if (!teacherId || !classId || !subjectId) {
      throw new Error("teacherId, classId và subjectId là bắt buộc");
    }

    const classRef = doc(db, "classes", classId);
    const teacherRef = doc(db, "teachers", teacherId);
    const assignmentRef = doc(
      db,
      "classAssignments",
      `${classId}_${teacherId}_${subjectId}`
    );

    // Object shape must match what was stored (without serverTimestamp)
    const storedObj = {
      teacherId,
      subjectId,
      classId,
      // assignedAt/assignedBy not included here because arrayRemove matches entire object.
      // To ensure removal works regardless of timestamps we perform a read + filter fallback below.
    };

    // Try arrayRemove by constructing object without timestamps (may not match)
    try {
      await updateDoc(classRef, {
        teachingAssignments: arrayRemove(storedObj),
        lastUpdated: serverTimestamp(),
      });
    } catch (err) {
      // fallback: read current doc and filter manually
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        const data = classSnap.data();
        const current = data.teachingAssignments || [];
        const filtered = current.filter(
          (a) =>
            !(
              a.teacherId === teacherId &&
              a.subjectId === subjectId &&
              a.classId === classId
            )
        );
        await updateDoc(classRef, {
          teachingAssignments: filtered,
          lastUpdated: serverTimestamp(),
        });
      }
    }

    // Remove from teacher.teachingAssignments (object {classId, subjectId})
    try {
      await updateDoc(teacherRef, {
        teachingAssignments: arrayRemove({ classId, subjectId }),
        lastUpdated: serverTimestamp(),
      });
    } catch (err) {
      // fallback: read & filter
      const teacherSnap = await getDoc(teacherRef);
      if (teacherSnap.exists()) {
        const tdata = teacherSnap.data();
        const current = tdata.teachingAssignments || [];
        const filtered = current.filter(
          (a) => !(a.classId === classId && a.subjectId === subjectId)
        );
        await updateDoc(teacherRef, {
          teachingAssignments: filtered,
          lastUpdated: serverTimestamp(),
        });
      }
    }

    // Mark assignment record inactive
    const assignSnap = await getDoc(assignmentRef);
    if (assignSnap.exists()) {
      await updateDoc(assignmentRef, {
        status: "inactive",
        unassignedAt: serverTimestamp(),
      });
    }

    console.log(
      `Unassigned teacher ${teacherId} from ${subjectId} @ ${classId}`
    );
    return true;
  } catch (error) {
    console.error("Error unassigning teaching teacher:", error);
    throw error;
  }
};

/**
 * Lấy danh sách phân công giảng dạy cho 1 lớp
 */
export const getTeachingAssignmentsByClass = async (classId) => {
  try {
    const classRef = doc(db, "classes", classId);
    const classSnap = await getDoc(classRef);
    if (!classSnap.exists()) return [];
    return classSnap.data().teachingAssignments || [];
  } catch (error) {
    console.error("Error getting teaching assignments by class:", error);
    return [];
  }
};

/**
 * Lấy danh sách phân công giảng dạy của 1 giáo viên
 */
export const getTeachingAssignmentsByTeacher = async (teacherId) => {
  try {
    const teacherRef = doc(db, "teachers", teacherId);
    const teacherSnap = await getDoc(teacherRef);
    if (!teacherSnap.exists()) return [];
    return teacherSnap.data().teachingAssignments || [];
  } catch (error) {
    console.error("Error getting teaching assignments by teacher:", error);
    return [];
  }
};
