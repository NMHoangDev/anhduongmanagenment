import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
// Import các hàm thông báo
import {
  sendClassNotification,
  sendClassReminder,
} from "../teacherServices/classManagementService";

const normalizeId = (value) => {
  if (!value) return "";
  const str = String(value).trim();
  const parts = str.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : str;
};

// Format hạn nộp hiển thị tiếng Việt
const _formatDeadlineVi = (deadline) => {
  if (!deadline) return "Không có hạn";
  const d = deadline instanceof Date ? deadline : new Date(deadline);
  if (Number.isNaN(d.getTime())) return "Không có hạn";
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Các trạng thái visibility có thể có
export const EXAM_VISIBILITY_STATUS = {
  PUBLIC: "public", // Công khai - tất cả có thể thấy
  ONLY_CLASS: "onlyClass", // Chỉ học sinh trong lớp
  PRIVATE: "private", // Chỉ giáo viên tạo ra mới thấy
};

// Các trạng thái bài kiểm tra
export const EXAM_TEST_STATUS = {
  DRAFT: "draft", // Bản nháp
  PUBLISHED: "published", // Đã phát hành
  CLOSED: "closed", // Đã đóng
};

// Kiểm tra quyền tạo bài test cho lớp
export const checkTeacherPermissionForClass = async (
  teacherId,
  classId,
  subjectId = null
) => {
  const classRef = doc(db, "classes", classId);
  const classSnap = await getDoc(classRef);

  if (!classSnap.exists()) {
    throw new Error("Không tìm thấy lớp học");
  }

  const classData = classSnap.data();

  // Nếu là GVCN thì được tạo bài cho bất kỳ môn nào
  if (classData.homeRoomTeacherId === teacherId) {
    return {
      isAllowed: true,
      role: "homeroom",
      className: classData.name,
    };
  }

  // Nếu là GV bộ môn, kiểm tra có được phân công dạy môn này trong lớp không
  if (subjectId) {
    const assignmentsRef = collection(db, "class_assignments");
    const q = query(
      assignmentsRef,
      where("classId", "==", classId),
      where("teacherId", "==", teacherId),
      where("subjectId", "==", subjectId)
    );
    const assignSnap = await getDocs(q);

    if (!assignSnap.empty) {
      return {
        isAllowed: true,
        role: "subject",
        className: classData.name,
      };
    }
  }

  return {
    isAllowed: false,
    role: null,
    className: classData.name,
  };
};

// Kiểm tra quyền chỉnh sửa bài test
export const checkTeacherPermissionForExamTest = async (
  teacherId,
  examTestId
) => {
  const examRef = doc(db, "examTests", examTestId);
  const examSnap = await getDoc(examRef);

  if (!examSnap.exists()) {
    throw new Error("Không tìm thấy bài kiểm tra");
  }

  const examData = examSnap.data();

  // Kiểm tra xem có phải người tạo không
  if (examData.createdBy === teacherId) {
    return {
      isAllowed: true,
      isCreator: true,
      examData,
    };
  }

  // Kiểm tra quyền theo lớp và môn học
  const permission = await checkTeacherPermissionForClass(
    teacherId,
    examData.classId,
    examData.subjectId
  );

  return {
    isAllowed: permission.isAllowed,
    isCreator: false,
    examData,
    classPermission: permission,
  };
};

// Lấy danh sách lớp mà giáo viên có thể tạo bài test
export const getClassesForExamCreation = async (teacherId) => {
  const classes = [];

  // 1. Lấy lớp chủ nhiệm
  const homeroomQuery = query(
    collection(db, "classes"),
    where("homeRoomTeacherId", "==", teacherId)
  );
  const homeroomSnap = await getDocs(homeroomQuery);
  homeroomSnap.forEach((doc) => {
    classes.push({
      id: doc.id,
      ...doc.data(),
      role: "homeroom",
      displayName: `${doc.data().name} (Chủ nhiệm)`,
    });
  });

  // 2. Lấy lớp được phân công dạy
  const assignmentsQuery = query(
    collection(db, "class_assignments"),
    where("teacherId", "==", teacherId)
  );
  const assignSnap = await getDocs(assignmentsQuery);

  const assignedClassIds = new Set();
  const classSubjects = {}; // Lưu thông tin môn học theo lớp

  assignSnap.forEach((doc) => {
    const data = doc.data();
    assignedClassIds.add(data.classId);

    if (!classSubjects[data.classId]) {
      classSubjects[data.classId] = [];
    }
    classSubjects[data.classId].push(data.subjectId);
  });

  // Lấy thông tin chi tiết các lớp được phân công
  for (const classId of assignedClassIds) {
    if (!classes.find((c) => c.id === classId)) {
      // Tránh trùng với lớp chủ nhiệm
      const classDoc = await getDoc(doc(db, "classes", classId));
      if (classDoc.exists()) {
        // Lấy tên môn học
        const subjectNames = [];
        for (const subjectId of classSubjects[classId]) {
          const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
          if (subjectDoc.exists()) {
            subjectNames.push(subjectDoc.data().name);
          }
        }

        classes.push({
          id: classDoc.id,
          ...classDoc.data(),
          role: "subject",
          assignedSubjects: classSubjects[classId],
          displayName: `${classDoc.data().name} (${subjectNames.join(", ")})`,
        });
      }
    }
  }

  return classes.sort((a, b) => {
    // Ưu tiên lớp chủ nhiệm lên đầu
    if (a.role === "homeroom" && b.role !== "homeroom") return -1;
    if (b.role === "homeroom" && a.role !== "homeroom") return 1;
    return a.name.localeCompare(b.name);
  });
};

// Lấy môn học mà giáo viên được phân công dạy trong lớp
export const getSubjectsForTeacherInClass = async (teacherId, classId) => {
  // Kiểm tra xem có phải GVCN không
  const classDoc = await getDoc(doc(db, "classes", classId));
  if (classDoc.exists() && classDoc.data().homeRoomTeacherId === teacherId) {
    // GVCN có thể tạo bài cho tất cả môn học
    const allSubjectsQuery = query(collection(db, "subjects"), orderBy("name"));
    const allSubjectsSnap = await getDocs(allSubjectsQuery);

    return allSubjectsSnap.docs.map((doc) => ({
      subjectId: doc.id,
      ...doc.data(),
      isHomeroom: true,
    }));
  }

  // Nếu không phải GVCN, chỉ lấy môn được phân công
  const assignmentsQuery = query(
    collection(db, "class_assignments"),
    where("teacherId", "==", teacherId),
    where("classId", "==", classId)
  );
  const snap = await getDocs(assignmentsQuery);

  const subjectIds = [];
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.subjectId && !subjectIds.includes(data.subjectId)) {
      subjectIds.push(data.subjectId);
    }
  });

  // Lấy thông tin chi tiết môn học
  const subjects = [];
  for (const subjectId of subjectIds) {
    const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
    if (subjectDoc.exists()) {
      subjects.push({
        subjectId: subjectDoc.id,
        ...subjectDoc.data(),
        isHomeroom: false,
      });
    }
  }

  return subjects.sort((a, b) => a.name.localeCompare(b.name));
};

// Lấy danh sách bài kiểm tra mà giáo viên có thể xem
export const getExamTestsForTeacher = async (teacherId, options = {}) => {
  const { classId, status, includeDraft = true, limit = 50 } = options;

  try {
    // Lấy danh sách lớp mà giáo viên có quyền
    const availableClasses = await getClassesForExamCreation(teacherId);
    const classIds = availableClasses.map((c) => c.id);

    if (classIds.length === 0) {
      return [];
    }

    let filters = [];

    // Nếu chỉ định lớp cụ thể
    if (classId) {
      if (!classIds.includes(classId)) {
        throw new Error("Bạn không có quyền xem bài kiểm tra của lớp này");
      }
      filters.push(where("classId", "==", normalizeId(classId)));
    } else {
      // Lấy tất cả lớp mà giáo viên có quyền (sử dụng array-contains-any nếu <= 10 lớp)
      if (classIds.length <= 10) {
        filters.push(where("classId", "in", classIds));
      } else {
        // Nếu > 10 lớp, cần split thành nhiều query
        // Tạm thời chỉ lấy 10 lớp đầu
        filters.push(where("classId", "in", classIds.slice(0, 10)));
      }
    }

    // Thêm filter theo trạng thái
    if (status) {
      filters.push(where("status", "==", status));
    }

    if (!includeDraft) {
      filters.push(where("status", "!=", "draft"));
    }

    const qx = query(
      collection(db, "examTests"),
      ...filters,
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(qx);
    const examTests = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() || {}),
      // Thêm thông tin lớp
      className:
        availableClasses.find((c) => c.id === d.data().classId)?.name ||
        "Không xác định",
    }));

    return examTests;
  } catch (error) {
    console.error("Error getting exam tests for teacher:", error);
    throw error;
  }
};

// Lấy thống kê bài kiểm tra theo giáo viên
export const getExamTestStatsForTeacher = async (teacherId) => {
  try {
    const examTests = await getExamTestsForTeacher(teacherId, {
      includeDraft: true,
    });

    const stats = {
      total: examTests.length,
      published: examTests.filter((test) => test.status === "published").length,
      draft: examTests.filter((test) => test.status === "draft").length,
      closed: examTests.filter((test) => test.status === "closed").length,
      expired: examTests.filter((test) => {
        if (!test.deadline) return false;
        const deadline = test.deadline.toDate
          ? test.deadline.toDate()
          : new Date(test.deadline);
        return new Date() > deadline;
      }).length,
      totalSubmissions: examTests.reduce(
        (sum, test) => sum + (test.studentSubmissions?.length || 0),
        0
      ),
      // Thống kê theo visibility
      public: examTests.filter(
        (test) => test.visibility === EXAM_VISIBILITY_STATUS.PUBLIC
      ).length,
      onlyClass: examTests.filter(
        (test) => test.visibility === EXAM_VISIBILITY_STATUS.ONLY_CLASS
      ).length,
      private: examTests.filter(
        (test) => test.visibility === EXAM_VISIBILITY_STATUS.PRIVATE
      ).length,
    };

    return stats;
  } catch (error) {
    console.error("Error getting exam stats:", error);
    throw error;
  }
};

/**
 * Kiểm tra và tự động đóng các bài kiểm tra quá hạn
 * @param {string} teacherId - ID giáo viên (tùy chọn, để lọc chỉ bài của giáo viên đó)
 * @returns {Promise<Array>} - Danh sách các bài đã được đóng
 */
export const autoCloseExpiredExamTests = async (teacherId = null) => {
  try {
    let filters = [
      where("status", "==", EXAM_TEST_STATUS.PUBLISHED),
      where("deadline", "!=", null),
    ];

    // Nếu có teacherId, chỉ check bài của giáo viên đó
    if (teacherId) {
      filters.push(where("createdBy", "==", teacherId));
    }

    const q = query(collection(db, "examTests"), ...filters);
    const snap = await getDocs(q);

    const now = new Date();
    const expiredTests = [];
    const updatePromises = [];

    snap.forEach((docSnap) => {
      const examData = docSnap.data();
      const deadline = examData.deadline?.toDate
        ? examData.deadline.toDate()
        : new Date(examData.deadline);

      // Kiểm tra nếu quá hạn
      if (deadline && now > deadline) {
        expiredTests.push({
          id: docSnap.id,
          title: examData.title,
          deadline: deadline,
          classId: examData.classId,
        });

        // Chuẩn bị update
        const updatePromise = updateDoc(doc(db, "examTests", docSnap.id), {
          status: EXAM_TEST_STATUS.CLOSED,
          closedAt: serverTimestamp(),
          closedReason: "auto_expired",
          updatedAt: serverTimestamp(),
        });

        updatePromises.push(updatePromise);
      }
    });

    // Thực hiện tất cả updates
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(
        `Đã tự động đóng ${expiredTests.length} bài kiểm tra quá hạn`
      );
    }

    return expiredTests;
  } catch (error) {
    console.error("Error auto-closing expired exam tests:", error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái bài kiểm tra
 * @param {string} examTestId - ID của bài kiểm tra
 * @param {string} teacherId - ID của giáo viên thực hiện thay đổi
 * @param {string} newStatus - Trạng thái mới: 'draft', 'published', 'closed'
 * @param {object} options - Các tùy chọn bổ sung
 * @returns {Promise<boolean>}
 */
export const updateExamTestStatus = async (
  examTestId,
  teacherId,
  newStatus,
  options = {}
) => {
  if (!examTestId) {
    throw new Error("Thiếu ID bài kiểm tra");
  }

  if (!teacherId) {
    throw new Error("Thiếu ID giáo viên");
  }

  // Kiểm tra status hợp lệ
  const validStatuses = Object.values(EXAM_TEST_STATUS);
  if (!validStatuses.includes(newStatus)) {
    throw new Error(
      `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(", ")}`
    );
  }

  try {
    // Kiểm tra quyền
    const permission = await checkTeacherPermissionForExamTest(
      teacherId,
      examTestId
    );

    if (!permission.isAllowed) {
      throw new Error("Bạn không có quyền chỉnh sửa bài kiểm tra này");
    }

    const examData = permission.examData;
    const oldStatus = examData.status || EXAM_TEST_STATUS.DRAFT;

    // Nếu trạng thái không thay đổi
    if (oldStatus === newStatus) {
      return true;
    }

    // Kiểm tra luồng chuyển đổi trạng thái hợp lệ
    const isValidTransition = validateStatusTransition(oldStatus, newStatus);
    if (!isValidTransition.valid) {
      throw new Error(isValidTransition.message);
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData = {
      status: newStatus,
      updatedAt: serverTimestamp(),
      statusUpdatedBy: teacherId,
      statusUpdatedAt: serverTimestamp(),
    };

    // Thêm thông tin bổ sung theo trạng thái
    switch (newStatus) {
      case EXAM_TEST_STATUS.PUBLISHED:
        updateData.publishedAt = serverTimestamp();
        updateData.publishedBy = teacherId;
        break;

      case EXAM_TEST_STATUS.CLOSED:
        updateData.closedAt = serverTimestamp();
        updateData.closedBy = teacherId;
        updateData.closedReason = options.reason || "manual_close";
        break;

      case EXAM_TEST_STATUS.DRAFT:
        // Khi chuyển về draft, xóa thông tin publish/close
        updateData.publishedAt = null;
        updateData.publishedBy = null;
        updateData.closedAt = null;
        updateData.closedBy = null;
        updateData.closedReason = null;
        break;
    }

    // Thêm ghi chú nếu có
    if (options.note) {
      updateData.statusChangeNote = options.note;
    }

    // Cập nhật database
    const examRef = doc(db, "examTests", examTestId);
    await updateDoc(examRef, updateData);

    // Gửi thông báo khi publish (nếu không phải private)
    if (
      newStatus === EXAM_TEST_STATUS.PUBLISHED &&
      oldStatus === EXAM_TEST_STATUS.DRAFT &&
      examData.visibility !== EXAM_VISIBILITY_STATUS.PRIVATE &&
      options.sendNotification !== false
    ) {
      try {
        const titleText = `Bài kiểm tra mới: ${examData.title}`;
        const deadlineText = _formatDeadlineVi(examData.deadline);
        const content = `Bài kiểm tra đã được phát hành. Hạn: ${deadlineText}`;

        await sendClassNotification(teacherId, examData.classId, {
          title: titleText,
          content,
          senderId: teacherId,
          type: "exam",
          recipients: [],
          relatedType: "examTest",
          relatedId: examTestId,
          subjectId: examData.subjectId || null,
          deadline: examData.deadline || null,
        });
      } catch (notificationError) {
        console.warn("Gửi thông báo thất bại:", notificationError.message);
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating exam test status:", error);
    throw error;
  }
};

/**
 * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái
 * @param {string} oldStatus - Trạng thái cũ
 * @param {string} newStatus - Trạng thái mới
 * @returns {object} - {valid: boolean, message: string}
 */
const validateStatusTransition = (oldStatus, newStatus) => {
  // Luồng chuyển đổi hợp lệ:
  // draft -> published
  // published -> closed
  // published -> draft (nếu chưa có ai làm)
  // closed -> published (mở lại)

  const transitions = {
    [EXAM_TEST_STATUS.DRAFT]: [EXAM_TEST_STATUS.PUBLISHED],
    [EXAM_TEST_STATUS.PUBLISHED]: [
      EXAM_TEST_STATUS.CLOSED,
      EXAM_TEST_STATUS.DRAFT,
    ],
    [EXAM_TEST_STATUS.CLOSED]: [EXAM_TEST_STATUS.PUBLISHED],
  };

  const allowedTransitions = transitions[oldStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      message: `Không thể chuyển từ "${oldStatus}" sang "${newStatus}"`,
    };
  }

  return { valid: true, message: "OK" };
};

/**
 * Lấy lịch sử thay đổi trạng thái của bài kiểm tra
 * @param {string} examTestId - ID của bài kiểm tra
 * @returns {Promise<object>}
 */
export const getExamTestStatusHistory = async (examTestId) => {
  if (!examTestId) {
    throw new Error("Thiếu ID bài kiểm tra");
  }

  try {
    const examRef = doc(db, "examTests", examTestId);
    const examSnap = await getDoc(examRef);

    if (!examSnap.exists()) {
      throw new Error("Không tìm thấy bài kiểm tra");
    }

    const examData = examSnap.data();

    return {
      currentStatus: examData.status || EXAM_TEST_STATUS.DRAFT,
      createdAt: examData.createdAt,
      createdBy: examData.createdBy,

      // Thông tin publish
      publishedAt: examData.publishedAt || null,
      publishedBy: examData.publishedBy || null,

      // Thông tin close
      closedAt: examData.closedAt || null,
      closedBy: examData.closedBy || null,
      closedReason: examData.closedReason || null,

      // Thông tin cập nhật gần nhất
      lastStatusUpdatedBy: examData.statusUpdatedBy || examData.createdBy,
      lastStatusUpdatedAt: examData.statusUpdatedAt || examData.createdAt,
      statusChangeNote: examData.statusChangeNote || null,

      // Kiểm tra tự động đóng
      isExpired: examData.deadline
        ? new Date() >
          (examData.deadline.toDate?.() || new Date(examData.deadline))
        : false,
    };
  } catch (error) {
    console.error("Error getting status history:", error);
    throw error;
  }
};

/**
 * Lấy danh sách bài kiểm tra sắp hết hạn
 * @param {string} teacherId - ID giáo viên
 * @param {number} hoursBeforeDeadline - Số giờ trước deadline (mặc định 24h)
 * @returns {Promise<Array>}
 */
export const getExamTestsNearDeadline = async (
  teacherId,
  hoursBeforeDeadline = 24
) => {
  try {
    const examTests = await getExamTestsForTeacher(teacherId, {
      status: EXAM_TEST_STATUS.PUBLISHED,
    });

    const now = new Date();
    const warningTime = hoursBeforeDeadline * 60 * 60 * 1000; // Convert to milliseconds

    const nearDeadlineTests = examTests.filter((test) => {
      if (!test.deadline) return false;

      const deadline = test.deadline.toDate
        ? test.deadline.toDate()
        : new Date(test.deadline);

      const timeUntilDeadline = deadline.getTime() - now.getTime();

      // Chỉ lấy những bài còn hạn nhưng sắp hết hạn
      return timeUntilDeadline > 0 && timeUntilDeadline <= warningTime;
    });

    return nearDeadlineTests.map((test) => ({
      ...test,
      timeUntilDeadline: test.deadline.toDate
        ? test.deadline.toDate().getTime() - now.getTime()
        : new Date(test.deadline).getTime() - now.getTime(),
    }));
  } catch (error) {
    console.error("Error getting tests near deadline:", error);
    throw error;
  }
};

/**
 * Chỉnh sửa tình trạng hiển thị bài kiểm tra
 * @param {string} examTestId - ID của bài kiểm tra
 * @param {string} teacherId - ID của giáo viên thực hiện thay đổi
 * @param {string} newVisibility - Trạng thái mới: 'public', 'onlyClass', 'private'
 * @param {object} options - Các tùy chọn bổ sung
 * @returns {Promise<boolean>}
 */
export const updateExamTestVisibility = async (
  examTestId,
  teacherId,
  newVisibility,
  options = {}
) => {
  if (!examTestId) {
    throw new Error("Thiếu ID bài kiểm tra");
  }

  if (!teacherId) {
    throw new Error("Thiếu ID giáo viên");
  }

  // Kiểm tra visibility hợp lệ
  const validVisibilities = Object.values(EXAM_VISIBILITY_STATUS);
  if (!validVisibilities.includes(newVisibility)) {
    throw new Error(
      `Trạng thái không hợp lệ. Chỉ chấp nhận: ${validVisibilities.join(", ")}`
    );
  }

  try {
    // Kiểm tra quyền
    const permission = await checkTeacherPermissionForExamTest(
      teacherId,
      examTestId
    );

    if (!permission.isAllowed) {
      throw new Error("Bạn không có quyền chỉnh sửa bài kiểm tra này");
    }

    const examData = permission.examData;
    const oldVisibility =
      examData.visibility || EXAM_VISIBILITY_STATUS.ONLY_CLASS;

    // Nếu trạng thái không thay đổi
    if (oldVisibility === newVisibility) {
      return true;
    }

    // Cập nhật database
    const examRef = doc(db, "examTests", examTestId);
    const updateData = {
      visibility: newVisibility,
      updatedAt: serverTimestamp(),
      visibilityUpdatedBy: teacherId,
      visibilityUpdatedAt: serverTimestamp(),
    };

    // Thêm ghi chú nếu có
    if (options.note) {
      updateData.visibilityChangeNote = options.note;
    }

    await updateDoc(examRef, updateData);

    // Gửi thông báo nếu chuyển từ private/onlyClass sang public
    if (
      (oldVisibility === EXAM_VISIBILITY_STATUS.PRIVATE ||
        oldVisibility === EXAM_VISIBILITY_STATUS.ONLY_CLASS) &&
      newVisibility === EXAM_VISIBILITY_STATUS.PUBLIC &&
      options.sendNotification !== false
    ) {
      try {
        const titleText = `Bài kiểm tra mới: ${examData.title}`;
        const deadlineText = _formatDeadlineVi(examData.deadline);
        const content = `Bài kiểm tra đã được công khai. Hạn: ${deadlineText}`;

        await sendClassNotification(teacherId, examData.classId, {
          title: titleText,
          content,
          senderId: teacherId,
          type: "exam",
          recipients: [],
          relatedType: "examTest",
          relatedId: examTestId,
          subjectId: examData.subjectId || null,
          deadline: examData.deadline || null,
        });
      } catch (notificationError) {
        console.warn("Gửi thông báo thất bại:", notificationError.message);
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating exam test visibility:", error);
    throw error;
  }
};

/**
 * Lấy lịch sử thay đổi visibility của bài kiểm tra
 * @param {string} examTestId - ID của bài kiểm tra
 * @returns {Promise<object>}
 */
export const getExamTestVisibilityHistory = async (examTestId) => {
  if (!examTestId) {
    throw new Error("Thiếu ID bài kiểm tra");
  }

  try {
    const examRef = doc(db, "examTests", examTestId);
    const examSnap = await getDoc(examRef);

    if (!examSnap.exists()) {
      throw new Error("Không tìm thấy bài kiểm tra");
    }

    const examData = examSnap.data();

    return {
      currentVisibility:
        examData.visibility || EXAM_VISIBILITY_STATUS.ONLY_CLASS,
      lastUpdatedBy: examData.visibilityUpdatedBy || examData.createdBy,
      lastUpdatedAt: examData.visibilityUpdatedAt || examData.createdAt,
      changeNote: examData.visibilityChangeNote || null,
      createdAt: examData.createdAt,
      createdBy: examData.createdBy,
    };
  } catch (error) {
    console.error("Error getting visibility history:", error);
    throw error;
  }
};

/**
 * Tạo bài kiểm tra trắc nghiệm mới
 */
export const createExamTest = async ({
  title,
  description = "",
  classId,
  subjectId,
  createdBy,
  deadline,
  durationMinutes = null,
  questions = [],
  visibility = EXAM_VISIBILITY_STATUS.ONLY_CLASS, // Mặc định chỉ lớp
  status = EXAM_TEST_STATUS.PUBLISHED, // Mặc định phát hành
}) => {
  if (!title) throw new Error("Tiêu đề bắt buộc.");
  if (!classId) throw new Error("Thiếu classId.");
  if (!createdBy) throw new Error("Thiếu createdBy.");
  if (!Array.isArray(questions) || !questions.length) {
    throw new Error("Bài test phải có ít nhất 1 câu hỏi.");
  }

  // Kiểm tra visibility hợp lệ
  const validVisibilities = Object.values(EXAM_VISIBILITY_STATUS);
  if (!validVisibilities.includes(visibility)) {
    visibility = EXAM_VISIBILITY_STATUS.ONLY_CLASS;
  }

  // Kiểm tra status hợp lệ
  const validStatuses = Object.values(EXAM_TEST_STATUS);
  if (!validStatuses.includes(status)) {
    status = EXAM_TEST_STATUS.PUBLISHED;
  }

  // Kiểm tra quyền
  const permission = await checkTeacherPermissionForClass(
    createdBy,
    classId,
    subjectId
  );
  if (!permission.isAllowed) {
    throw new Error("Bạn không có quyền tạo bài test cho lớp này");
  }

  const payload = {
    title,
    description,
    classId: normalizeId(classId),
    subjectId: subjectId ? normalizeId(subjectId) : null,
    createdBy: normalizeId(createdBy),
    deadline: deadline ? new Date(deadline) : null,
    durationMinutes: durationMinutes || null,
    questions: questions.map((q, idx) => ({
      id: q.id || `q_${idx + 1}`,
      question: q.question || "",
      options: Array.isArray(q.options) ? q.options : [],
      correctIndexes: Array.isArray(q.correctIndexes) ? q.correctIndexes : [],
      explanation: q.explanation || "",
      points:
        typeof q.points === "number" && !Number.isNaN(q.points) ? q.points : 1,
    })),
    totalPoints: questions.reduce((sum, q) => {
      const pts =
        typeof q.points === "number" && !Number.isNaN(q.points) ? q.points : 1;
      return sum + pts;
    }, 0),
    visibility,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    studentSubmissions: [], // Mảng chứa bài nộp của học sinh
  };

  // Thêm thông tin theo status
  if (status === EXAM_TEST_STATUS.PUBLISHED) {
    payload.publishedAt = serverTimestamp();
    payload.publishedBy = createdBy;
  }

  const docRef = await addDoc(collection(db, "examTests"), payload);

  // Tạo thông báo sau khi tạo bài (chỉ khi publish và không phải private)
  if (
    payload.status === EXAM_TEST_STATUS.PUBLISHED &&
    visibility !== EXAM_VISIBILITY_STATUS.PRIVATE
  ) {
    try {
      const titleText = `Làm bài trắc nghiệm: ${title}`;
      const deadlineText = _formatDeadlineVi(payload.deadline);
      const content = `Hạn: ${deadlineText}. Vui lòng vào mục Bài kiểm tra để làm.`;

      if (permission.role === "homeroom") {
        // GVCN có thể gửi thông báo trực tiếp
        await sendClassNotification(payload.createdBy, payload.classId, {
          title: titleText,
          content,
          senderId: payload.createdBy,
          type: "exam",
          recipients: [],
          relatedType: "examTest",
          relatedId: docRef.id,
          subjectId: payload.subjectId || null,
          deadline: payload.deadline || null,
        });
      } else {
        // GV bộ môn gửi reminder
        await sendClassReminder(payload.classId, {
          title: titleText,
          content,
          senderId: payload.createdBy,
          dueDate: payload.deadline || null,
          relatedType: "examTest",
          relatedId: docRef.id,
          subjectId: payload.subjectId || null,
        });
      }
    } catch (err) {
      console.warn("Tạo thông báo cho bài test thất bại:", err?.message || err);
    }
  }

  return docRef.id;
};

export const updateExamTest = async (examId, updates) => {
  if (!examId) throw new Error("Thiếu examId.");
  const ref = doc(db, "examTests", examId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Không tìm thấy bài kiểm tra.");

  const payload = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (payload.questions) {
    payload.questions = payload.questions.map((q, idx) => ({
      id: q.id || `q_${idx + 1}`,
      question: q.question || "",
      options: Array.isArray(q.options) ? q.options : [],
      correctIndexes: Array.isArray(q.correctIndexes) ? q.correctIndexes : [],
      explanation: q.explanation || "",
      points:
        typeof q.points === "number" && !Number.isNaN(q.points) ? q.points : 1,
    }));
    payload.totalPoints = payload.questions.reduce(
      (sum, q) => sum + (q.points || 0),
      0
    );
  }

  if (payload.deadline) {
    payload.deadline = new Date(payload.deadline);
  }

  // Kiểm tra visibility hợp lệ nếu có update
  if (payload.visibility) {
    const validVisibilities = Object.values(EXAM_VISIBILITY_STATUS);
    if (!validVisibilities.includes(payload.visibility)) {
      delete payload.visibility; // Bỏ qua nếu không hợp lệ
    }
  }

  // Kiểm tra status hợp lệ nếu có update
  if (payload.status) {
    const validStatuses = Object.values(EXAM_TEST_STATUS);
    if (!validStatuses.includes(payload.status)) {
      delete payload.status; // Bỏ qua nếu không hợp lệ
    }
  }

  await updateDoc(ref, payload);
  return true;
};

export const deleteExamTest = async (examId) => {
  if (!examId) throw new Error("Thiếu examId.");
  await deleteDoc(doc(db, "examTests", examId));
  return true;
};

export const getExamTestById = async (examId) => {
  if (!examId) return null;
  const snap = await getDoc(doc(db, "examTests", examId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() || {}) };
};

export const listExamTestsByClass = async ({
  classId,
  status,
  includeDraft = false,
  visibility = null,
  limit = 50,
}) => {
  const filters = [where("classId", "==", normalizeId(classId))];

  if (status) filters.push(where("status", "==", status));
  if (!includeDraft) {
    filters.push(where("status", "!=", "draft"));
  }

  // Thêm filter theo visibility
  if (
    visibility &&
    Object.values(EXAM_VISIBILITY_STATUS).includes(visibility)
  ) {
    filters.push(where("visibility", "==", visibility));
  }

  const qx = query(
    collection(db, "examTests"),
    ...filters,
    orderBy("status"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(qx);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
};


