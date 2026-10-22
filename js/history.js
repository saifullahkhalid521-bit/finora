// history.js — Transaction History Logic
import { formatCurrency, formatDate } from './formatters.js';
import { deleteTransaction, getState } from './state.js';

export function renderHistory(categories, periodId) {
  // Fresh state lo taaki delete ke baad naya data mile
  const state = getState(); 
  
  const listContainer = document.getElementById('history-list');
  const filterType = document.getElementById('filter-type').value;
  const searchQuery = document.getElementById('filter-search').value.toLowerCase();
  
  listContainer.innerHTML = '';

  // 1. Filter transactions
  let filteredTxns = state.transactions.filter(txn => {
    if (txn.periodId !== periodId) return false;
    if (filterType !== 'all' && txn.type !== filterType) return false;
    
    const cat = categories.find(c => c.id === txn.categoryId);
    const catName = cat ? cat.name : 'Income';
    const searchTarget = `${txn.description || ''} ${catName}`.toLowerCase();
    if (searchQuery && !searchTarget.includes(searchQuery)) return false;

    return true;
  });

  // 2. Sort: Latest date pehle
  filteredTxns.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filteredTxns.length === 0) {
    listContainer.innerHTML = '<p class="placeholder-text">No transactions found.</p>';
    return;
  }

  // 3. Render HTML
  filteredTxns.forEach(txn => {
    const cat = categories.find(c => c.id === txn.categoryId);
    const catName = cat ? cat.name : 'Income';
    const sign = txn.type === 'income' ? '+' : '-';
    const amountClass = txn.type === 'income' ? 'amount-income' : 'amount-expense';

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-item-info">
        <span class="history-item-title">${txn.description || catName}</span>
        <span class="history-item-meta">${catName} &bull; ${formatDate(txn.date)}</span>
      </div>
      <div style="display: flex; align-items: center; gap: var(--space-md);">
        <span class="history-item-amount ${amountClass}">${sign} ${formatCurrency(txn.amount)}</span>
        <button class="delete-txn-btn" title="Delete">✕</button>
      </div>
    `;

    // --- Delete Button Logic ---
    const deleteBtn = item.querySelector('.delete-txn-btn');
    deleteBtn.addEventListener('click', () => {
      // English text for confirm
      if (confirm("Are you sure you want to delete this transaction?")) {
        deleteTransaction(txn.id); // State se hatao
        renderHistory(categories, periodId); // UI refresh karo naye data ke saath
        document.dispatchEvent(new Event('transactionUpdated')); // Dashboard update karo
      }
    });

    listContainer.appendChild(item);
  });
}