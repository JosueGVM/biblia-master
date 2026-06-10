const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dbManager = require('../database/db-manager');
const userManager = require('../database/user-manager');
const outlinesManager = require('../database/outlines-manager');
const exegesisManager = require('../database/exegesis-manager');

const puppeteer = require('puppeteer');

function createWindow() {
    const win = new BrowserWindow({
        width: 1300,
        height: 850,
        title: "CODEX viewer",
        frame: false, // esto elimina la barra nativa completamente
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));

        // HANDLES VENTANA CUSTOM
    ipcMain.handle('window-minimize', () => win.minimize());
    ipcMain.handle('window-maximize', () => { win.isMaximized() ? win.unmaximize() : win.maximize(); });
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
    // HANDLE DE EXPORTACIÓN PDF
ipcMain.handle('export-outline-pdf', async (e, { html, title }) => {
    const { dialog } = require('electron');
    
    const { filePath } = await dialog.showSaveDialog({
        title: 'Exportar Bosquejo',
        defaultPath: `${title || 'bosquejo'}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });

    if (!filePath) return { cancelled: true };

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
        path: filePath,
        format: 'A4',
        margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
        printBackground: true
    });

    await browser.close();
    return { success: true, filePath };
});

// HANDLES DE EXÉGESIS
ipcMain.handle('get-exegesis-list', async () => await exegesisManager.getExegesisList());
ipcMain.handle('get-exegesis-by-id', async (e, id) => await exegesisManager.getExegesisById(id));
ipcMain.handle('save-exegesis', async (e, d) => await exegesisManager.saveExegesis(d));
ipcMain.handle('update-exegesis', async (e, d) => await exegesisManager.updateExegesis(d));
ipcMain.handle('delete-exegesis', async (e, id) => await exegesisManager.deleteExegesis(id));

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });