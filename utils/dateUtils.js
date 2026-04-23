// utils/dateUtils.js

export const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // Sunday = 0, Monday = 1, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // normalize to midnight
  return d;
};


export const getCurrentWeekDates = () => {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day; // Sunday = 0, shift to Monday
  monday.setDate(today.getDate() + diffToMonday);

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]); // YYYY-MM-DD format
  }
  return weekDates;
};

export const isMonday = (dateStr) => {
  const date = new Date(dateStr);
  return date.getDay() === 1;
};

export const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

export const formatDateReadable = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};
