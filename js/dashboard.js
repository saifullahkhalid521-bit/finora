// dashboard.js — Dashboard UI Logic
import { formatCurrency, formatDateShort, parseCurrencyToPaise } from './formatters.js';
import { 
  calculatePeriodSpent, 
  calculateRemainingBudget, 
  calculateUnallocatedBuffer,
  calculateCategorySpent,
  calculateCategoryRemaining
} from './calculations.js';
import { updatePeriodBudget, updateCategoryAllocation, getState } from './state.js';

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

  // --- HERO CARD EDIT LOGIC ---
  const editBudgetBtn = document.getElementById('edit-budget-btn');
  if (editBudgetBtn) {
    // Button sirf ek baar event listener lage, isliye clone trick use kar rahe hain
    const newBtn = editBudgetBtn.cloneNode(true);
    editBudgetBtn.parentNode.replaceChild(newBtn, editBudgetBtn);
    
    newBtn.addEventListener('click', () => {
      document.getElementById('edit-budget-amount').value = period.budget / 100;
      document.getElementById('edit-savings-amount').value = (period.savings || 0) / 100;
      document.getElementById('edit-budget-modal').showModal();
    });
  }

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
  catList.innerHTML = ''; 
  
  const allocatedCatIds = Object.keys(period.categoryAllocations || {});
  
  if (allocatedCatIds.length === 0) {
    catList.innerHTML = '<p class="placeholder-text">No categories allocated yet.</p>';
  } else {
    allocatedCatIds.forEach(catId => {
      const category = categories.find(c => c.id === catId);
      if (!category) return;

      const allocated = period.categoryAllocations[catId];
      const catSpent = calculateCategorySpent(transactions, period.id, catId);
      const catRemaining = calculateCategoryRemaining(period, transactions, catId);
      
      let percentUsed = allocated > 0 ? (catSpent / allocated) * 100 : 0;
      if (percentUsed > 100) percentUsed = 100;

      const catItem = document.createElement('div');
      catItem.className = 'cat-item';
      catItem.innerHTML = `
        <div class="cat-info">
          <span class="cat-name">${category.name}</span>
          <div style="display: flex; gap: var(--space-sm); align-items: center;">
            <span class="cat-numbers">
              ${formatCurrency(catSpent)} / ${formatCurrency(allocated)}
            </span>
            <button class="secondary-btn edit-cat-btn" data-id="${catId}" data-name="${category.name}" data-amount="${allocated}" style="padding: 2px 6px; font-size: 0.75rem;">✏️ Edit</button>
          </div>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${percentUsed >= 100 ? 'danger' : ''}" style="width: ${percentUsed}%"></div>
        </div>
        <div class="cat-numbers" style="margin-top: var(--space-xs); text-align: right;">
          ${formatCurrency(catRemaining)} left
        </div>
      `;
      
      // Category Edit Button Logic
      const editCatBtn = catItem.querySelector('.edit-cat-btn');
      editCatBtn.addEventListener('click', () => {
        document.getElementById('edit-category-name').value = category.name;
        document.getElementById('edit-category-amount').value = allocated / 100;

        // Current category ID ko form mein save kar lo
        const catForm = document.getElementById('edit-category-form');
        catForm.setAttribute('data-cat-id', catId);

        document.getElementById('edit-category-modal').showModal();
      });

      catList.appendChild(catItem);
    });
  }
}