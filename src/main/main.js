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
    // win.webContents.openDevTools(); // Descomenta esta línea si quieres que se abra la consola siempre
}

// --- CANALES DE COMUNICACIÓN ---
ipcMain.handle('get-chapter', async (event, data) => {
    return await dbManager.getChapter(data.version, data.book, data.chapter);
});

ipcMain.handle('get-versions', async () => {
    return await dbManager.getVersions();
});

ipcMain.handle('search', async (event, data) => {
    console.log("Pedido de búsqueda recibido en el Main Process:", data);
    return await dbManager.searchWords(data.version, data.keyword);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });