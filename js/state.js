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

// 1. Naya period banane ka function
export function createPeriod(startDate, budget, savings) {
  const newPeriod = {
    id: generateId('period'),
    startDate: startDate,
    endDate: calculateEndDate(startDate),
    budget: budget,
    savings: savings,
    categoryAllocations: {}, // Abhi khaali rakhenge, next task mein categories add karenge
    createdAt: new Date().toISOString()
  };

  state.periods.push(newPeriod);
  state.settings.currentPeriodId = newPeriod.id;
  
  commitState(); // Save to localStorage
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