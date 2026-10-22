// state.js — App State Manager

import { loadData, saveData } from './storage.js';

// In-memory copy of the data
let state = loadData();

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