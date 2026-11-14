// state.js — App State Manager

import { loadData, saveData } from './storage.js';
import { calculateEndDate } from './dates.js';

// In-memory copy of the data
let state = loadData();

// ==========================================
// CORE STATE FUNCTIONS
// ==========================================

// Get current state (read-only copy for reading)
export function getState() {
  return state;
}

// Save current state to storage. Returns true when the write actually landed,
// so callers can react instead of showing a success message over a failed save.
export function commitState() {
  return saveData(state);
}

// Get specific period by ID
export function getPeriod(periodId) {
  return state.periods.find(p => p.id === periodId) || null;
}

// Get current active period
export function getCurrentPeriod() {
  if (!state.settings.currentPeriodId) return null;
  return getPeriod(state.settings.currentPeriodId);
}

// Generate simple unique ID
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// ==========================================
// FEATURE FUNCTIONS
// ==========================================

// 1. Naya period banane ka function (Ab days bhi accept karega)
export function createPeriod(startDate, budget, savings, days = 30) {
  const newPeriod = {
    id: generateId('period'),
    startDate: startDate,
    endDate: calculateEndDate(startDate, days), // Yahan custom days pass kiya
    days: days, // Data mein save kar liya taaki history track kar sakein
    budget: budget,
    savings: savings,
    categoryAllocations: {},
    createdAt: new Date().toISOString()
  };

  state.periods.push(newPeriod);
  state.settings.currentPeriodId = newPeriod.id;
  
  commitState();
  return newPeriod;
}

// 2. Ek category ko budget allocate karna
export function addCategoryAllocation(categoryId, amountPaise) {
  const currentPeriod = getCurrentPeriod();
  if (!currentPeriod) return;

  // Agar allocations object nahi hai, toh banao
  if (!currentPeriod.categoryAllocations) {
    currentPeriod.categoryAllocations = {};
  }

  // Set the amount
  currentPeriod.categoryAllocations[categoryId] = amountPaise;
  
  commitState(); // Save to localStorage
}

// Naya custom category add karna
export function addCustomCategory(name) {
  const newCategory = {
    id: generateId('cat'),
    name: name,
    builtIn: false
  };
  
  state.categories.push(newCategory);
  commitState();
  return newCategory;
}

// Naya transaction (income/expense) add karna
export function addTransaction(type, amountPaise, categoryId, date, description) {
  const currentPeriod = getCurrentPeriod();
  if (!currentPeriod) return false;

  const newTxn = {
    id: generateId('txn'),
    periodId: currentPeriod.id,
    type: type, // 'income' ya 'expense'
    amount: amountPaise,
    categoryId: type === 'expense' ? categoryId : null,
    date: date,
    description: description || '',
    createdAt: new Date().toISOString()
  };

  state.transactions.push(newTxn);
  commitState();
  return true;
}

// Transaction delete karna
export function deleteTransaction(txnId) {
  // Sirf us ID wali transaction ko hatao
  state.transactions = state.transactions.filter(txn => txn.id !== txnId);
  commitState();
}

// Naya savings add/use karna
export function addSavings(type, amountPaise, date, description, periodId = null) {
  const newSavings = {
    id: generateId('sav'),
    type: type, // 'added' ya 'used'
    amount: amountPaise,
    date: date,
    description: description || '',
    periodId: periodId,
    createdAt: new Date().toISOString()
  };
  
  if (!state.savingsLedger) state.savingsLedger = [];
  state.savingsLedger.push(newSavings);
  commitState();
  return newSavings;
}

// Savings delete karna
export function deleteSavings(savingsId) {
  if (!state.savingsLedger) return;
  state.savingsLedger = state.savingsLedger.filter(s => s.id !== savingsId);

  // Dashboard savings ko ledger se recalculate karo
  const currentPeriod = getCurrentPeriod();
  if (currentPeriod) {
    let totalAdded = 0;
    let totalUsed = 0;
    state.savingsLedger.forEach(s => {
      if (s.type === 'added') totalAdded += s.amount;
      else totalUsed += s.amount;
    });
    currentPeriod.savings = Math.max(0, totalAdded - totalUsed);
  }

  commitState();
}

// Total Budget aur Savings update karna
export function updatePeriodBudget(budgetPaise, savingsPaise) {
  const currentPeriod = getCurrentPeriod();
  if (!currentPeriod) return;
  
  currentPeriod.budget = budgetPaise;
  currentPeriod.savings = savingsPaise;
  commitState();
}

// Category rename karna
export function renameCategory(categoryId, newName) {
  const category = state.categories.find(c => c.id === categoryId);
  if (!category) return false;
  category.name = newName.trim();
  commitState();
  return true;
}

// Category allocation update karna
export function updateCategoryAllocation(categoryId, amountPaise) {
  const currentPeriod = getCurrentPeriod();
  if (!currentPeriod) return;
  
  if (!currentPeriod.categoryAllocations) {
    currentPeriod.categoryAllocations = {};
  }
  
  currentPeriod.categoryAllocations[categoryId] = amountPaise;
  commitState();
}

// 1. Naya backup vault mein save karna
export function saveToVault(name, jsonData) {
  if (!state.backupVault) state.backupVault = [];
  
  const newBackup = {
    id: generateId('bak'),
    name: name,
    date: new Date().toISOString(),
    data: jsonData // Poora data string format mein save hoga
  };
  
  // Latest backup sabse upar
  state.backupVault.unshift(newBackup);

  // NOTE: yahan koi automatic trimming NAHI hai. Vault ek permanent locker hai —
  // backup sirf tab hatega jab user khud deleteFromVault() chalaye.
  return commitState() ? newBackup : null;
}

// 2. Vault se backup delete karna
export function deleteFromVault(backupId) {
  if (!state.backupVault) return;
  state.backupVault = state.backupVault.filter(b => b.id !== backupId);
  commitState();
}

// Vault se wapas restore karna (backup Vault mein hi rehta hai)
export function restoreFromVault(backupId) {
  if (!Array.isArray(state.backupVault)) return false;

  // 1. Backup dhundo
  const backupToRestore = state.backupVault.find(b => b.id === backupId);
  if (!backupToRestore) return false;

  // 2. Data parse karo (corrupt entry crash na kare)
  let parsedData;
  try {
    parsedData = JSON.parse(backupToRestore.data);
  } catch (error) {
    console.error("Corrupt backup data in vault:", backupId, error);
    return false;
  }

  if (!parsedData || !parsedData.version || !Array.isArray(parsedData.periods)) return false;

  // 3. Current vault ka deep copy pehle bacha lo, taaki restore ke baad
  //    har backup (naya ya purana) Vault mein exactly waise hi rahe.
  const currentVault = JSON.parse(JSON.stringify(state.backupVault));

  // 4. Restored data ke saath current vault wapas jodo
  parsedData.backupVault = currentVault;

  // 5. Reserved fields ko sane defaults do
  if (!parsedData.settings || typeof parsedData.settings !== 'object') {
    parsedData.settings = { currentPeriodId: null };
  }
  if (!Array.isArray(parsedData.categories)) parsedData.categories = [];
  if (!Array.isArray(parsedData.transactions)) parsedData.transactions = [];
  if (!Array.isArray(parsedData.savingsLedger)) parsedData.savingsLedger = [];

  // 6. localStorage pehle, memory baad mein — agar write fail ho to
  //    UI ko jhooti success mat dikhao.
  if (!saveData(parsedData)) return false;
  state = parsedData;

  return true;
}

// --- NOTES FUNCTIONS ---

// Naya note add karna
export function addNote(title, content) {
  if (!state.notes) state.notes = [];
  const newNote = {
    id: generateId('note'),
    title: title,
    content: content,
    date: new Date().toISOString()
  };
  state.notes.push(newNote);
  commitState();
  return newNote;
}

// Note update karna
export function updateNote(noteId, newTitle, newContent) {
  const note = state.notes.find(n => n.id === noteId);
  if (!note) return false;
  note.title = newTitle;
  note.content = newContent;
  note.date = new Date().toISOString(); // Update time
  commitState();
  return true;
}

// Note delete karna
export function deleteNote(noteId) {
  if (!state.notes) return;
  state.notes = state.notes.filter(n => n.id !== noteId);
  commitState();
}