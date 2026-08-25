const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  exportProductionPackage: (data) => ipcRenderer.invoke('export-production-package', data),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings)
});
