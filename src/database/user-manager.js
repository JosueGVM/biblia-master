const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

const isPackaged = app.isPackaged;
const dbPath = isPackaged 
    ? path.join(process.resourcesPath, 'database', 'user_data.db')
    : path.join(__dirname, 'user_data.db');

const db = new sqlite3.Database(dbPath);

// Inicializar tablas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_name TEXT,
        chapter INTEGER,
        verse_number INTEGER,
        color TEXT,
        version TEXT,
        UNIQUE(book_name, chapter, verse_number, version) -- Evita duplicados
    )`);
});

function saveHighlight(data) {
    return new Promise((resolve, reject) => {
        if (data.color === 'transparent') {
            // SI ES TRANSPARENTE, BORRAMOS DE LA DB
            const sql = `DELETE FROM highlights WHERE book_name = ? AND chapter = ? AND verse_number = ? AND version = ?`;
            db.run(sql, [data.book, data.chapter, data.verse, data.version], function(err) {
                if (err) reject(err);
                else resolve({ deleted: true });
            });
        } else {
            // SI TIENE COLOR, INSERTAMOS O REEMPLAZAMOS
            const sql = `INSERT OR REPLACE INTO highlights (book_name, chapter, verse_number, color, version) VALUES (?, ?, ?, ?, ?)`;
            db.run(sql, [data.book, data.chapter, data.verse, data.color, data.version], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        }
    });
}

function getHighlights(book, chapter) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM highlights WHERE book_name = ? AND chapter = ?`;
        db.all(sql, [book, chapter], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { saveHighlight, getHighlights };