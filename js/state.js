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

// Save current state to storage
export function commitState() {
  saveData(state);
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