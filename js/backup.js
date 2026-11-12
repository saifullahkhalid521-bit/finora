// backup.js — Export & Import Logic
import { getState, commitState, saveToVault, deleteFromVault, restoreFromVault } from './state.js';
import { saveData } from './storage.js';

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

    // A backup is budget data — the Vault is device-local locker state, so it is
    // stripped out of the snapshot. This makes it impossible for a restore to
    // ever overwrite the Vault with a stale copy of itself.
    const snapshot = { ...data, backupVault: [] };

    const fileStr = JSON.stringify(snapshot, null, 2);   // readable, for the download
    const blob = new Blob([fileStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${customName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Compact copy for localStorage (no vault nesting => payload stays flat)
    if (!saveToVault(customName, JSON.stringify(snapshot))) {
      console.warn('Backup saved to file but could not be added to the Vault (storage full).');
    }
    renderVault();
    URL.revokeObjectURL(url);

    document.getElementById('export-backup-modal').close();
  });

  // 2. IMPORT DATA (Keeps Vault safe)
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

        if (confirm("This will overwrite your budget data but keep your Vault safe. Are you sure?")) {
          const currentState = getState();
          // Deep copy: the imported object must never alias the live vault array.
          const vaultToKeep = JSON.parse(JSON.stringify(currentState.backupVault || []));

          parsedData.backupVault = vaultToKeep; // Vault preserve karo
          if (!parsedData.settings || typeof parsedData.settings !== 'object') {
            parsedData.settings = { currentPeriodId: null };
          }
          if (!Array.isArray(parsedData.categories)) parsedData.categories = [];
          if (!Array.isArray(parsedData.transactions)) parsedData.transactions = [];
          if (!Array.isArray(parsedData.savingsLedger)) parsedData.savingsLedger = [];

          if (!saveData(parsedData)) return;
          alert("Backup imported successfully! Page will reload now.");
          window.location.reload();
        }
      } catch (error) {
        alert("Error reading file. Please ensure it's a valid Finora JSON backup.");
      }
    };
    reader.readAsText(file);
  });

  // 3. RESET DATA (Independent from Savings & Vault)
  resetBtn.addEventListener('click', () => {
    if (confirm("Are you absolutely sure? This will delete ALL your budget periods, categories, and transactions permanently. Your Savings and Vault history will be kept safe.")) {
      
      const currentData = getState();
      const savingsToKeep = currentData.savingsLedger || [];
      const vaultToKeep = currentData.backupVault || [];

      const freshData = {
        version: 1,
        settings: { currentPeriodId: null },
        periods: [],
        categories: [
          { id: 'cat_personal', name: 'Personal', color: '#4f46e5', builtIn: false },
          { id: 'cat_diet', name: 'Diet', color: '#10b981', builtIn: false },
          { id: 'cat_misc', name: 'Misc', color: '#f59e0b', builtIn: false }
        ],
        transactions: [],
        savingsLedger: savingsToKeep,
        backupVault: vaultToKeep
      };

      if (!saveData(freshData)) return;
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
    const dateValue = backup.date ? new Date(backup.date) : null;
    const dateLabel = (dateValue && !isNaN(dateValue)) ? dateValue.toLocaleDateString() : 'Unknown date';

    const item = document.createElement('div');
    item.className = 'vault-item';

    const info = document.createElement('div');
    info.className = 'vault-info';

    const nameEl = document.createElement('span');
    nameEl.className = 'vault-name';
    nameEl.textContent = `${backup.name}.json`; // textContent: a backup name can never inject HTML

    const dateEl = document.createElement('span');
    dateEl.className = 'vault-date';
    dateEl.textContent = dateLabel;

    info.appendChild(nameEl);
    info.appendChild(dateEl);

    const actions = document.createElement('div');
    actions.className = 'vault-actions';

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'btn-restore';
    restoreBtn.dataset.id = backup.id;
    restoreBtn.textContent = 'Restore';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.dataset.id = backup.id;
    deleteBtn.textContent = 'Delete';

    actions.appendChild(restoreBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(info);
    item.appendChild(actions);

    // Restore: overwrites app data only. The backup itself stays in the Vault.
    restoreBtn.addEventListener('click', () => {
      if (confirm("This will restore this backup. Your Vault history will NOT be deleted. Continue?")) {
        if (restoreFromVault(backup.id)) {
          window.location.reload();
        } else {
          alert("Could not restore this backup. Nothing was changed.");
        }
      }
    });

    // Delete: the ONLY code path that removes a backup from the Vault.
    deleteBtn.addEventListener('click', () => {
      if (confirm("Delete this backup from vault permanently?")) {
        deleteFromVault(backup.id);
        renderVault();
      }
    });

    vaultList.appendChild(item);
  });
}