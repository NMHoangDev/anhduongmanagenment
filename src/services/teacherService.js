import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  getDoc,
  where,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Tìm teacher ID thực từ Firebase Auth UID hoặc tên
 * @param {string} authUid - Firebase Auth UID
 * @returns {Promise<string|null>} Teacher ID thực hoặc null
 */
export const findTeacherIdByAuthUid = async (authUid) => {
  try {
    console.log("🔍 Finding teacher ID for auth UID:", authUid);

    const teachersCollection = collection(db, "teachers");

    // 1. Thử tìm theo uid field (thực tế trong database)
    console.log("🔍 Step 1: Finding by uid field...");
    const qByUid = query(teachersCollection, where("uid", "==", authUid));
    const uidSnapshot = await getDocs(qByUid);

    if (!uidSnapshot.empty) {
      const teacherId = uidSnapshot.docs[0].id;
      console.log("✅ Found teacher by uid:", teacherId);
      return teacherId;
    }

    // 2. Thử tìm theo authUid field (fallback cho data cũ)
    console.log("🔍 Step 2: Finding by authUid field (fallback)...");
    const qByAuthUid = query(
      teachersCollection,
      where("authUid", "==", authUid)
    );
    const authUidSnapshot = await getDocs(qByAuthUid);

    if (!authUidSnapshot.empty) {
      const teacherId = authUidSnapshot.docs[0].id;
      console.log("✅ Found teacher by authUid:", teacherId);
      return teacherId;
    }

    // 3. Thử xem authUid có phải là teacherId luôn không
    console.log("🔍 Step 3: Checking if authUid is already a teacherId...");
    try {
      const teacherDoc = await getDoc(doc(db, "teachers", authUid));
      if (teacherDoc.exists()) {
        console.log("✅ AuthUid is already a valid teacherId:", authUid);
        return authUid;
      }
    } catch (docError) {
      console.log("❌ AuthUid is not a valid teacherId");
    }

    // 4. Lấy tất cả teachers và log để debug
    console.log("🔍 Step 4: Getting all teachers for debug...");
    const allTeachers = await getTeachers();
    console.log(
      "📚 All teachers:",
      allTeachers.map((t) => ({
        id: t.id,
        name: t.name,
        uid: t.uid || "NO_UID",
        authUid: t.authUid || "NO_AUTH_UID",
      }))
    );

    // 5. Thử tìm theo tên (fallback cho data cũ)
    const possibleName = authUid.replace(/-/g, " ").toLowerCase();
    console.log("🔍 Step 5: Searching by name fallback:", possibleName);

    const teacherByName = allTeachers.find(
      (t) =>
        t.name.toLowerCase().includes(possibleName) ||
        possibleName.includes(t.name.toLowerCase())
    );

    if (teacherByName) {
      console.log(
        "✅ Found teacher by name match:",
        teacherByName.id,
        teacherByName.name
      );
      return teacherByName.id;
    }

    // 6. Nếu chỉ có 1 teacher, trả về teacher đó (cho development)
    if (allTeachers.length === 1) {
      console.log(
        "🔧 Only one teacher found, using it:",
        allTeachers[0].id,
        allTeachers[0].name
      );
      return allTeachers[0].id;
    }

    console.log("❌ No teacher found for auth UID:", authUid);
    return null;
  } catch (error) {
    console.error("❌ Error finding teacher ID:", error);
    return null;
  }
};

/**
 * Lấy danh sách tất cả giáo viên, sắp xếp theo tên.
 * @returns {Promise<Array>} Một mảng các đối tượng giáo viên.
 */
export const getTeachers = async () => {
  const teachersCollection = collection(db, "teachers");
  const q = query(teachersCollection, orderBy("name"));
  const querySnapshot = await getDocs(q);

  const teachers = [];
  for (const docSnapshot of querySnapshot.docs) {
    const teacherData = { id: docSnapshot.id, ...docSnapshot.data() };

    // Lấy thông tin các môn học dạy của giáo viên
    if (teacherData.subjectIds && Array.isArray(teacherData.subjectIds)) {
      const subjects = [];
      for (const subjectId of teacherData.subjectIds) {
        try {
          const subjectDoc = await getDoc(doc(db, subjectId));
          if (subjectDoc.exists()) {
            subjects.push(subjectDoc.data().name || "");
          }
        } catch (error) {
          console.error(
            `Không thể lấy môn học cho giáo viên ${teacherData.id}:`,
            error
          );
        }
      }
      teacherData.subjects = subjects;
    } else {
      teacherData.subjects = [];
    }

    teachers.push(teacherData);
  }

  return teachers;
};

/**
 * Lấy thông tin một giáo viên cụ thể theo ID
 * @param {string} teacherId ID của giáo viên
 * @returns {Promise<Object|null>} Thông tin giáo viên
 */
export const getTeacherById = async (teacherId) => {
  const teacherRef = doc(db, "teachers", teacherId);
  const teacherSnap = await getDoc(teacherRef);

  if (!teacherSnap.exists()) {
    return null;
  }

  const teacherData = { id: teacherId, ...teacherSnap.data() };

  // Lấy thông tin các môn học
  if (teacherData.subjectIds && Array.isArray(teacherData.subjectIds)) {
    const subjects = [];
    const subjectDetails = [];

    for (const subjectId of teacherData.subjectIds) {
      try {
        const subjectDoc = await getDoc(doc(db, subjectId));
        if (subjectDoc.exists()) {
          const subjectName = subjectDoc.data().name || "";
          subjects.push(subjectName);
          subjectDetails.push({
            id: subjectDoc.id,
            path: subjectId,
            name: subjectName,
            ...subjectDoc.data(),
          });
        }
      } catch (error) {
        console.error(
          `Không thể lấy môn học cho giáo viên ${teacherId}:`,
          error
        );
      }
    }

    teacherData.subjects = subjects;
    teacherData.subjectDetails = subjectDetails;
  } else {
    teacherData.subjects = [];
    teacherData.subjectDetails = [];
  }

  return teacherData;
};

/**
 * Thêm một giáo viên mới vào Firestore.
 * @param {object} teacherData Dữ liệu giáo viên từ form.
 * @returns {Promise<string>} ID của giáo viên vừa được tạo.
 */
export const addTeacher = async (teacherData) => {
  // Tạo ID giáo viên mới
  const newTeacherId = `teacher_${Date.now()}`;
  const teacherRef = doc(db, "teachers", newTeacherId);

  // Chuẩn bị dữ liệu giáo viên
  const dataToSave = {
    name: teacherData.name,
    avatar: teacherData.avatar || "",
    experience: teacherData.experience || "",
    rating: teacherData.rating || 0,
    email: teacherData.email || "",
    phone: teacherData.phone || "",
    gender: teacherData.gender || "",
    facilityId: teacherData.facilityId || null,
    subjectIds: teacherData.subjectIds || [],
  };

  await setDoc(teacherRef, dataToSave);
  return newTeacherId;
};

/**
 * Cập nhật thông tin của một giáo viên đã có.
 * @param {string} teacherId ID của giáo viên cần cập nhật.
 * @param {object} teacherData Dữ liệu mới cần cập nhật.
 */
export const updateTeacher = async (teacherId, teacherData) => {
  const teacherRef = doc(db, "teachers", teacherId);

  // Chuẩn bị dữ liệu cập nhật
  const dataToUpdate = {};

  // Chỉ cập nhật các trường được cung cấp
  if (teacherData.name !== undefined) dataToUpdate.name = teacherData.name;
  if (teacherData.avatar !== undefined)
    dataToUpdate.avatar = teacherData.avatar;
  if (teacherData.experience !== undefined)
    dataToUpdate.experience = teacherData.experience;
  if (teacherData.rating !== undefined)
    dataToUpdate.rating = teacherData.rating;
  if (teacherData.email !== undefined) dataToUpdate.email = teacherData.email;
  if (teacherData.phone !== undefined) dataToUpdate.phone = teacherData.phone;
  if (teacherData.gender !== undefined)
    dataToUpdate.gender = teacherData.gender;
  if (teacherData.facilityId !== undefined)
    dataToUpdate.facilityId = teacherData.facilityId;
  if (teacherData.subjectIds !== undefined)
    dataToUpdate.subjectIds = teacherData.subjectIds;

  await updateDoc(teacherRef, dataToUpdate);
};

/**
 * Thêm một môn học vào danh sách môn học của giáo viên
 * @param {string} teacherId ID của giáo viên
 * @param {string} subjectId ID hoặc đường dẫn đầy đủ của môn học
 */
export const addSubjectToTeacher = async (teacherId, subjectId) => {
  const teacherRef = doc(db, "teachers", teacherId);

  // Đảm bảo subjectId có định dạng đúng
  const fullSubjectPath = subjectId.includes("/")
    ? subjectId
    : `subjects/${subjectId}`;

  await updateDoc(teacherRef, {
    subjectIds: arrayUnion(fullSubjectPath),
  });
};

/**
 * Xóa một môn học khỏi danh sách môn học của giáo viên
 * @param {string} teacherId ID của giáo viên
 * @param {string} subjectId ID hoặc đường dẫn đầy đủ của môn học
 */
export const removeSubjectFromTeacher = async (teacherId, subjectId) => {
  const teacherRef = doc(db, "teachers", teacherId);

  // Đảm bảo subjectId có định dạng đúng
  const fullSubjectPath = subjectId.includes("/")
    ? subjectId
    : `subjects/${subjectId}`;

  await updateDoc(teacherRef, {
    subjectIds: arrayRemove(fullSubjectPath),
  });
};

/**
 * Xóa một giáo viên khỏi Firestore.
 * @param {string} teacherId ID của giáo viên cần xóa.
 */
export const deleteTeacher = async (teacherId) => {
  const teacherRef = doc(db, "teachers", teacherId);
  await deleteDoc(teacherRef);

  // Xóa các lịch dạy của giáo viên (nếu có)
  const scheduleCollection = collection(db, `teachers/${teacherId}/schedule`);
  const schedules = await getDocs(scheduleCollection);

  for (const scheduleDoc of schedules.docs) {
    await deleteDoc(scheduleDoc.ref);
  }
};

/**
 * Lấy lịch dạy của giáo viên từ Firestore.
 * @param {string} teacherId ID của giáo viên.
 * @returns {Promise<Array>} Một mảng các đối tượng lịch dạy được sắp xếp theo thời gian.
 */
export const getTeachingSchedule = async (teacherId) => {
  try {
    // Kiểm tra teacherId có hợp lệ không
    if (!teacherId || typeof teacherId !== "string") {
      throw new Error("Teacher ID không hợp lệ");
    }

    // Kiểm tra giáo viên có tồn tại không
    const teacherRef = doc(db, "teachers", teacherId);
    const teacherSnap = await getDoc(teacherRef);
    if (!teacherSnap.exists()) {
      throw new Error("Giáo viên không tồn tại");
    }

    const scheduleCollection = collection(db, `teachers/${teacherId}/schedule`);
    const q = query(scheduleCollection, orderBy("date"), orderBy("startTime"));
    const querySnapshot = await getDocs(q);

    const schedules = [];
    for (const docSnapshot of querySnapshot.docs) {
      const scheduleData = { id: docSnapshot.id, ...docSnapshot.data() };

      // Lấy thông tin bổ sung về lớp học nếu có
      if (scheduleData.classId) {
        try {
          const classDoc = await getDoc(
            doc(db, "classes", scheduleData.classId)
          );
          if (classDoc.exists()) {
            scheduleData.className = classDoc.data().name || "";
            scheduleData.classDetails = classDoc.data();
          }
        } catch (error) {
          console.error(
            `Không thể lấy thông tin lớp học ${scheduleData.classId}:`,
            error
          );
        }
      }

      // Lấy thông tin môn học nếu có
      if (scheduleData.subjectId) {
        try {
          const subjectDoc = await getDoc(doc(db, scheduleData.subjectId));
          if (subjectDoc.exists()) {
            scheduleData.subjectName = subjectDoc.data().name || "";
            scheduleData.subjectDetails = subjectDoc.data();
          }
        } catch (error) {
          console.error(
            `Không thể lấy thông tin môn học ${scheduleData.subjectId}:`,
            error
          );
        }
      }

      schedules.push(scheduleData);
    }

    return schedules;
  } catch (error) {
    console.error("Lỗi khi lấy lịch dạy:", error);
    throw error;
  }
};

/**
 * Lấy lịch dạy của giáo viên trong khoảng thời gian cụ thể
 * @param {string} teacherId ID của giáo viên
 * @param {string} startDate Ngày bắt đầu (định dạng YYYY-MM-DD)
 * @param {string} endDate Ngày kết thúc (định dạng YYYY-MM-DD)
 * @returns {Promise<Array>} Mảng lịch dạy trong khoảng thời gian
 */
export const getTeachingScheduleByDateRange = async (
  teacherId,
  startDate,
  endDate
) => {
  try {
    if (!teacherId || !startDate || !endDate) {
      throw new Error("Thiếu thông tin cần thiết");
    }

    const scheduleCollection = collection(db, `teachers/${teacherId}/schedule`);
    const q = query(
      scheduleCollection,
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date"),
      orderBy("startTime")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Lỗi khi lấy lịch dạy theo khoảng thời gian:", error);
    throw error;
  }
};

/**
 * Thêm lịch dạy mới cho giáo viên
 * @param {string} teacherId ID của giáo viên
 * @param {object} scheduleData Dữ liệu lịch dạy
 * @returns {Promise<string>} ID của lịch dạy vừa được tạo
 */
export const addTeachingSchedule = async (teacherId, scheduleData) => {
  try {
    if (!teacherId || !scheduleData) {
      throw new Error("Thiếu thông tin cần thiết");
    }

    // Kiểm tra xung đột lịch dạy
    const existingSchedules = await getTeachingScheduleByDateRange(
      teacherId,
      scheduleData.date,
      scheduleData.date
    );

    const hasConflict = existingSchedules.some((schedule) => {
      const existingStart = schedule.startTime;
      const existingEnd = schedule.endTime;
      const newStart = scheduleData.startTime;
      const newEnd = scheduleData.endTime;

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasConflict) {
      throw new Error("Trùng lịch dạy trong khung giờ này");
    }

    const scheduleCollection = collection(db, `teachers/${teacherId}/schedule`);
    const docRef = await addDoc(scheduleCollection, {
      ...scheduleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Lỗi khi thêm lịch dạy:", error);
    throw error;
  }
};

/**
 * Cập nhật lịch dạy của giáo viên
 * @param {string} teacherId ID của giáo viên
 * @param {string} scheduleId ID của lịch dạy
 * @param {object} updateData Dữ liệu cập nhật
 * @returns {Promise<void>}
 */
export const updateTeachingSchedule = async (
  teacherId,
  scheduleId,
  updateData
) => {
  try {
    if (!teacherId || !scheduleId || !updateData) {
      throw new Error("Thiếu thông tin cần thiết");
    }

    const scheduleRef = doc(db, `teachers/${teacherId}/schedule`, scheduleId);
    await updateDoc(scheduleRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật lịch dạy:", error);
    throw error;
  }
};

/**
 * Xóa lịch dạy của giáo viên
 * @param {string} teacherId ID của giáo viên
 * @param {string} scheduleId ID của lịch dạy
 * @returns {Promise<void>}
 */
export const deleteTeachingSchedule = async (teacherId, scheduleId) => {
  try {
    if (!teacherId || !scheduleId) {
      throw new Error("Thiếu thông tin cần thiết");
    }

    const scheduleRef = doc(db, `teachers/${teacherId}/schedule`, scheduleId);
    await deleteDoc(scheduleRef);
  } catch (error) {
    console.error("Lỗi khi xóa lịch dạy:", error);
    throw error;
  }
};

/**
 * Lấy danh sách môn học từ Firestore.
 * @returns {Promise<Array>} Một mảng các đối tượng môn học.
 */
export const getSubjects = async () => {
  const subjectsCollection = collection(db, "subjects");
  const querySnapshot = await getDocs(subjectsCollection);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    path: `subjects/${doc.id}`,
  }));
};

/**
 * Lấy thông tin chi tiết của một môn học theo ID
 * @param {string} subjectId ID của môn học
 * @returns {Promise<Object|null>} Thông tin môn học
 */
export const getSubjectById = async (subjectId) => {
  // Kiểm tra nếu đường dẫn đầy đủ được cung cấp
  const isFullPath = subjectId.includes("/");
  const docRef = isFullPath
    ? doc(db, subjectId)
    : doc(db, "subjects", subjectId);

  const subjectSnap = await getDoc(docRef);
  if (subjectSnap.exists()) {
    return { id: subjectSnap.id, ...subjectSnap.data() };
  }
  return null;
};

/**
 * Lấy danh sách giáo viên dạy một môn học cụ thể
 * @param {string} subjectId ID của môn học
 * @returns {Promise<Array>} Danh sách giáo viên
 */
export const getTeachersBySubject = async (subjectId) => {
  const teachersCollection = collection(db, "teachers");
  let q;

  // Tạo đường dẫn đầy đủ cho môn học
  const fullSubjectPath = subjectId.includes("/")
    ? subjectId
    : `subjects/${subjectId}`;

  q = query(
    teachersCollection,
    where("subjectIds", "array-contains", fullSubjectPath)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Lấy thời khóa biểu của một lớp học từ Firestore.
 * @param {string} classId ID của lớp học
 * @returns {Promise<Array>} Một mảng các đối tượng thời khóa biểu
 */
export const getClassTimetable = async (classId) => {
  const timetableCollection = collection(db, `classes/${classId}/timetable`);
  const querySnapshot = await getDocs(timetableCollection);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Lấy thời khóa biểu của lớp cho tuần cụ thể
 * @param {string} classId ID của lớp học
 * @param {string} weekId ID của tuần (định dạng "YYYY-Wnn")
 * @returns {Promise<Object|null>} Thông tin thời khóa biểu của tuần
 */
export const getClassTimetableByWeek = async (classId, weekId) => {
  const docRef = doc(db, `classes/${classId}/timetable`, weekId);
  const docSnapshot = await getDoc(docRef);
  if (docSnapshot.exists()) {
    return { id: docSnapshot.id, ...docSnapshot.data() };
  } else {
    return null;
  }
};

/**
 * Thêm mới một thời khóa biểu cho lớp học
 * @param {string} classId ID của lớp học
 * @param {string} weekId ID của tuần (định dạng "YYYY-Wnn")
 * @param {object} timetableData Dữ liệu thời khóa biểu
 * @returns {Promise<void>}
 */
export const addClassTimetable = async (classId, weekId, timetableData) => {
  const docRef = doc(db, `classes/${classId}/timetable`, weekId);
  await setDoc(docRef, timetableData);
};

/**
 * Cập nhật thời khóa biểu hiện có của lớp học
 * @param {string} classId ID của lớp học
 * @param {string} weekId ID của tuần (định dạng "YYYY-Wnn")
 * @param {object} timetableData Dữ liệu cập nhật
 * @returns {Promise<void>}
 */
export const updateClassTimetable = async (classId, weekId, timetableData) => {
  const docRef = doc(db, `classes/${classId}/timetable`, weekId);
  await updateDoc(docRef, timetableData);
};

/**
 * Thêm một slot thời khóa biểu vào tuần cụ thể
 * @param {string} classId ID của lớp học
 * @param {string} weekId ID của tuần
 * @param {object} slotData Thông tin về slot (ngày, tiết, môn học, giáo viên)
 * @returns {Promise<void>}
 */
export const addTimetableSlot = async (classId, weekId, slotData) => {
  const docRef = doc(db, `classes/${classId}/timetable`, weekId);
  const docSnapshot = await getDoc(docRef);

  if (docSnapshot.exists()) {
    // Nếu thời khóa biểu đã tồn tại
    const slots = docSnapshot.data().slots || [];
    slots.push(slotData);

    await updateDoc(docRef, { slots });
  } else {
    // Tạo mới thời khóa biểu
    await setDoc(docRef, {
      slots: [slotData],
      weekStart: slotData.weekStart || null,
      weekEnd: slotData.weekEnd || null,
    });
  }
};

/**
 * Xóa một slot thời khóa biểu từ tuần cụ thể
 * @param {string} classId ID của lớp học
 * @param {string} weekId ID của tuần
 * @param {string} slotId ID của slot cần xóa
 * @returns {Promise<void>}
 */
export const removeTimetableSlot = async (classId, weekId, slotId) => {
  const docRef = doc(db, `classes/${classId}/timetable`, weekId);
  const docSnapshot = await getDoc(docRef);

  if (docSnapshot.exists()) {
    const slots = docSnapshot.data().slots || [];
    const updatedSlots = slots.filter((slot) => slot.id !== slotId);

    await updateDoc(docRef, { slots: updatedSlots });
  }
};

/**
 * Lấy danh sách các lớp học
 * @returns {Promise<Array>} Mảng các đối tượng lớp học
 */
export const getClasses = async () => {
  const classesCollection = collection(db, "classes");
  const querySnapshot = await getDocs(classesCollection);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Lấy thông tin chi tiết của một lớp học
 * @param {string} classId ID của lớp học
 * @returns {Promise<Object|null>} Thông tin lớp học
 */
export const getClassById = async (classId) => {
  const classRef = doc(db, "classes", classId);
  const classSnap = await getDoc(classRef);

  if (classSnap.exists()) {
    return { id: classId, ...classSnap.data() };
  }
  return null;
};
