// app.js — Entry point
import { setupBackup , setupSavingsBackup } from './backup.js';
import { setupTheme } from './theme.js';
import { getState, createPeriod, addCategoryAllocation, addCustomCategory, addTransaction, updatePeriodBudget, updateCategoryAllocation, addSavings } from './state.js';
import { renderDashboard } from './dashboard.js';
import { renderHistory } from './history.js';
import { renderSavingsPage } from './savings.js';
import { parseCurrencyToPaise, formatCurrency } from './formatters.js';
import { getTodayISO } from './dates.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Finora loaded");

  const newPeriodContainer = document.getElementById('new-period-container');
  const newPeriodForm = document.getElementById('new-period-form');
  const heroCard = document.querySelector('.budget-hero');
  
  // Category UI Elements
  const toggleCatFormBtn = document.getElementById('toggle-category-form-btn');
  const catFormContainer = document.getElementById('category-form-container');
  const categoryForm = document.getElementById('category-form');
  const categorySelect = document.getElementById('category-select');

  document.getElementById('start-date').value = getTodayISO();

  // --- Category Form Toggle ---
  toggleCatFormBtn.addEventListener('click', () => {
    if (catFormContainer.style.display === 'none') {
      catFormContainer.style.display = 'block';
      toggleCatFormBtn.textContent = 'Cancel';
      
      const state = getState();
      const currentPeriod = state.periods.find(p => p.id === state.settings.currentPeriodId);
      
      categorySelect.innerHTML = '<option value="">-- Select --</option>';
      
      const catsToUse = (state.categories && state.categories.length > 0) 
        ? state.categories 
        : [
            { id: 'cat_personal', name: 'Personal' },
            { id: 'cat_diet', name: 'Diet' },
            { id: 'cat_misc', name: 'Misc' }
          ];

      catsToUse.forEach(cat => {
        const isAllocated = currentPeriod.categoryAllocations && currentPeriod.categoryAllocations[cat.id];
        if (!isAllocated) {
          const option = document.createElement('option');
          option.value = cat.id;
          option.textContent = cat.name;
          categorySelect.appendChild(option);
        }
      });
    } else {
      catFormContainer.style.display = 'none';
      toggleCatFormBtn.textContent = '+ Allocate Budget';
    }
  });

  // --- New Custom Category Form Submit ---
  const newCategoryForm = document.getElementById('new-category-form');
  newCategoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('new-category-name');
    const name = nameInput.value.trim();

    if (name) {
      addCustomCategory(name);
      nameInput.value = ''; 
      if (catFormContainer.style.display === 'block') {
        toggleCatFormBtn.click(); 
        toggleCatFormBtn.click(); 
      }
    }
  });

  // --- Category Form Submit ---
  categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const catId = categorySelect.value;
    const amountPaise = parseCurrencyToPaise(document.getElementById('category-amount').value);

    if (!catId || amountPaise <= 0) {
      alert("Please select a category and enter a valid amount.");
      return;
    }

    addCategoryAllocation(catId, amountPaise);
    
    catFormContainer.style.display = 'none';
    toggleCatFormBtn.textContent = '+ Allocate Budget';
    categoryForm.reset();
    updateUI();
  });

  // --- Main Update UI Function ---
  window.updateUI = function() { 
    const state = getState();
    let currentPeriod = null;
    if (state.settings.currentPeriodId) {
      currentPeriod = state.periods.find(p => p.id === state.settings.currentPeriodId);
    }

    const categorySection = document.getElementById('category-section');

    if (currentPeriod) {
      heroCard.style.display = 'block';
      categorySection.style.display = 'block';
      newPeriodContainer.style.display = 'none';
      
      renderDashboard(currentPeriod, state.transactions, state.categories);

      const txnDateInput = document.getElementById('txn-date');
      if (!txnDateInput.value) txnDateInput.value = getTodayISO();
      
      const txnCategorySelect = document.getElementById('txn-category');
      if(txnCategorySelect) {
        txnCategorySelect.innerHTML = '<option value="">-- Select Category --</option>'; 
        state.categories.forEach(cat => {
          if (currentPeriod.categoryAllocations && currentPeriod.categoryAllocations[cat.id]) {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            txnCategorySelect.appendChild(opt);
          }
        });
      }
    } else {
      heroCard.style.display = 'none';
      categorySection.style.display = 'none';
      newPeriodContainer.style.display = 'block';
    }
  }

  // --- New Period Form Submit ---
  newPeriodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const startDate = document.getElementById('start-date').value;
    const days = parseInt(document.getElementById('period-days').value) || 30; 
    const budgetPaise = parseCurrencyToPaise(document.getElementById('total-budget').value);
    const savingsPaise = document.getElementById('savings-amount').value ? parseCurrencyToPaise(document.getElementById('savings-amount').value) : 0;

    if (budgetPaise <= 0) {
      alert("Budget must be greater than 0");
      return;
    }
    if (days < 1) {
      alert("Days must be at least 1.");
      return;
    }

    createPeriod(startDate, budgetPaise, savingsPaise, days); 
    
    newPeriodForm.reset();
    document.getElementById('start-date').value = getTodayISO();
    document.getElementById('period-days').value = 30; 
    
    updateUI();
  });

  // --- Transaction Form Logic ---
  const txnForm = document.getElementById('transaction-form');
  const txnTypeSelect = document.getElementById('txn-type');
  const txnCategoryGroup = document.getElementById('txn-category-group');
  const txnCategorySelect = document.getElementById('txn-category');
  
  if(txnTypeSelect) {
    txnTypeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'income') {
        txnCategoryGroup.style.display = 'none';
        txnCategorySelect.removeAttribute('required');
      } else {
        txnCategoryGroup.style.display = 'flex';
        txnCategorySelect.setAttribute('required', 'true');
      }
    });
  }

  if(txnForm) {
    txnForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const type = txnTypeSelect.value;
      const amountInput = document.getElementById('txn-amount').value;
      const categoryId = txnCategorySelect.value;
      const date = document.getElementById('txn-date').value;
      const desc = document.getElementById('txn-desc').value;

      if (type === 'expense' && !categoryId) {
        alert("Please select a category for expense.");
        return;
      }

      const amountPaise = parseCurrencyToPaise(amountInput);
      if (amountPaise <= 0) {
        alert("Amount must be greater than 0.");
        return;
      }

      const success = addTransaction(type, amountPaise, categoryId, date, desc);
      
      if (success) {
        alert("Transaction saved successfully!");
        txnForm.reset();
        document.getElementById('txn-date').value = getTodayISO();
        document.querySelector('.nav-btn[data-target="dashboard-section"]').click();
        updateUI();
      } else {
        alert("Error: No active period found.");
      }
    });
  }

  // --- History Filters Logic ---
  document.getElementById('filter-type').addEventListener('change', () => {
    const state = getState();
    let currentPeriod = state.periods.find(p => p.id === state.settings.currentPeriodId);
    if (currentPeriod) renderHistory(state.categories, currentPeriod.id);
  });

  document.getElementById('filter-search').addEventListener('input', () => {
    const state = getState();
    let currentPeriod = state.periods.find(p => p.id === state.settings.currentPeriodId);
    if (currentPeriod) renderHistory(state.categories, currentPeriod.id);
  });

  // --- Dashboard update listener ---
  document.addEventListener('transactionUpdated', () => {
    updateUI(); // <-- Ye wapas add kar diya
  });

  // Initial Render
  updateUI(); 

  // --- Navigation Logic ---
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.page-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sections.forEach(sec => sec.classList.remove('active-section'));
      const targetId = btn.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        targetSection.classList.add('active-section');
        
        if (targetId === 'history-section') {
          const state = getState();
          let currentPeriod = state.periods.find(p => p.id === state.settings.currentPeriodId);
          if (currentPeriod) renderHistory(state.categories, currentPeriod.id);
        }

        if (targetId === 'savings-section') {
          renderSavingsPage();
        }
      }
    });
  });

  // --- Edit Budget Form Submit ---
  const editBudgetForm = document.getElementById('edit-budget-form');
  editBudgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newBudgetPaise = parseCurrencyToPaise(document.getElementById('edit-budget-amount').value);
    const newSavingsPaise = document.getElementById('edit-savings-amount').value ? parseCurrencyToPaise(document.getElementById('edit-savings-amount').value) : 0;
    
    if (newBudgetPaise <= 0) {
      alert("Budget must be greater than 0.");
      return;
    }
    
    updatePeriodBudget(newBudgetPaise, newSavingsPaise);
    document.getElementById('edit-budget-modal').close();
    updateUI();
  });

  // --- Edit Category Form Submit ---
  const editCategoryForm = document.getElementById('edit-category-form');
  editCategoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const catId = editCategoryForm.getAttribute('data-cat-id');
    const newAmountPaise = parseCurrencyToPaise(document.getElementById('edit-category-amount').value);
    
    if (!catId || newAmountPaise < 0) {
      alert("Please enter a valid amount.");
      return;
    }
    
    updateCategoryAllocation(catId, newAmountPaise);
    document.getElementById('edit-category-modal').close();
    updateUI();
  });

  // --- Setup Backup Buttons ---
  setupBackup();
  setupSavingsBackup();
   
  // --- Setup Theme ---
  setupTheme();

  // --- Savings Form Logic ---
  const savingsModal = document.getElementById('savings-modal');
  const savingsForm = document.getElementById('savings-form');
  const savingsModalTitle = document.getElementById('savings-modal-title');
  let currentSavingsAction = 'added'; 

  document.getElementById('add-savings-btn').addEventListener('click', () => {
    currentSavingsAction = 'added';
    savingsModalTitle.textContent = 'Add to Savings';
    savingsForm.reset();
    document.getElementById('savings-date-input').value = getTodayISO();
    savingsModal.showModal();
  });

  document.getElementById('use-savings-btn').addEventListener('click', () => {
    currentSavingsAction = 'used';
    savingsModalTitle.textContent = 'Use Savings';
    savingsForm.reset();
    document.getElementById('savings-date-input').value = getTodayISO();
    savingsModal.showModal();
  });

  savingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amountPaise = parseCurrencyToPaise(document.getElementById('savings-amount-input').value);
    const date = document.getElementById('savings-date-input').value;
    const desc = document.getElementById('savings-desc-input').value;

    if (amountPaise <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }

    if (currentSavingsAction === 'used') {
      const state = getState();
      const ledger = state.savingsLedger || [];
      let added = 0, used = 0;
      ledger.forEach(i => { if (i.type === 'added') added += i.amount; else used += i.amount; });
      const available = added - used;
      
      if (amountPaise > available) {
        alert(`You only have ${formatCurrency(available)} available in total savings.`);
        return;
      }
    }

        // Current period ki savings ko bhi update karo
    const currentPeriod = getState().periods.find(p => p.id === getState().settings.currentPeriodId);
    if (currentPeriod) {
      let currentSavings = currentPeriod.savings || 0;
      if (currentSavingsAction === 'added') {
        updatePeriodBudget(currentPeriod.budget, currentSavings + amountPaise);
      } else if (currentSavingsAction === 'used') {
        const newSavings = Math.max(0, currentSavings - amountPaise);
        updatePeriodBudget(currentPeriod.budget, newSavings);
      }
    }

    addSavings(currentSavingsAction, amountPaise, date, desc);
    savingsModal.close();
    renderSavingsPage();
    updateUI();
  });

}); // <-- Main DOMContentLoaded end