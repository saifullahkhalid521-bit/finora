// storage.js — Data Access Layer

const STORAGE_KEY = 'finora_data';

// Default structure (agar storage khaali ho)
const getDefaultData = () => ({
  version: 1,
  settings: {
    currentPeriodId: null,
  },
  periods: [],
  categories: [
    // Default categories (baad mein UI se change kar sakte hain)
    { id: 'cat_personal', name: 'Personal', color: '#4f46e5', builtIn: false },
    { id: 'cat_diet', name: 'Diet', color: '#10b981', builtIn: false },
    { id: 'cat_misc', name: 'Misc', color: '#f59e0b', builtIn: false }
  ],
  transactions: []
});

// Read data
export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultData = getDefaultData();
      saveData(defaultData);
      return defaultData;
    }
    
    const data = JSON.parse(raw);
    // Basic validation check
    if (!data || data.version !== 1) {
      console.warn("Data version mismatch or invalid, resetting safely.");
      const defaultData = getDefaultData();
      saveData(defaultData);
      return defaultData;
    }
    return data;
  } catch (error) {
    console.error("Failed to load data from localStorage:", error);
    return getDefaultData(); // Fallback (browser memory mein rahega)
  }
}

// Save data
export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data to localStorage:", error);
    alert("Storage full or unavailable! Changes might not be saved.");
  }
}