// src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getChapter: (data) => ipcRenderer.invoke('get-chapter', data),
    search: (data) => ipcRenderer.invoke('search', data)
});