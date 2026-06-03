// Reemplazo Total de src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getChapter: (data) => ipcRenderer.invoke('get-chapter', data),
    getVersions: () => ipcRenderer.invoke('get-versions'),
    search: (data) => ipcRenderer.invoke('search', data) // <--- Esta línea es vital
});