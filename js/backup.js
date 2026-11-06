// backup.js — Export & Import Logic
import { getState, commitState } from './state.js';

export function setupBackup() {
  const exportBtn = document.getElementById('export-data-btn');
  const importBtn = document.getElementById('import-data-btn');
  const fileInput = document.getElementById('import-file-input');
  const resetBtn = document.getElementById('reset-data-btn');

    // 1. EXPORT DATA
  exportBtn.addEventListener('click', () => {
    // Modal open karo aur default naam daalo
    const modal = document.getElementById('export-backup-modal');
    const nameInput = document.getElementById('backup-name-input');
    
    const date = new Date().toISOString().split('T')[0];
    nameInput.value = `finora-backup-${date}`; // Default naam
    
    modal.showModal();
  });

  // Modal Form Submit (Jab user download dabaye)
  const exportForm = document.getElementById('export-backup-form');
  exportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const customName = document.getElementById('backup-name-input').value.trim();
    if (!customName) return;

    const data = getState();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // File download logic
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customName}.json`; // Custom name use kiya
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Modal band karo
    document.getElementById('export-backup-modal').close();
  });
 

  // 2. IMPORT DATA (Trigger file input)
  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // Jab file select ho jaye
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        // Basic Validation check
        if (!parsedData.version || !parsedData.periods) {
          alert("Invalid backup file format.");
          return;
        }

        if (confirm("This will overwrite all current data. Are you sure?")) {
          // State update karo aur save karo
          // (State ka reference change karna padega, isliye hum direct localStorage update karenge)
          localStorage.setItem('finora_data', JSON.stringify(parsedData));
          alert("Backup imported successfully! Page will reload now.");
          window.location.reload(); // Refresh taaki naya data load ho
        }
      } catch (error) {
        alert("Error reading file. Please ensure it's a valid Finora JSON backup.");
      }
    };
    reader.readAsText(file);
  });

  // 3. RESET DATA
  resetBtn.addEventListener('click', () => {
    if (confirm("Are you absolutely sure? This will delete ALL your financial data permanently.")) {
      localStorage.removeItem('finora_data');
      window.location.reload();
    }
  });
}

// --- Independent Savings Export/Import/Reset ---
export function setupSavingsBackup() {
  const exportBtn = document.getElementById('export-savings-btn');
  const importBtn = document.getElementById('import-savings-btn');
  const fileInput = document.getElementById('import-savings-file');
  const resetBtn = document.getElementById('reset-savings-btn');

  if(!exportBtn) return; 

  // Export
  exportBtn.addEventListener('click', () => {
    const state = getState();
    const savingsData = state.savingsLedger || [];
    const dataStr = JSON.stringify(savingsData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `finora-savings-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Import
  importBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        if (!Array.isArray(parsedData)) {
          alert("Invalid savings backup format.");
          return;
        }

        if (confirm("This will overwrite your current savings history. Are you sure?")) {
          const state = getState();
          state.savingsLedger = parsedData;
          localStorage.setItem('finora_data', JSON.stringify(state));
          window.location.reload(true);
        }
      } catch (error) {
        alert("Error reading file.");
      }
    };
    reader.readAsText(file);
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete ALL savings data? This will NOT affect your budget.")) {
      const state = getState();
      state.savingsLedger = []; 
      localStorage.setItem('finora_data', JSON.stringify(state));
      window.location.reload(true);
    }
  });
}