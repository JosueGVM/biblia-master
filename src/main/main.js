const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbManager = require('../database/db-manager');
const userManager = require('../database/user-manager'); // Importante

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

// HANDLES DE BIBLIA
ipcMain.handle('get-chapter', async (e, d) => await dbManager.getChapter(d.version, d.book, d.chapter));
ipcMain.handle('get-versions', async () => await dbManager.getVersions());
ipcMain.handle('search', async (e, d) => await dbManager.searchWords(d.version, d.keyword));

// HANDLES DE USUARIO (Highlights)
ipcMain.handle('save-highlight', async (e, d) => await userManager.saveHighlight(d));
ipcMain.handle('get-highlights', async (e, d) => await userManager.getHighlights(d.book, d.chapter));

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });