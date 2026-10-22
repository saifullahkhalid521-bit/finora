// formatters.js — Formatting Helpers

// Amount in paise -> ₹ format
export function formatCurrency(paise) {
  if (paise === null || paise === undefined) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(rupees);
}

// Input ₹ (e.g. 500.50) -> paise (50050)
export function parseCurrencyToPaise(inputValue) {
  const rupees = parseFloat(inputValue);
  if (isNaN(rupees) || rupees < 0) return 0;
  return Math.round(rupees * 100);
}

// ISO Date string (2026-10-20) -> Format (20 Oct 2026)
export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

// Short format (20 Oct)
export function formatDateShort(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short'
  }).format(date);
}

// Today's date in ISO format (YYYY-MM-DD)
export function getTodayISO() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}