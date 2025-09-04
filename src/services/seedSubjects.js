import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const sampleSubjects = [
  {
    name: "Toán học",
    code: "TOAN2024",
    description:
      "Môn học cơ bản về toán học bao gồm đại số, hình học và giải tích",
    credits: 4,
    category: "Toán học",
    level: "THPT",
    duration: 120,
    objectives: [
      "Nắm vững các khái niệm cơ bản của toán học",
      "Phát triển tư duy logic và khả năng giải quyết vấn đề",
      "Ứng dụng toán học vào thực tế",
    ],
    requirements: "Hoàn thành chương trình toán THCS",
    isActive: true,
  },
  {
    name: "Ngữ văn",
    code: "NGUV2024",
    description: "Môn học về văn học và ngôn ngữ Việt Nam",
    credits: 3,
    category: "Ngữ văn",
    level: "THPT",
    duration: 90,
    objectives: [
      "Hiểu và cảm thụ các tác phẩm văn học",
      "Phát triển kỹ năng đọc hiểu và viết",
      "Yêu thích và tự hào về văn hóa dân tộc",
    ],
    requirements: "Hoàn thành chương trình ngữ văn THCS",
    isActive: true,
  },
  {
    name: "Tiếng Anh",
    code: "ENG01",
    description: "Môn học ngoại ngữ - Tiếng Anh giao tiếp và học thuật",
    credits: 3,
    category: "Tiếng Anh",
    level: "THPT",
    duration: 90,
    objectives: [
      "Giao tiếp cơ bản bằng tiếng Anh",
      "Đọc hiểu các văn bản tiếng Anh đơn giản",
      "Viết được các đoạn văn ngắn bằng tiếng Anh",
    ],
    requirements: "Có kiến thức cơ bản về tiếng Anh",
    isActive: true,
  },
  {
    name: "Vật lý",
    code: "PHYS01",
    description: "Môn học về các định luật và hiện tượng vật lý",
    credits: 3,
    category: "Vật lý",
    level: "THPT",
    duration: 90,
    objectives: [
      "Hiểu các định luật vật lý cơ bản",
      "Ứng dụng vật lý vào đời sống",
      "Phát triển tư duy khoa học",
    ],
    requirements: "Có nền tảng toán học tốt",
    isActive: true,
  },
  {
    name: "Hóa học",
    code: "CHEM01",
    description: "Môn học về cấu trúc, tính chất và phản ứng của các chất",
    credits: 3,
    category: "Hóa học",
    level: "THPT",
    duration: 90,
    objectives: [
      "Hiểu cấu trúc nguyên tử và phân tử",
      "Nắm vững các phản ứng hóa học cơ bản",
      "Ứng dụng hóa học trong đời sống",
    ],
    requirements: "Có kiến thức toán học và vật lý cơ bản",
    isActive: true,
  },
  {
    name: "Sinh học",
    code: "BIO01",
    description: "Môn học về sự sống và các quá trình sinh học",
    credits: 3,
    category: "Sinh học",
    level: "THPT",
    duration: 90,
    objectives: [
      "Hiểu về cấu trúc và chức năng của sinh vật",
      "Nắm vững các quá trình sinh học cơ bản",
      "Ý thức bảo vệ môi trường sinh thái",
    ],
    requirements: "Hoàn thành chương trình sinh học THCS",
    isActive: true,
  },
  {
    name: "Lịch sử",
    code: "HIST01",
    description: "Môn học về lịch sử Việt Nam và thế giới",
    credits: 2,
    category: "Lịch sử",
    level: "THPT",
    duration: 60,
    objectives: [
      "Hiểu về quá trình lịch sử dân tộc",
      "Rút ra bài học từ lịch sử",
      "Yêu nước và tự hào dân tộc",
    ],
    requirements: "Có kiến thức lịch sử cơ bản",
    isActive: true,
  },
  {
    name: "Địa lý",
    code: "GEO01",
    description: "Môn học về địa lý tự nhiên và kinh tế xã hội",
    credits: 2,
    category: "Địa lý",
    level: "THPT",
    duration: 60,
    objectives: [
      "Hiểu về địa lý tự nhiên Việt Nam và thế giới",
      "Nắm vững địa lý kinh tế xã hội",
      "Ý thức bảo vệ môi trường",
    ],
    requirements: "Có kiến thức cơ bản về địa lý",
    isActive: true,
  },
  {
    name: "Tin học",
    code: "IT01",
    description: "Môn học về công nghệ thông tin và lập trình cơ bản",
    credits: 2,
    category: "Tin học",
    level: "THPT",
    duration: 60,
    objectives: [
      "Sử dụng thành thạo máy tính",
      "Hiểu về lập trình cơ bản",
      "Ứng dụng công nghệ vào học tập",
    ],
    requirements: "Biết sử dụng máy tính cơ bản",
    isActive: true,
  },
  {
    name: "Thể dục",
    code: "PE01",
    description: "Môn học rèn luyện sức khỏe và thể chất",
    credits: 1,
    category: "Thể dục",
    level: "THPT",
    duration: 30,
    objectives: [
      "Phát triển thể lực toàn diện",
      "Rèn luyện ý chí và tinh thần",
      "Có thói quen tập luyện thể thao",
    ],
    requirements: "Sức khỏe bình thường",
    isActive: true,
  },
];

/**
 * Khởi tạo dữ liệu mẫu cho môn học
 */
export const seedSubjects = async () => {
  try {
    console.log("Bắt đầu khởi tạo dữ liệu môn học...");

    // Kiểm tra xem đã có dữ liệu chưa
    const subjectsCollection = collection(db, "subjects");
    const existingSubjects = await getDocs(subjectsCollection);

    if (!existingSubjects.empty) {
      console.log("Đã có dữ liệu môn học, bỏ qua việc khởi tạo");
      return;
    }

    // Thêm từng môn học
    for (const subject of sampleSubjects) {
      const subjectData = {
        ...subject,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(subjectsCollection, subjectData);
      console.log(`Đã thêm môn học: ${subject.name}`);
    }

    console.log("Khởi tạo dữ liệu môn học thành công!");
  } catch (error) {
    console.error("Lỗi khi khởi tạo dữ liệu môn học:", error);
    throw error;
  }
};
