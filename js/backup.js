// backup.js — Export & Import Logic
import { getState, commitState } from './state.js';

export function setupBackup() {
  const exportBtn = document.getElementById('export-data-btn');
  const importBtn = document.getElementById('import-data-btn');
  const fileInput = document.getElementById('import-file-input');
  const resetBtn = document.getElementById('reset-data-btn');

  // 1. EXPORT DATA
  exportBtn.addEventListener('click', () => {
    const data = getState();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // File name: finora-backup-2026-10-23.json
    const date = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `finora-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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