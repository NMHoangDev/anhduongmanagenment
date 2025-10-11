import { collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Xóa toàn bộ document trong collection timetable
 * ⚠️ Không xóa collection, chỉ làm sạch dữ liệu cũ (seed data)
 */
export async function clearAllTimetableDocuments() {
  const colRef = collection(db, "timetable");
  const snapshot = await getDocs(colRef);

  if (snapshot.empty) {
    console.log("✅ Collection 'timetable' đã trống.");
    return 0;
  }

  console.log(`🔍 Đang xóa ${snapshot.size} documents trong 'timetable'...`);
  let deletedCount = 0;

  for (const docSnap of snapshot.docs) {
    try {
      await deleteDoc(docSnap.ref);
      deletedCount++;
      console.log(`🗑️ Đã xóa: ${docSnap.id}`);
    } catch (err) {
      console.error(`❌ Lỗi khi xóa ${docSnap.id}:`, err);
    }
  }

  console.log(`✅ Hoàn tất, đã xóa ${deletedCount} documents.`);
  return deletedCount;
}
