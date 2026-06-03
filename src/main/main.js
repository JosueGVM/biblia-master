const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbManager = require('../database/db-manager');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            // Ruta absoluta al preload
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
    
    // Abrir herramientas de desarrollador automáticamente para ver errores
    // win.webContents.openDevTools(); 
}

ipcMain.handle('get-chapter', async (event, data) => {
    return dbManager.getChapter(data.version, data.book, data.chapter);
});

ipcMain.handle('search', async (event, data) => {
    return dbManager.searchWords(data.version, data.keyword);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});