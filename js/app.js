// app.js — Entry point
import { getState } from './state.js';
import { formatCurrency } from './formatters.js';
import { 
  calculatePeriodSpent, 
  calculateRemainingBudget, 
  calculateUnallocatedBuffer,
  calculateCategorySpent,
  calculateCategoryRemaining
} from './calculations.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Finora loaded");

  // --- TEST SETUP: Fake period and transactions ---
  const mockPeriod = {
    id: 'test_period_1',
    budget: 1000000,  // ₹10,000 in paise
    savings: 200000,  // ₹2,000
    categoryAllocations: {
      'cat_personal': 400000, // ₹4,000
      'cat_diet': 300000,     // ₹3,000
      'cat_misc': 100000      // ₹1,000 (Total: ₹8,000)
    }
  };

  const mockTransactions = [
    { id: 't1', periodId: 'test_period_1', type: 'expense', amount: 150000, categoryId: 'cat_personal' }, // ₹1,500
    { id: 't2', periodId: 'test_period_1', type: 'expense', amount: 100000, categoryId: 'cat_diet' },     // ₹1,000
    { id: 't3', periodId: 'test_period_1', type: 'expense', amount: 30000,  categoryId: 'cat_misc' },     // ₹300
    { id: 't4', periodId: 'test_period_1', type: 'income',  amount: 500000 }                              // ₹5,000 (income)
  ];

  console.log("--- CALCULATION TESTS ---");
  console.log("Total Spent:", formatCurrency(calculatePeriodSpent(mockTransactions, 'test_period_1'))); 
  
  console.log("Remaining Budget:", formatCurrency(calculateRemainingBudget(mockPeriod, mockTransactions))); 
  
  console.log("Unallocated Buffer:", formatCurrency(calculateUnallocatedBuffer(mockPeriod))); 
  
  console.log("Personal Spent:", formatCurrency(calculateCategorySpent(mockTransactions, 'test_period_1', 'cat_personal'))); 
  
  console.log("Personal Remaining:", formatCurrency(calculateCategoryRemaining(mockPeriod, mockTransactions, 'cat_personal'))); 

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