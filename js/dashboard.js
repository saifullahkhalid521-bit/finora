// dashboard.js — Dashboard UI Logic
import { formatCurrency, formatDateShort } from './formatters.js';
import { 
  calculatePeriodSpent, 
  calculateRemainingBudget, 
  calculateUnallocatedBuffer 
} from './calculations.js';

export function renderDashboard(period, transactions) {
  // Agar koi period nahi hai (fresh user), toh default 0 dikhao
  if (!period) {
    document.getElementById('hero-period').textContent = "No Active Period";
    document.getElementById('hero-budget-amount').textContent = formatCurrency(0);
    document.getElementById('hero-spent').textContent = formatCurrency(0);
    document.getElementById('hero-remaining').textContent = formatCurrency(0);
    document.getElementById('hero-savings').textContent = formatCurrency(0);
    return;
  }

  // Period Dates format karo (e.g., "20 Oct - 18 Nov")
  const start = formatDateShort(period.startDate);
  const end = formatDateShort(period.endDate);
  
  // UI Update karo
  document.getElementById('hero-period').textContent = `${start} - ${end}`;
  document.getElementById('hero-budget-amount').textContent = formatCurrency(period.budget);
  
  // Calculations call karo aur display karo
  const spent = calculatePeriodSpent(transactions, period.id);
  const remaining = calculateRemainingBudget(period, transactions);
  const unallocated = calculateUnallocatedBuffer(period);

  document.getElementById('hero-spent').textContent = formatCurrency(spent);
  document.getElementById('hero-remaining').textContent = formatCurrency(remaining);
  document.getElementById('hero-savings').textContent = formatCurrency(period.savings || 0);

  // Unallocated buffer ka warning (agar bacha hai toh)
  // Filhal hum console mein dikha rahe hain, baad mein UI mein dikhayenge
  if (unallocated > 0) {
    console.log(`Warning: ${formatCurrency(unallocated)} is unallocated.`);
  }
}