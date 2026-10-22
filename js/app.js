// app.js — Entry point
import { getState, createPeriod } from './state.js';
import { renderDashboard } from './dashboard.js';
import { parseCurrencyToPaise } from './formatters.js';
import { getTodayISO } from './dates.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Finora loaded");

  const newPeriodContainer = document.getElementById('new-period-container');
  const newPeriodForm = document.getElementById('new-period-form');
  const heroCard = document.querySelector('.budget-hero');

  // Default date to today
  document.getElementById('start-date').value = getTodayISO();

  function updateUI() {
    const state = getState();
    let currentPeriod = null;
    if (state.settings.currentPeriodId) {
      currentPeriod = state.periods.find(p => p.id === state.settings.currentPeriodId);
    }

    if (currentPeriod) {
      // Agar period hai, toh form chupao, hero dikhao
      heroCard.style.display = 'block';
      newPeriodContainer.style.display = 'none';
      renderDashboard(currentPeriod, state.transactions);
    } else {
      // Agar koi period nahi hai, toh hero chupao, form dikhao
      heroCard.style.display = 'none';
      newPeriodContainer.style.display = 'block';
    }
  }

  // Form Submit Logic
  newPeriodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const startDate = document.getElementById('start-date').value;
    const budgetInput = document.getElementById('total-budget').value;
    const savingsInput = document.getElementById('savings-amount').value;

    // Validate & Convert to Paise
    const budgetPaise = parseCurrencyToPaise(budgetInput);
    const savingsPaise = savingsInput ? parseCurrencyToPaise(savingsInput) : 0;

    if (budgetPaise <= 0) {
      alert("Budget must be greater than 0");
      return;
    }

    // Create period
    createPeriod(startDate, budgetPaise, savingsPaise);
    
    // Reset form & update UI
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