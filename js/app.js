// app.js — entry point (Phase 3 mein bharenge)
// console.log("Finora loaded");

// app.js — Entry point

document.addEventListener('DOMContentLoaded', () => {
  console.log("Finora loaded");

  // Navigation Logic
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.page-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 1. Remove active class from all buttons
      navBtns.forEach(b => b.classList.remove('active'));
      // 2. Add active class to clicked button
      btn.classList.add('active');

      // 3. Hide all sections
      sections.forEach(sec => sec.classList.remove('active-section'));
      
      // 4. Show target section
      const targetId = btn.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add('active-section');
      }
    });
  });
});