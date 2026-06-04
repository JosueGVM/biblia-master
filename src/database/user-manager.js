const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

const isPackaged = app.isPackaged;
let dbPath;

if (isPackaged) {
    // Busca la carpeta donde reside el .exe (Memoria USB o Carpeta Local)
    const portableDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
    const dataDir = path.join(portableDir, 'biblia_master_data');
    
    // Crear la carpeta si no existe para que los datos viajen con el .exe
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, 'user_data.db');
} else {
    // Carpeta de desarrollo
    dbPath = path.join(__dirname, 'user_data.db');
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_name TEXT, chapter INTEGER, verse_number INTEGER, color TEXT, version TEXT,
        UNIQUE(book_name, chapter, verse_number, version)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_name TEXT, chapter INTEGER, verse_number INTEGER, content TEXT, version TEXT
    )`);
});

function saveHighlight(data) {
    return new Promise((resolve, reject) => {
        if (data.color === 'transparent') {
            db.run(`DELETE FROM highlights WHERE book_name=? AND chapter=? AND verse_number=? AND version=?`, 
            [data.book, data.chapter, data.verse, data.version], (err) => {
                if (err) reject(err); else resolve({ deleted: true });
            });
        } else {
            db.run(`INSERT OR REPLACE INTO highlights (book_name, chapter, verse_number, color, version) VALUES (?,?,?,?,?)`,
            [data.book, data.chapter, data.verse, data.color, data.version], (err) => {
                if (err) reject(err); else resolve({ success: true });
            });
        }
    });
}

function getHighlights(book, chapter) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM highlights WHERE book_name = ? AND chapter = ?`, [book, chapter], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

module.exports = { saveHighlight, getHighlights };