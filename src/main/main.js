const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbManager = require('../database/db-manager');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
    
    // Opcional: Abre las herramientas de desarrollo para ver errores
    // win.webContents.openDevTools();
}

// Escuchar peticiones del Renderer
ipcMain.handle('get-chapter', async (event, data) => {
    try {
        // Esperamos a que la DB nos dé los versículos
        const verses = await dbManager.getChapter(data.version, data.book, data.chapter);
        return verses;
    } catch (error) {
        return { error: error.message };
    }
});

ipcMain.handle('search', async (event, data) => {
    try {
        return await dbManager.searchWords(data.version, data.keyword);
    } catch (error) {
        return { error: error.message };
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});