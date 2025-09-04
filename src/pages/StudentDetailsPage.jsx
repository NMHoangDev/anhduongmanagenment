import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StudentDetailsMain from "../components/StudentDetailsMain";

const student = {
    name: "Jessia Rose",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    firstName: "Jessia",
    lastName: "Rose",
    fatherName: "Steve Jones",
    motherName: "Naomi Rose",
    fatherOccupation: "Graphic Designer",
    motherOccupation: "House Wife",
    dob: "07-08-2015",
    religion: "Christian",
    className: "Two",
    section: "Red",
    roll: "5648",
    admissionDate: "09-01-2021",
    primaryPhone: "(555) 123-4567",
    secondaryPhone: "(555) 987-6543",
    primaryEmail: "jessia12@gmail.com",
    secondaryEmail: "steve48@gmail.com",
    address: "Springfield",
    streetAddress: "Elm Street",
    houseName: "Meadowview",
    houseNumber: "62701",
};

export default function StudentDetailsPage() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f6fa', height: '100vh', overflow: 'hidden' }}>
            <div style={{ height: '100vh', position: 'sticky', top: 0, flexShrink: 0, zIndex: 2, background: '#fff' }}>
                <Sidebar />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100vh' }}>
                <Header />
                <StudentDetailsMain student={student} />
            </div>
        </div>
    );
} 