const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getChapter: (data) => ipcRenderer.invoke('get-chapter', data),
    getVersions: () => ipcRenderer.invoke('get-versions'),
        // Funciones de usuario - Búsqueda
    search: (data) => ipcRenderer.invoke('search', data),
    searchAll: (d) => ipcRenderer.invoke('search-all', d),
        // Funciones de usuario - Highlights
    saveHighlight: (data) => ipcRenderer.invoke('save-highlight', data),
    getHighlights: (data) => ipcRenderer.invoke('get-highlights', data),
    getAllHighlights: () => ipcRenderer.invoke('get-all-highlights'),
        // Funciones de usuario - Favoritos
    saveFavorite: (data) => ipcRenderer.invoke('save-favorite', data),
    getFavorites: () => ipcRenderer.invoke('get-favorites'),
    removeFavorite: (data) => ipcRenderer.invoke('remove-favorite', data),
    isFavorite: (data) => ipcRenderer.invoke('is-favorite', data),
        // Funciones de usuario - Notas
    saveNote: (data) => ipcRenderer.invoke('save-note', data),
    getNotes: () => ipcRenderer.invoke('get-notes'),
    deleteNote: (id) => ipcRenderer.invoke('delete-note', id),
    updateNote: (id, content) => ipcRenderer.invoke('update-note', { id, content }),
        // Funciones de usuario - BOSQUEJOS
    getOutlines: () => ipcRenderer.invoke('get-outlines'),
    deleteOutline: (id) => ipcRenderer.invoke('delete-outline', id),
    
    saveFullOutline: (d) => ipcRenderer.invoke('save-full-outline', d),
    updateFullOutline: (d) => ipcRenderer.invoke('update-full-outline', d),
    getFullOutline: (id) => ipcRenderer.invoke('get-full-outline', id),
    
    saveSimpleOutline: (d) => ipcRenderer.invoke('save-simple-outline', d),
    updateSimpleOutline: (d) => ipcRenderer.invoke('update-simple-outline', d),
    getSimpleOutline: (id) => ipcRenderer.invoke('get-simple-outline', id),
    
    saveFreeOutline: (d) => ipcRenderer.invoke('save-free-outline', d),
    updateFreeOutline: (d) => ipcRenderer.invoke('update-free-outline', d),
    getFreeOutline: (id) => ipcRenderer.invoke('get-free-outline', id),
    
    saveOutlinePoints: (d) => ipcRenderer.invoke('save-outline-points', d),
});