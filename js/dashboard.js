// dashboard.js — Dashboard UI Logic
import { formatCurrency, formatDateShort } from './formatters.js';
import { 
  calculatePeriodSpent, 
  calculateRemainingBudget, 
  calculateUnallocatedBuffer,
  calculateCategorySpent,
  calculateCategoryRemaining
} from './calculations.js';

export function renderDashboard(period, transactions, categories) {
  if (!period) return;

  // 1. Hero Card
  const start = formatDateShort(period.startDate);
  const end = formatDateShort(period.endDate);
  document.getElementById('hero-period').textContent = `${start} - ${end}`;
  document.getElementById('hero-budget-amount').textContent = formatCurrency(period.budget);
  
  const spent = calculatePeriodSpent(transactions, period.id);
  const remaining = calculateRemainingBudget(period, transactions);
  document.getElementById('hero-spent').textContent = formatCurrency(spent);
  document.getElementById('hero-remaining').textContent = formatCurrency(remaining);
  document.getElementById('hero-savings').textContent = formatCurrency(period.savings || 0);

  // 2. Unallocated Warning
  const unallocated = calculateUnallocatedBuffer(period);
  const warningBox = document.getElementById('unallocated-warning');
  if (unallocated > 0) {
    document.getElementById('unallocated-amount').textContent = formatCurrency(unallocated);
    warningBox.style.display = 'block';
  } else {
    warningBox.style.display = 'none';
  }

  // 3. Category List Rendering
  const catList = document.getElementById('category-list');
  catList.innerHTML = ''; // Clear previous

  // Sirf wahi categories dikhao jinke liye allocation hai
  const allocatedCatIds = Object.keys(period.categoryAllocations || {});
  
  if (allocatedCatIds.length === 0) {
    catList.innerHTML = '<p class="placeholder-text">No categories allocated yet. Click "+ Allocate Budget" to start.</p>';
    return;
  }

  allocatedCatIds.forEach(catId => {
    const category = categories.find(c => c.id === catId);
    if (!category) return;

    const allocated = period.categoryAllocations[catId];
    const catSpent = calculateCategorySpent(transactions, period.id, catId);
    const catRemaining = calculateCategoryRemaining(period, transactions, catId);
    
    // Percentage calculate karo
    let percentUsed = allocated > 0 ? (catSpent / allocated) * 100 : 0;
    if (percentUsed > 100) percentUsed = 100; // Cap at 100% for UI bar

    // HTML generate karo
    const catItem = document.createElement('div');
    catItem.className = 'cat-item';
    catItem.innerHTML = `
      <div class="cat-info">
        <span class="cat-name">${category.name}</span>
        <span class="cat-numbers">
          ${formatCurrency(catSpent)} / ${formatCurrency(allocated)}
        </span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${percentUsed >= 100 ? 'danger' : ''}" style="width: ${percentUsed}%"></div>
      </div>
      <div class="cat-numbers" style="margin-top: var(--space-xs); text-align: right;">
        ${formatCurrency(catRemaining)} left
      </div>
    `;
    catList.appendChild(catItem);
  });
}