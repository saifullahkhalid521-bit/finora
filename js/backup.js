// backup.js — Export & Import Logic
import { getState, commitState, saveToVault, deleteFromVault, restoreFromVault } from './state.js';

export function setupBackup() {
  const exportBtn = document.getElementById('export-data-btn');
  const importBtn = document.getElementById('import-data-btn');
  const fileInput = document.getElementById('import-file-input');
  const resetBtn = document.getElementById('reset-data-btn');

  // 1. EXPORT DATA
  exportBtn.addEventListener('click', () => {
    const modal = document.getElementById('export-backup-modal');
    const nameInput = document.getElementById('backup-name-input');
    
    const date = new Date().toISOString().split('T')[0];
    nameInput.value = `finora-backup-${date}`;
    
    modal.showModal();
  });

  // Modal Form Submit
  const exportForm = document.getElementById('export-backup-form');
  exportForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const customName = document.getElementById('backup-name-input').value.trim();
    if (!customName) return;

    const data = getState();
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
        // File download hone ke baad vault mein save karo
    saveToVault(customName, dataStr);
    renderVault(); // UI update karo
    URL.revokeObjectURL(url);

    document.getElementById('export-backup-modal').close();
  });

  // 2. IMPORT DATA
  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        if (!parsedData.version || !parsedData.periods) {
          alert("Invalid backup file format.");
          return;
        }

        if (confirm("This will overwrite all current data. Are you sure?")) {
          localStorage.setItem('finora_data', JSON.stringify(parsedData));
          alert("Backup imported successfully! Page will reload now.");
          window.location.reload();
        }
      } catch (error) {
        alert("Error reading file. Please ensure it's a valid Finora JSON backup.");
      }
    };
    reader.readAsText(file);
  });

  // 3. RESET DATA (Independent from Savings)
  resetBtn.addEventListener('click', () => {
    if (confirm("Are you absolutely sure? This will delete ALL your budget periods, categories, and transactions permanently. Your Savings history will be kept safe.")) {
      
      // Data load karo, savings nikaal lo, baaki khaali kar do
      const currentData = getState();
      const savingsToKeep = currentData.savingsLedger || [];
      const vaultToKeep = currentData.backupVault || [];

      const freshData = {
        version: 1,
        settings: { currentPeriodId: null },
        periods: [],
        categories: [
          { id: 'cat_personal', name: 'Personal', builtIn: false },
          { id: 'cat_diet', name: 'Diet', builtIn: false },
          { id: 'cat_misc', name: 'Misc', builtIn: false }
        ],
        transactions: [],
        savingsLedger: savingsToKeep,
        backupVault: vaultToKeep 
      };

      localStorage.setItem('finora_data', JSON.stringify(freshData));
      window.location.reload(true);
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

// Vault UI render karna
export function renderVault() {
  const vaultList = document.getElementById('vault-list');
  if (!vaultList) return;
  
  const state = getState();
  const backups = state.backupVault || [];
  
  vaultList.innerHTML = '';
  
  if (backups.length === 0) {
    vaultList.innerHTML = '<p class="placeholder-text" style="font-size:0.8rem;">No backups in vault yet.</p>';
    return;
  }

  backups.forEach(backup => {
    const date = new Date(backup.date).toLocaleDateString();
    const item = document.createElement('div');
    item.className = 'vault-item';
    item.innerHTML = `
      <div class="vault-info">
        <span class="vault-name">${backup.name}.json</span>
        <span class="vault-date">${date}</span>
      </div>
      <div class="vault-actions">
        <button class="btn-restore" data-id="${backup.id}">Restore</button>
        <button class="btn-delete" data-id="${backup.id}">Delete</button>
      </div>
    `;

    // Restore Logic
    item.querySelector('.btn-restore').addEventListener('click', () => {
      if (confirm("This will overwrite your current data with this backup. Are you sure?")) {
        if (restoreFromVault(backup.data)) {
          window.location.reload();
        } else {
          alert("Invalid backup data.");
        }
      }
    });

    // Delete Logic
    item.querySelector('.btn-delete').addEventListener('click', () => {
      if (confirm("Delete this backup from vault permanently?")) {
        deleteFromVault(backup.id);
        renderVault();
      }
    });

    vaultList.appendChild(item);
  });
}