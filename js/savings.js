// savings.js — Savings Page Logic
import { getState, deleteSavings } from './state.js';
import { formatCurrency, formatDate } from './formatters.js';

export function renderSavingsPage() {
  const state = getState();
  const ledger = state.savingsLedger || [];
  
  // 1. Calculations
  let totalAdded = 0;
  let totalUsed = 0;
  
  ledger.forEach(item => {
    if (item.type === 'added') totalAdded += item.amount;
    if (item.type === 'used') totalUsed += item.amount;
  });
  
  const currentBalance = totalAdded - totalUsed;

  // 2. Update Top UI
  document.getElementById('savings-total-display').textContent = formatCurrency(currentBalance);
  document.getElementById('savings-added-display').textContent = formatCurrency(totalAdded);
  document.getElementById('savings-used-display').textContent = formatCurrency(totalUsed);

  // 3. Render History (Max 10, Latest First)
  const listContainer = document.getElementById('savings-history-list');
  listContainer.innerHTML = '';

  const recentLedger = [...ledger].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  if (recentLedger.length === 0) {
    listContainer.innerHTML = '<p class="placeholder-text">No savings history yet.</p>';
    return;
  }

  recentLedger.forEach(item => {
    const sign = item.type === 'added' ? '+' : '-';
    const amountClass = item.type === 'added' ? 'add' : 'use';
    
    const card = document.createElement('div');
    card.className = 'savings-card';
    card.innerHTML = `
      <div class="savings-card-info">
        <span class="savings-card-title">${item.description || (item.type === 'added' ? 'Added to Savings' : 'Used Savings')}</span>
        <span class="savings-card-meta">${formatDate(item.date)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: var(--space-md);">
        <span class="savings-card-amount ${amountClass}">${sign} ${formatCurrency(item.amount)}</span>
        <button class="delete-savings-btn" data-id="${item.id}">✕</button>
      </div>
    `;

    // Delete Logic (Double Confirmation)
    card.querySelector('.delete-savings-btn').addEventListener('click', () => {
      if (confirm("Are you sure you want to delete this savings record?")) {
        deleteSavings(item.id);
        renderSavingsPage(); // Re-render
      }
    });

    listContainer.appendChild(card);
  });
}