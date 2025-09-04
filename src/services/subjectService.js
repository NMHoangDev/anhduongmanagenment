import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Tạo mã môn học tự động từ tên môn học
 * @param {string} subjectName Tên môn học
 * @returns {string} Mã môn học được tạo tự động
 */
const generateSubjectCode = (subjectName) => {
  try {
    if (!subjectName) return `SUB${Date.now().toString().slice(-6)}`;

    // Chuyển đổi tiếng Việt có dấu thành không dấu
    const vietnameseMap = {
      à: "a",
      á: "a",
      ạ: "a",
      ả: "a",
      ã: "a",
      â: "a",
      ầ: "a",
      ấ: "a",
      ậ: "a",
      ẩ: "a",
      ẫ: "a",
      ă: "a",
      ằ: "a",
      ắ: "a",
      ặ: "a",
      ẳ: "a",
      ẵ: "a",
      è: "e",
      é: "e",
      ẹ: "e",
      ẻ: "e",
      ẽ: "e",
      ê: "e",
      ề: "e",
      ế: "e",
      ệ: "e",
      ể: "e",
      ễ: "e",
      ì: "i",
      í: "i",
      ị: "i",
      ỉ: "i",
      ĩ: "i",
      ò: "o",
      ó: "o",
      ọ: "o",
      ỏ: "o",
      õ: "o",
      ô: "o",
      ồ: "o",
      ố: "o",
      ộ: "o",
      ổ: "o",
      ỗ: "o",
      ơ: "o",
      ờ: "o",
      ớ: "o",
      ợ: "o",
      ở: "o",
      ỡ: "o",
      ù: "u",
      ú: "u",
      ụ: "u",
      ủ: "u",
      ũ: "u",
      ư: "u",
      ừ: "u",
      ứ: "u",
      ự: "u",
      ử: "u",
      ữ: "u",
      ỳ: "y",
      ý: "y",
      ỵ: "y",
      ỷ: "y",
      ỹ: "y",
      đ: "d",
    };

    // Loại bỏ dấu tiếng Việt
    const removeVietnameseTones = (str) => {
      return str
        .toLowerCase()
        .replace(
          /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g,
          (match) => vietnameseMap[match] || match
        );
    };

    // Tạo mã từ các từ đầu tiên
    const cleanName = removeVietnameseTones(subjectName);
    const words = cleanName.split(" ").filter((word) => word.length > 0);

    let prefix = "";
    if (words.length >= 2) {
      // Lấy 2-3 ký tự đầu từ mỗi từ
      prefix = words
        .slice(0, 3)
        .map((word) => {
          if (word.length === 1) return word;
          if (word.length <= 3) return word.substring(0, 2);
          return word.substring(0, 2);
        })
        .join("")
        .toUpperCase();
    } else {
      // Nếu chỉ có 1 từ, lấy 4 ký tự đầu
      prefix = words[0] ? words[0].substring(0, 4).toUpperCase() : "SUB";
    }

    // Giới hạn độ dài prefix
    if (prefix.length > 6) {
      prefix = prefix.substring(0, 6);
    }

    // Thêm timestamp để đảm bảo tính duy nhất
    const timestamp = Date.now().toString().slice(-4);

    return `${prefix}${timestamp}`;
  } catch (error) {
    console.error("Lỗi khi tạo mã môn học:", error);
    return `SUB${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Lấy danh sách tất cả môn học, sắp xếp theo tên.
 * @returns {Promise<Array>} Một mảng các đối tượng môn học.
 */
export const getSubjects = async () => {
  try {
    const subjectsCollection = collection(db, "subjects");
    const q = query(subjectsCollection, orderBy("name"));
    const querySnapshot = await getDocs(q);

    const subjects = [];
    for (const docSnapshot of querySnapshot.docs) {
      const subjectData = { id: docSnapshot.id, ...docSnapshot.data() };

      // Đếm số giáo viên dạy môn học này
      const teachersCount = await getTeacherCountBySubject(docSnapshot.id);
      subjectData.teacherCount = teachersCount;

      subjects.push(subjectData);
    }

    return subjects;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách môn học:", error);
    throw error;
  }
};

/**
 * Lấy thông tin một môn học cụ thể theo ID
 * @param {string} subjectId ID của môn học
 * @returns {Promise<Object|null>} Thông tin môn học
 */
export const getSubjectById = async (subjectId) => {
  try {
    if (!subjectId || typeof subjectId !== "string") {
      throw new Error("Subject ID không hợp lệ");
    }

    // Kiểm tra nếu đường dẫn đầy đủ được cung cấp
    const isFullPath = subjectId.includes("/");
    const docRef = isFullPath
      ? doc(db, subjectId)
      : doc(db, "subjects", subjectId);

    const subjectSnap = await getDoc(docRef);
    if (!subjectSnap.exists()) {
      return null;
    }

    const subjectData = { id: subjectSnap.id, ...subjectSnap.data() };

    // Lấy danh sách giáo viên dạy môn học này
    const teachers = await getTeachersBySubject(subjectId);
    subjectData.teachers = teachers;
    subjectData.teacherCount = teachers.length;

    return subjectData;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin môn học:", error);
    throw error;
  }
};

/**
 * Thêm một môn học mới vào Firestore.
 * @param {object} subjectData Dữ liệu môn học từ form.
 * @returns {Promise<string>} ID của môn học vừa được tạo.
 */
export const addSubject = async (subjectData) => {
  try {
    if (!subjectData || !subjectData.name) {
      throw new Error("Thiếu thông tin tên môn học");
    }

    // Kiểm tra tên môn học đã tồn tại chưa
    const existingSubjects = await getDocs(
      query(
        collection(db, "subjects"),
        where("name", "==", subjectData.name.trim())
      )
    );

    if (!existingSubjects.empty) {
      throw new Error("Tên môn học đã tồn tại");
    }

    // Tạo ID môn học mới
    const newSubjectId = `subject_${Date.now()}`;
    const subjectRef = doc(db, "subjects", newSubjectId);

    // Chuẩn bị dữ liệu môn học
    const dataToSave = {
      name: subjectData.name.trim(),
      code: subjectData.code?.trim() || generateSubjectCode(subjectData.name),
      description: subjectData.description?.trim() || "",
      gradeLevel: subjectData.gradeLevel || [], // Thêm trường khối học
      isActive:
        subjectData.isActive !== undefined ? subjectData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(subjectRef, dataToSave);
    return newSubjectId;
  } catch (error) {
    console.error("Lỗi khi thêm môn học:", error);
    throw error;
  }
};

/**
 * Cập nhật thông tin của một môn học đã có.
 * @param {string} subjectId ID của môn học cần cập nhật.
 * @param {object} subjectData Dữ liệu mới cần cập nhật.
 */
export const updateSubject = async (subjectId, subjectData) => {
  try {
    if (!subjectId || !subjectData) {
      throw new Error("Thiếu thông tin cần thiết");
    }

    // Kiểm tra tên môn học đã tồn tại chưa (ngoại trừ chính nó)
    if (subjectData.name) {
      const existingSubjects = await getDocs(
        query(
          collection(db, "subjects"),
          where("name", "==", subjectData.name.trim())
        )
      );

      const duplicateSubject = existingSubjects.docs.find(
        (doc) => doc.id !== subjectId
      );
      if (duplicateSubject) {
        throw new Error("Tên môn học đã tồn tại");
      }
    }

    const subjectRef = doc(db, "subjects", subjectId);

    // Chuẩn bị dữ liệu cập nhật
    const dataToUpdate = {
      updatedAt: new Date().toISOString(),
    };

    // Chỉ cập nhật các trường được cung cấp
    if (subjectData.name !== undefined)
      dataToUpdate.name = subjectData.name.trim();
    if (subjectData.code !== undefined)
      dataToUpdate.code = subjectData.code.trim();
    if (subjectData.description !== undefined)
      dataToUpdate.description = subjectData.description.trim();
    if (subjectData.isActive !== undefined)
      dataToUpdate.isActive = subjectData.isActive;

    await updateDoc(subjectRef, dataToUpdate);
  } catch (error) {
    console.error("Lỗi khi cập nhật môn học:", error);
    throw error;
  }
};

/**
 * Xóa một môn học khỏi Firestore.
 * @param {string} subjectId ID của môn học cần xóa.
 */
export const deleteSubject = async (subjectId) => {
  try {
    if (!subjectId) {
      throw new Error("Subject ID không hợp lệ");
    }

    // Kiểm tra xem có giáo viên nào đang dạy môn học này không
    const teachers = await getTeachersBySubject(subjectId);
    if (teachers.length > 0) {
      throw new Error(
        `Không thể xóa môn học này vì có ${teachers.length} giáo viên đang dạy`
      );
    }

    const subjectRef = doc(db, "subjects", subjectId);
    await deleteDoc(subjectRef);
  } catch (error) {
    console.error("Lỗi khi xóa môn học:", error);
    throw error;
  }
};

/**
 * Lấy danh sách giáo viên dạy một môn học cụ thể
 * @param {string} subjectId ID của môn học
 * @returns {Promise<Array>} Danh sách giáo viên
 */
export const getTeachersBySubject = async (subjectId) => {
  try {
    if (!subjectId) {
      return [];
    }

    const teachersCollection = collection(db, "teachers");

    // Tạo đường dẫn đầy đủ cho môn học
    const fullSubjectPath = subjectId.includes("/")
      ? subjectId
      : `subjects/${subjectId}`;

    const q = query(
      teachersCollection,
      where("subjectIds", "array-contains", fullSubjectPath)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Lỗi khi lấy danh sách giáo viên:", error);
    return [];
  }
};

/**
 * Đếm số giáo viên dạy một môn học cụ thể
 * @param {string} subjectId ID của môn học
 * @returns {Promise<number>} Số lượng giáo viên
 */
export const getTeacherCountBySubject = async (subjectId) => {
  try {
    const teachers = await getTeachersBySubject(subjectId);
    return teachers.length;
  } catch (error) {
    console.error("Lỗi khi đếm giáo viên:", error);
    return 0;
  }
};

/**
 * Tìm kiếm môn học theo tên
 * @param {string} searchTerm Từ khóa tìm kiếm
 * @returns {Promise<Array>} Danh sách môn học phù hợp
 */
export const searchSubjects = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim() === "") {
      return await getSubjects();
    }

    const subjects = await getSubjects();
    const searchLower = searchTerm.toLowerCase().trim();

    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(searchLower) ||
        subject.code.toLowerCase().includes(searchLower) ||
        subject.description.toLowerCase().includes(searchLower)
    );
  } catch (error) {
    console.error("Lỗi khi tìm kiếm môn học:", error);
    throw error;
  }
};

/**
 * Kích hoạt/vô hiệu hóa môn học
 * @param {string} subjectId ID của môn học
 * @param {boolean} isActive Trạng thái kích hoạt
 */
export const toggleSubjectStatus = async (subjectId, isActive) => {
  try {
    if (!subjectId) {
      throw new Error("Subject ID không hợp lệ");
    }

    const subjectRef = doc(db, "subjects", subjectId);
    await updateDoc(subjectRef, {
      isActive,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái môn học:", error);
    throw error;
  }
};
