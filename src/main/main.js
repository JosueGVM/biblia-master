const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbManager = require('../database/db-manager');

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

// CANALES DE COMUNICACIÓN
ipcMain.handle('get-chapter', async (event, data) => {
    return await dbManager.getChapter(data.version, data.book, data.chapter);
});

ipcMain.handle('get-versions', async () => {
    return await dbManager.getVersions();
});

// BUSCADOR (Asegurado)
ipcMain.handle('search', async (event, data) => {
    try {
        console.log("Buscando en el proceso Main:", data.keyword);
        const results = await dbManager.searchWords(data.version, data.keyword);
        return results;
    } catch (err) {
        console.error("Error en el proceso Main al buscar:", err);
        return [];
    }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });