import React, { useState, useEffect, useCallback } from "react";
import { db } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCopy,
  FaEdit,
  FaSave,
  FaTimes,
  FaSun,
  FaUtensils,
  FaLeaf,
  FaCalendarAlt,
} from "react-icons/fa";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
dayjs.extend(weekOfYear);

// Helper: Lấy thứ 2 đầu tuần của một ngày bất kỳ
const getMonday = (date) => {
  const d = dayjs(date);
  const dayOfWeek = d.day();
  return dayOfWeek === 0
    ? d.subtract(6, "day")
    : d.subtract(dayOfWeek - 1, "day");
};

// Helper: Lấy mảng 6 ngày từ thứ 2 đến thứ 7 của tuần
const getWeekDates = (date) => {
  const monday = getMonday(date);
  return Array.from({ length: 6 }, (_, i) => monday.add(i, "day").toDate());
};

// Helper: Lấy weekId chuẩn
const getWeekId = (date) => {
  const d = dayjs(date);
  return `${d.year()}-W${d.week()}`;
};

const days = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
};

const dayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const initialMenu = {
  monday: { breakfast: "", lunch: "", snack: "" },
  tuesday: { breakfast: "", lunch: "", snack: "" },
  wednesday: { breakfast: "", lunch: "", snack: "" },
  thursday: { breakfast: "", lunch: "", snack: "" },
  friday: { breakfast: "", lunch: "", snack: "" },
  saturday: { breakfast: "", lunch: "", snack: "" },
};

const MealItem = ({ icon, title, content, editMode, onContentChange }) => {
  const isLunch = title === "Trưa";

  // Convert array to string for textarea, handle string for others
  const editText = Array.isArray(content) ? content.join("\n") : content;

  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "#00796b",
          marginBottom: "8px",
        }}
      >
        {icon}
        <h4 style={{ margin: 0, fontSize: "18px" }}>{title}</h4>
      </div>
      {editMode ? (
        <textarea
          value={editText}
          onChange={(e) => onContentChange(e.target.value)}
          rows={isLunch ? 5 : 2}
          placeholder={
            isLunch
              ? "Nhập thực đơn bữa trưa, mỗi món một dòng..."
              : "Nhập thực đơn..."
          }
          style={{
            width: "100%",
            border: "2px solid #76c7c0",
            borderRadius: "10px",
            padding: "12px",
            fontSize: "16px",
            background: "#f0fdfa",
            boxShadow: "0 2px 8px rgba(118,199,192,0.08)",
            transition: "border 0.2s, box-shadow 0.2s",
            outline: "none",
            resize: "vertical",
            marginBottom: "8px",
          }}
          onFocus={(e) => (e.target.style.border = "2px solid #00796b")}
          onBlur={(e) => (e.target.style.border = "2px solid #76c7c0")}
        />
      ) : isLunch && Array.isArray(content) ? (
        <ul style={{ paddingLeft: "20px", margin: 0, color: "#555" }}>
          {content.map((item, index) => item && <li key={index}>{item}</li>)}
        </ul>
      ) : (
        <p style={{ margin: "0 0 0 5px", color: "#555" }}>{content || "-"}</p>
      )}
    </div>
  );
};

const MealCard = ({ day, meals, editMode, onMenuChange, date }) => {
  const formatDate = (date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Add null checks and default values
  const safeMeals = meals || { breakfast: "", lunch: "", snack: "" };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
        flex: "1 1 320px",
        minWidth: "320px",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #e9ecef",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header with date */}
      <div
        style={{
          background: "linear-gradient(135deg, #005f73 0%, #00796b 100%)",
          margin: "-24px -24px 20px -24px",
          padding: "16px 24px",
          color: "white",
          borderRadius: "20px 20px 0 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "600" }}>
            {days[day]}
          </h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              opacity: 0.9,
            }}
          >
            <FaCalendarAlt />
            {formatDate(date)}
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <MealItem
          icon={<FaSun style={{ color: "#ff9800" }} />}
          title="Sáng"
          content={safeMeals.breakfast}
          editMode={editMode}
          onContentChange={(value) => onMenuChange(day, "breakfast", value)}
        />
        <MealItem
          icon={<FaUtensils style={{ color: "#e91e63" }} />}
          title="Trưa"
          content={safeMeals.lunch}
          editMode={editMode}
          onContentChange={(value) => onMenuChange(day, "lunch", value)}
        />
        <MealItem
          icon={<FaLeaf style={{ color: "#4caf50" }} />}
          title="Xế"
          content={safeMeals.snack}
          editMode={editMode}
          onContentChange={(value) => onMenuChange(day, "snack", value)}
        />
      </div>
    </div>
  );
};

const FoodMenu = () => {
  // Khởi tạo tuần hiện tại là tuần chứa ngày hôm nay
  const [currentDate, setCurrentDate] = useState(() =>
    getMonday(new Date()).toDate()
  );
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedMenu, setEditedMenu] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const weekId = getWeekId(currentDate);
  const weekDates = getWeekDates(currentDate);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    const menuRef = doc(db, "menus", weekId);
    const menuSnap = await getDoc(menuRef);
    if (menuSnap.exists()) {
      setMenu(menuSnap.data().weeklyMenu);
    } else {
      setMenu(initialMenu);
    }
    setLoading(false);
  }, [weekId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleWeekChange = (weeksToAdd) => {
    setCurrentDate((prev) =>
      getMonday(dayjs(prev).add(weeksToAdd, "week")).toDate()
    );
  };

  const handleEnterEditMode = () => {
    // Xử lý cả trường hợp lunch là mảng hay chuỗi
    const menuToEdit = JSON.parse(JSON.stringify(menu));
    for (const day in menuToEdit) {
      if (Array.isArray(menuToEdit[day].lunch)) {
        menuToEdit[day].lunch = menuToEdit[day].lunch.join("\n");
      }
    }
    setEditedMenu(menuToEdit);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedMenu(null);
  };

  const handleMenuChange = (day, mealType, value) => {
    setEditedMenu((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [mealType]: value,
      },
    }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const finalMenuToSave = JSON.parse(JSON.stringify(editedMenu));
      // Chuyển đổi bữa trưa từ chuỗi nhiều dòng về mảng
      for (const day in finalMenuToSave) {
        if (typeof finalMenuToSave[day].lunch === "string") {
          finalMenuToSave[day].lunch = finalMenuToSave[day].lunch
            .split("\\n")
            .filter((item) => item.trim() !== "");
        }
      }

      const menuRef = doc(db, "menus", weekId);
      await setDoc(menuRef, { weeklyMenu: finalMenuToSave });
      await fetchMenu();
      setEditMode(false);
      alert("Đã lưu thực đơn thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu thực đơn: ", error);
      alert("Có lỗi xảy ra, không thể lưu thực đơn.");
    }
    setLoading(false);
  };

  // Sửa copyToNextWeek để không dùng getWeekNumber nữa
  const copyToNextWeek = async () => {
    if (!menu || Object.keys(menu).length === 0) {
      alert("Không có thực đơn để sao chép!");
      return;
    }

    const nextWeekDate = dayjs(currentDate).add(1, "week").toDate();
    const nextWeekId = getWeekId(nextWeekDate);

    if (
      window.confirm(
        `Bạn có muốn sao chép thực đơn này sang tuần ${dayjs(
          nextWeekDate
        ).week()} không?`
      )
    ) {
      try {
        const nextWeekMenuRef = doc(db, "menus", nextWeekId);
        await setDoc(nextWeekMenuRef, { weeklyMenu: menu });
        alert(`Đã sao chép thành công!`);
        handleWeekChange(1); // Tự động chuyển đến tuần tiếp theo để xem kết quả
      } catch (error) {
        console.error("Lỗi sao chép thực đơn: ", error);
        alert("Có lỗi xảy ra khi sao chép.");
      }
    }
  };

  const getWeekDisplayString = (d) => {
    const monday = getMonday(d);
    const startDate = monday;
    const endDate = monday.add(5, "day");
    const formatDate = (date) => dayjs(date).format("DD/MM");
    return `Tuần ${dayjs(monday).week()} (${formatDate(
      startDate
    )} - ${formatDate(endDate)})`;
  };
  const weekDisplay = getWeekDisplayString(currentDate);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "linear-gradient(135deg, #f0f8ff 0%, #e3f2fd 100%)",
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <Header title="Quản lý Thực Đơn Tuần" />
        {/* Control Bar */}
        <div
          style={{
            padding: isMobile ? "12px 8px" : "20px 40px",
            background: "rgba(255, 255, 255, 0.95)",
            borderBottom: "2px solid #e3f2fd",
            zIndex: 5,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? "18px" : "24px",
              fontWeight: "bold",
              color: "#005f73",
              marginBottom: isMobile ? "8px" : "15px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FaCalendarAlt />
            {weekDisplay}
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {editMode ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleSaveChanges}
                  style={{
                    background:
                      "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(0,123,255,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  <FaSave /> Lưu
                </button>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    background:
                      "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(220,53,69,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  <FaTimes /> Hủy
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleWeekChange(-1)}
                  style={{
                    background:
                      "linear-gradient(135deg, #6c757d 0%, #545b62 100%)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(108,117,125,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  <FaChevronLeft /> Tuần trước
                </button>
                <button
                  onClick={() => handleWeekChange(1)}
                  style={{
                    background:
                      "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(0,123,255,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  Tuần sau <FaChevronRight />
                </button>
                <button
                  onClick={copyToNextWeek}
                  style={{
                    background:
                      "linear-gradient(135deg, #28a745 0%, #1e7e34 100%)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(40,167,69,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  <FaCopy /> Sao chép
                </button>
                <button
                  onClick={handleEnterEditMode}
                  style={{
                    background:
                      "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: "0 4px 12px rgba(255,193,7,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  <FaEdit /> Chỉnh sửa
                </button>
              </div>
            )}
          </div>
        </div>

        <main
          style={{
            padding: isMobile ? "12px 0" : "32px 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            minHeight: isMobile ? "auto" : "calc(100vh - 120px)",
            background: "transparent",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: isMobile ? "100%" : "1100px",
              background: "#fff",
              borderRadius: isMobile ? "10px" : "18px",
              boxShadow: "0 6px 32px rgba(0,0,0,0.08)",
              padding: isMobile ? "10px 4px" : "32px",
              margin: isMobile ? "0 2px" : "0 24px",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                  fontSize: "18px",
                  color: "#005f73",
                }}
              >
                Đang tải thực đơn...
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: isMobile ? "12px" : "24px",
                }}
              >
                {dayKeys.map((day, index) => (
                  <MealCard
                    key={day}
                    day={day}
                    meals={
                      editMode
                        ? editedMenu && editedMenu[day]
                        : menu && menu[day]
                    }
                    editMode={editMode}
                    onMenuChange={handleMenuChange}
                    date={weekDates[index]}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FoodMenu;
