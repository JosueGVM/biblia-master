const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getChapter: (data) => ipcRenderer.invoke('get-chapter', data),
    getVersions: () => ipcRenderer.invoke('get-versions'),
    search: (data) => ipcRenderer.invoke('search', data),
    // Nuevas funciones de usuario
    saveHighlight: (data) => ipcRenderer.invoke('save-highlight', data),
    getHighlights: (data) => ipcRenderer.invoke('get-highlights', data)
});