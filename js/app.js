// app.js — Entry point
import { getState, getCurrentPeriod } from './state.js';
import { formatCurrency } from './formatters.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Finora loaded");

  // TEST: Check storage
  const state = getState();
  console.log("Current state:", state);
  
  // TEST: Check formatter
  console.log("Formatting test:", formatCurrency(150000)); // ₹1,500.00 aana chahiye
  
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