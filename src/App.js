import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Students from "./pages/Students";
import StudentDetailsPage from "./pages/StudentDetailsPage";
import Dashboard from "./pages/Dashboard";
import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import TuitionFee from "./pages/TuitionFee";
import Profile from "./pages/Profile";
import TeacherSalary from "./pages/TeacherSalary";
import Timetable from "./pages/Timetable";
import Login from "./pages/Login";
import TestLogin from "./TestLogin";
import RegisterTest from "./RegisterTest";
import Register from "./pages/Register";
import TeacherClassManagement from "./pages/teacher/ClassManagement";
import TeacherAssignment from "./pages/teacher/Assignment";
import StudentAttendance from "./pages/teacher/StudentAttendance";
// Import demo users utility
import "./utils/createDemoUsers";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherTimetable from "./pages/teacher/Timetable";
import TeacherGrade from "./pages/teacher/Grade";
import TeacherMaterial from "./pages/teacher/Material";
import TeacherNotification from "./pages/teacher/Notification";
import TeacherProfile from "./pages/teacher/Profile";
import FoodMenu from "./pages/FoodMenu";
import Facility from "./pages/Facility";
import Classes from "./pages/Classes";
import Parents from "./pages/Parents";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/test" element={<TestLogin />} />
          <Route path="/register-test" element={<RegisterTest />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route
            path="/classes"
            element={
              <ProtectedRoute adminOnly>
                <Classes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute adminOnly>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teachers"
            element={
              <ProtectedRoute adminOnly>
                <Teachers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute adminOnly>
                <Students />
              </ProtectedRoute>
            }
          />

          <Route
            path="/subjects"
            element={
              <ProtectedRoute adminOnly>
                <Subjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/all-student"
            element={
              <ProtectedRoute adminOnly>
                <Students />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-details"
            element={
              <ProtectedRoute adminOnly>
                <StudentDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tuition-fee"
            element={
              <ProtectedRoute adminOnly>
                <TuitionFee />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher-salary"
            element={
              <ProtectedRoute adminOnly>
                <TeacherSalary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/timetable"
            element={
              <ProtectedRoute adminOnly>
                <Timetable />
              </ProtectedRoute>
            }
          />

          <Route
            path="/food-menu"
            element={
              <ProtectedRoute adminOnly>
                <FoodMenu />
              </ProtectedRoute>
            }
          />

          <Route
            path="/facility"
            element={
              <ProtectedRoute adminOnly>
                <Facility />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parents"
            element={
              <ProtectedRoute adminOnly>
                <Parents />
              </ProtectedRoute>
            }
          />

          {/* Shared routes (accessible by both admin and specific roles) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/teacher-attendance"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/student-attendance"
            element={
              <ProtectedRoute teacherOnly>
                <StudentAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/class"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherClassManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/assignment"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherAssignment />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/timetable"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherTimetable />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/grade"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherGrade />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/material"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherMaterial />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/notification"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherNotification />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherProfile />
              </ProtectedRoute>
            }
          />

          {/* Student routes (for future implementation) */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <h2>Trang học sinh đang phát triển</h2>
                  <p>
                    Chức năng dành cho học sinh sẽ được bổ sung trong tương lai.
                  </p>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
