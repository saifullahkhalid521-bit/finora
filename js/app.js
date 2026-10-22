// app.js — Entry point
import { getState } from './state.js';
import { renderDashboard } from './dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Finora loaded");

  // 1. Get current state
  const state = getState();
  
  // 2. Get current active period (agar banaya hai toh)
  let currentPeriod = null;
  if (state.settings.currentPeriodId) {
    currentPeriod = state.periods.find(p => p.id === state.settings.currentPeriodId);
  }

  // 3. Render Dashboard
  renderDashboard(currentPeriod, state.transactions);

  // 4. Navigation Logic
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