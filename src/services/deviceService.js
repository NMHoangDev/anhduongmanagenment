import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp
} from "firebase/firestore";

// Collection reference
const devicesCol = collection(db, "devices");

// Thêm thiết bị mới
export async function addDevice(device) {
  const docRef = await addDoc(devicesCol, {
    ...device,
    purchaseDate: device.purchaseDate ? Timestamp.fromDate(new Date(device.purchaseDate)) : null,
    warrantyExpiry: device.warrantyExpiry ? Timestamp.fromDate(new Date(device.warrantyExpiry)) : null,
    lastMaintenanceDate: device.lastMaintenanceDate ? Timestamp.fromDate(new Date(device.lastMaintenanceDate)) : null,
    nextMaintenanceDate: device.nextMaintenanceDate ? Timestamp.fromDate(new Date(device.nextMaintenanceDate)) : null,
  });
  return docRef.id;
}

// Lấy danh sách thiết bị
export async function getDevices() {
  const querySnapshot = await getDocs(devicesCol);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Lấy chi tiết thiết bị theo id
export async function getDeviceById(id) {
  const docRef = doc(db, "devices", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    throw new Error("Device not found");
  }
}

// Cập nhật thiết bị
export async function updateDevice(id, data) {
  const docRef = doc(db, "devices", id);
  // Chuyển đổi các trường ngày nếu có
  const updateData = { ...data };
  if (updateData.purchaseDate) updateData.purchaseDate = Timestamp.fromDate(new Date(updateData.purchaseDate));
  if (updateData.warrantyExpiry) updateData.warrantyExpiry = Timestamp.fromDate(new Date(updateData.warrantyExpiry));
  if (updateData.lastMaintenanceDate) updateData.lastMaintenanceDate = Timestamp.fromDate(new Date(updateData.lastMaintenanceDate));
  if (updateData.nextMaintenanceDate) updateData.nextMaintenanceDate = Timestamp.fromDate(new Date(updateData.nextMaintenanceDate));
  await updateDoc(docRef, updateData);
}

// Xóa thiết bị
export async function deleteDevice(id) {
  const docRef = doc(db, "devices", id);
  await deleteDoc(docRef);
} 