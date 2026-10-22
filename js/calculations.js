// calculations.js — Financial Calculations
// Sabhi amounts paise (integer) mein hain. Divide by 100 karke display karenge.

/**
 * 1. Ek period ke andar kitna kharch hua (Total Spent)
 */
export function calculatePeriodSpent(transactions, periodId) {
  // Sirf us period ke expenses, aur sirf "expense" type
  return transactions
    .filter(txn => txn.periodId === periodId && txn.type === 'expense')
    .reduce((total, txn) => total + txn.amount, 0);
}

/**
 * 2. Ek period ke andar kitna income aaya (Total Income)
 * Note: Income budget ko affect nahi karta, sirf track hota hai.
 */
export function calculatePeriodIncome(transactions, periodId) {
  return transactions
    .filter(txn => txn.periodId === periodId && txn.type === 'income')
    .reduce((total, txn) => total + txn.amount, 0);
}

/**
 * 3. Remaining Spendable Budget
 * Formula: Budget - Spent (Savings budget ke andar nahi hai, isliye minus nahi karenge)
 */
export function calculateRemainingBudget(period, transactions) {
  if (!period) return 0;
  const spent = calculatePeriodSpent(transactions, period.id);
  const remaining = period.budget - spent;
  return remaining > 0 ? remaining : 0; // Kabhi negative display nahi karenge
}

/**
 * 4. Unallocated Buffer (Warning ke liye)
 * Formula: Budget - (sum of all category allocations)
 */
export function calculateUnallocatedBuffer(period) {
  if (!period) return 0;
  
  const totalAllocated = Object.values(period.categoryAllocations || {})
    .reduce((sum, amount) => sum + amount, 0);
    
  const unallocated = period.budget - totalAllocated;
  return unallocated > 0 ? unallocated : 0;
}

/**
 * 5. Ek specific category mein kitna kharch hua
 */
export function calculateCategorySpent(transactions, periodId, categoryId) {
  return transactions
    .filter(txn => 
      txn.periodId === periodId && 
      txn.type === 'expense' && 
      txn.categoryId === categoryId
    )
    .reduce((total, txn) => total + txn.amount, 0);
}

/**
 * 6. Ek category ka remaining amount
 * Formula: Allocated - Spent
 */
export function calculateCategoryRemaining(period, transactions, categoryId) {
  if (!period || !period.categoryAllocations) return 0;
  
  const allocated = period.categoryAllocations[categoryId] || 0;
  const spent = calculateCategorySpent(transactions, period.id, categoryId);
  
  const remaining = allocated - spent;
  return remaining > 0 ? remaining : 0;
}

/**
 * 7. Helper: Paisa format karne ke liye (formatters.js se import karenge)
 * (Abhi ke liye bas console test ke liye)
 */