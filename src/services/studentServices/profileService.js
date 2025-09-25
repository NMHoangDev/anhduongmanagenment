import { db } from "../firebase";
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

  // create parent id
  const parentId = `${studentId}_parent`;
  const parentRef = doc(parentsCol, parentId);

  const studentDataWithParent = {
    ...studentData,
    parentId,
  };
  await setDoc(studentRef, studentDataWithParent);

  const parentDataWithStudent = {
    ...parentData,
    studentId,
  };
  await setDoc(parentRef, parentDataWithStudent);
}

export async function getStudent(studentId) {
  const studentSnap = await getDoc(doc(studentsCol, studentId));
  return studentSnap.exists() ? studentSnap.data() : null;
}

export async function updateStudent(studentId, updates) {
  const studentRef = doc(studentsCol, studentId);
  await updateDoc(studentRef, updates);
}

export async function deleteStudent(studentId) {
  await deleteDoc(doc(studentsCol, studentId));
}

export async function getAllStudents() {
  const snapshot = await getDocs(studentsCol);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setAttendance(studentId, dateString, attendanceData) {
  const attendanceRef = doc(
    db,
    `students/${studentId}/attendance/${dateString}`
  );
  await setDoc(attendanceRef, attendanceData);
}

export async function getAttendance(studentId, dateString) {
  const attendanceSnap = await getDoc(
    doc(db, `students/${studentId}/attendance/${dateString}`)
  );
  return attendanceSnap.exists() ? attendanceSnap.data() : null;
}

export async function setTuition(studentId, academicYear, tuitionData) {
  const tuitionRef = doc(db, `students/${studentId}/tuition/${academicYear}`);
  await setDoc(tuitionRef, tuitionData);
}

export async function getTuition(studentId, academicYear) {
  const tuitionSnap = await getDoc(
    doc(db, `students/${studentId}/tuition/${academicYear}`)
  );
  return tuitionSnap.exists() ? tuitionSnap.data() : null;
}

const profileService = {
  createStudent,
  getStudent,
  updateStudent,
  deleteStudent,
  getAllStudents,
  setAttendance,
  getAttendance,
  setTuition,
  getTuition,
};

export default profileService;
