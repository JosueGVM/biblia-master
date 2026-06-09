const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbManager = require('../database/db-manager');
const userManager = require('../database/user-manager');
const outlinesManager = require('../database/outlines-manager');

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

    ipcMain.handle('window-close', () => win.close());

}

// HANDLES DE BIBLIA
ipcMain.handle('get-chapter', async (e, d) => await dbManager.getChapter(d.version, d.book, d.chapter));
ipcMain.handle('get-versions', async () => await dbManager.getVersions());

// HANDLES DE BÚSQUEDA
ipcMain.handle('search', async (e, d) => await dbManager.searchWords(d.version, d.keyword));
ipcMain.handle('search-all', async (e, d) => await dbManager.searchWordsAllVersions(d.keyword));

// HANDLES DE USUARIO (Highlights)
ipcMain.handle('save-highlight', async (e, d) => await userManager.saveHighlight(d));
ipcMain.handle('get-highlights', async (e, d) => await userManager.getHighlights(d.book, d.chapter));
ipcMain.handle('get-all-highlights', async () => await userManager.getAllHighlights());

// HANDLES DE USUARIO (FAVORITOS)
ipcMain.handle('save-favorite', async (e, d) => await userManager.saveFavorite(d));
ipcMain.handle('get-favorites', async (e) => await userManager.getFavorites());
ipcMain.handle('remove-favorite', async (e, d) => await userManager.removeFavorite(d));
ipcMain.handle('is-favorite', async (e, d) => await userManager.isFavorite(d));

// HANDLES DE USUARIO (NOTAS)
ipcMain.handle('save-note', async (e, d) => await userManager.saveNote(d));
ipcMain.handle('get-notes', async () => await userManager.getNotes());
ipcMain.handle('delete-note', async (e, id) => await userManager.deleteNote(id));
ipcMain.handle('update-note', async (e, { id, content }) => await userManager.updateNote(id, content));

// HANDLES DE USUARIO (BOSQUEJOS)
ipcMain.handle('get-outlines', async () => await outlinesManager.getOutlines());
ipcMain.handle('delete-outline', async (e, id) => await outlinesManager.deleteOutline(id));

ipcMain.handle('save-full-outline', async (e, d) => await outlinesManager.saveFullOutline(d));
ipcMain.handle('update-full-outline', async (e, d) => await outlinesManager.updateFullOutline(d));
ipcMain.handle('get-full-outline', async (e, id) => await outlinesManager.getFullOutlineById(id));

ipcMain.handle('save-simple-outline', async (e, d) => await outlinesManager.saveSimpleOutline(d));
ipcMain.handle('update-simple-outline', async (e, d) => await outlinesManager.updateSimpleOutline(d));
ipcMain.handle('get-simple-outline', async (e, id) => await outlinesManager.getSimpleOutlineById(id));

ipcMain.handle('save-free-outline', async (e, d) => await outlinesManager.saveFreeOutline(d));
ipcMain.handle('update-free-outline', async (e, d) => await outlinesManager.updateFreeOutline(d));
ipcMain.handle('get-free-outline', async (e, id) => await outlinesManager.getFreeOutlineById(id));

ipcMain.handle('save-outline-points', async (e, d) => await outlinesManager.saveOutlinePoints(d.outlineId, d.points));

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });