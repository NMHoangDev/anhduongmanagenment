/**
 * Utility functions để xử lý ngày tháng và thời khóa biểu
 */

/**
 * Tính ngày thực tế dựa trên weekId và dayOfWeek
 * @param {string} weekId - ID tuần (format: "YYYY-W##")
 * @param {string} dayOfWeek - Thứ trong tuần ("monday", "tuesday", etc.)
 * @returns {string} - Ngày thực tế (format: "YYYY-MM-DD")
 */
export const calculateDateFromWeekAndDay = (weekId, dayOfWeek) => {
  try {
    console.log("🗓️ Calculating date from:", { weekId, dayOfWeek });

    // Parse weekId (ví dụ: "2025-W31")
    const [year, weekPart] = weekId.split('-W');
    const weekNumber = parseInt(weekPart);

    if (!year || !weekNumber) {
      throw new Error(`Invalid weekId format: ${weekId}`);
    }

    // Tính ngày đầu tuần (thứ 2) của tuần được chỉ định
    const firstDayOfYear = new Date(parseInt(year), 0, 1);
    
    // Tìm thứ 2 đầu tiên của năm
    const firstMonday = new Date(firstDayOfYear);
    const dayOfWeekFirstDay = firstDayOfYear.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysToAdd = dayOfWeekFirstDay === 0 ? 1 : (8 - dayOfWeekFirstDay);
    firstMonday.setDate(firstDayOfYear.getDate() + daysToAdd);

    // Tính thứ 2 của tuần cần tìm
    const targetWeekMonday = new Date(firstMonday);
    targetWeekMonday.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

    // Map dayOfWeek thành số ngày cần cộng thêm
    const dayOffsets = {
      'monday': 0,
      'tuesday': 1,
      'wednesday': 2,
      'thursday': 3,
      'friday': 4,
      'saturday': 5,
      'sunday': 6
    };

    const dayOffset = dayOffsets[dayOfWeek.toLowerCase()];
    if (dayOffset === undefined) {
      throw new Error(`Invalid dayOfWeek: ${dayOfWeek}`);
    }

    // Tính ngày cuối cùng
    const targetDate = new Date(targetWeekMonday);
    targetDate.setDate(targetWeekMonday.getDate() + dayOffset);

    // Format thành YYYY-MM-DD
    const formattedDate = targetDate.toISOString().split('T')[0];

    console.log("✅ Date calculated:", {
      weekId,
      dayOfWeek,
      calculatedDate: formattedDate,
      targetWeekMonday: targetWeekMonday.toISOString().split('T')[0]
    });

    return formattedDate;
  } catch (error) {
    console.error("❌ Error calculating date:", error);
    throw error;
  }
};

/**
 * Tính weekId từ ngày cụ thể
 * @param {string|Date} date - Ngày (YYYY-MM-DD hoặc Date object)
 * @returns {string} - weekId (format: "YYYY-W##")
 */
export const getWeekIdFromDate = (date) => {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const year = targetDate.getFullYear();
    
    // Tính số tuần trong năm
    const firstDayOfYear = new Date(year, 0, 1);
    const daysDifference = Math.floor((targetDate - firstDayOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((daysDifference + firstDayOfYear.getDay() + 1) / 7);
    
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error("❌ Error getting weekId from date:", error);
    throw error;
  }
};

/**
 * Lấy thứ trong tuần từ ngày
 * @param {string|Date} date - Ngày
 * @returns {string} - Thứ trong tuần ("monday", "tuesday", etc.)
 */
export const getDayOfWeekFromDate = (date) => {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const dayNames = [
      'sunday', 'monday', 'tuesday', 'wednesday', 
      'thursday', 'friday', 'saturday'
    ];
    
    return dayNames[targetDate.getDay()];
  } catch (error) {
    console.error("❌ Error getting day of week:", error);
    throw error;
  }
};

/**
 * Tính tuần hiện tại
 * @returns {string} - weekId của tuần hiện tại
 */
export const getCurrentWeekId = () => {
  return getWeekIdFromDate(new Date());
};

/**
 * Lấy tất cả ngày trong tuần từ weekId
 * @param {string} weekId - ID tuần
 * @returns {Object} - Object chứa tất cả ngày trong tuần
 */
export const getAllDatesInWeek = (weekId) => {
  try {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekDates = {};
    
    days.forEach(day => {
      weekDates[day] = calculateDateFromWeekAndDay(weekId, day);
    });
    
    return weekDates;
  } catch (error) {
    console.error("❌ Error getting all dates in week:", error);
    throw error;
  }
};

/**
 * Validate và format ngày cho timetable session
 * @param {string} weekId - ID tuần
 * @param {string} dayOfWeek - Thứ trong tuần
 * @returns {Object} - Object chứa thông tin ngày đã validate
 */
export const validateAndFormatTimetableDate = (weekId, dayOfWeek) => {
  try {
    const calculatedDate = calculateDateFromWeekAndDay(weekId, dayOfWeek);
    const weekDates = getAllDatesInWeek(weekId);
    
    return {
      date: calculatedDate,
      weekId,
      dayOfWeek: dayOfWeek.toLowerCase(),
      weekDates,
      isValid: true
    };
  } catch (error) {
    console.error("❌ Error validating timetable date:", error);
    return {
      date: null,
      weekId,
      dayOfWeek,
      weekDates: {},
      isValid: false,
      error: error.message
    };
  }
};
