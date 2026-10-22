// app.js — Entry point
import { getState, createPeriod, addCategoryAllocation , addCustomCategory} from './state.js';
import { renderDashboard } from './dashboard.js';
import { parseCurrencyToPaise } from './formatters.js';
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
      
      // Dropdown clear karo
      categorySelect.innerHTML = '<option value="">-- Select --</option>';
      
      // Fallback: Agar state.categories khaali hai toh default categories use karo
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
      
      // Dropdown refresh karne ka simple tarika
      if (catFormContainer.style.display === 'block') {
        // Agar form khula hai, toh usko close karke wapas open karo taaki nayi category dikhe
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
    
    // Close form & reset
    catFormContainer.style.display = 'none';
    toggleCatFormBtn.textContent = '+ Allocate Budget';
    categoryForm.reset();
    
    // Update UI
    updateUI();
  });

  // --- Main Update UI Function ---
  function updateUI() {
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
    const budgetPaise = parseCurrencyToPaise(document.getElementById('total-budget').value);
    const savingsPaise = document.getElementById('savings-amount').value ? parseCurrencyToPaise(document.getElementById('savings-amount').value) : 0;

    if (budgetPaise <= 0) {
      alert("Budget must be greater than 0");
      return;
    }

    createPeriod(startDate, budgetPaise, savingsPaise);
    newPeriodForm.reset();
    document.getElementById('start-date').value = getTodayISO();
    updateUI();
  });

  // Initial Render
  updateUI();

  // Navigation Logic
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
      }
    });
  });
});