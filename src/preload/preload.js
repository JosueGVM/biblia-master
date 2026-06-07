const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getChapter: (data) => ipcRenderer.invoke('get-chapter', data),
    getVersions: () => ipcRenderer.invoke('get-versions'),
    search: (data) => ipcRenderer.invoke('search', data),
        // Funciones de usuario - Highlights
    saveHighlight: (data) => ipcRenderer.invoke('save-highlight', data),
    getHighlights: (data) => ipcRenderer.invoke('get-highlights', data),
        // ✨ NUEVAS FUNCIONES - Favoritos
    saveFavorite: (data) => ipcRenderer.invoke('save-favorite', data),
    getFavorites: () => ipcRenderer.invoke('get-favorites'),
    removeFavorite: (data) => ipcRenderer.invoke('remove-favorite', data),
    isFavorite: (data) => ipcRenderer.invoke('is-favorite', data),
    saveNote: (data) => ipcRenderer.invoke('save-note', data),
    getNotes: () => ipcRenderer.invoke('get-notes'),
    deleteNote: (id) => ipcRenderer.invoke('delete-note', id)
});