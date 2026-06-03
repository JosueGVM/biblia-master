const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbManager = require('../database/db-manager');
const userManager = require('../database/user-manager'); // Importar USER MANAGER

function createWindow() {
    const win = new BrowserWindow({
        width: 1300,
        height: 850,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

// --- CANALES DE COMUNICACIÓN ---
ipcMain.handle('get-chapter', async (event, data) => {
    return await dbManager.getChapter(data.version, data.book, data.chapter);
});

ipcMain.handle('get-versions', async () => {
    return await dbManager.getVersions();
});

ipcMain.handle('search', async (event, data) => {
    return await dbManager.searchWords(data.version, data.keyword);
});

// NUEVOS: Datos de Usuario
ipcMain.handle('save-highlight', async (event, data) => {
    return await userManager.saveHighlight(data);
});

ipcMain.handle('get-highlights', async (event, data) => {
    return await userManager.getHighlights(data.book, data.chapter);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });