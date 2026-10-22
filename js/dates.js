// dates.js — Date Utilities

// Start date lo aur 30-day period ka end date (29 din baad) return karo
export function calculateEndDate(startDateString) {
  if (!startDateString) return '';
  const start = new Date(startDateString);
  // Add 29 days (Start day + 29 = 30 days total)
  start.setDate(start.getDate() + 29);
  
  // Return as YYYY-MM-DD
  return start.toISOString().split('T')[0];
}

// Today in YYYY-MM-DD
export function getTodayISO() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}