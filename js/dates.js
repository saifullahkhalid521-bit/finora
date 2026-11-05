// dates.js — Date Utilities

// Start date aur custom days lo, aur end date return karo
export function calculateEndDate(startDateString, days = 30) {
  if (!startDateString) return '';
  const start = new Date(startDateString);
  
  // Agar user 30 din likhta hai, toh Start day (1) + 29 = 30 days total.
  // Isliye hum (days - 1) add karenge.
  const daysToAdd = days > 1 ? days - 1 : 0;
  start.setDate(start.getDate() + daysToAdd);
  
  // Return as YYYY-MM-DD
  return start.toISOString().split('T')[0];
}

// Today in YYYY-MM-DD
export function getTodayISO() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}