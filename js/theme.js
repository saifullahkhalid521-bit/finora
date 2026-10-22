// theme.js — Dark Mode Logic
import { getState, getCurrentPeriod } from './state.js'; // state import kiya taaki preference save ho sake

export function setupTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  // 1. Check local storage / state for saved preference
  const savedTheme = localStorage.getItem('finora_theme');
  if (savedTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    if(themeToggle) themeToggle.checked = true;
  }

  // 2. Toggle Logic
  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('finora_theme', 'dark');
      } else {
        body.removeAttribute('data-theme');
        localStorage.setItem('finora_theme', 'light');
      }
    });
  }
}