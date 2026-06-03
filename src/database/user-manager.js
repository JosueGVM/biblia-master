const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

const isPackaged = app.isPackaged;
const dbPath = isPackaged 
    ? path.join(process.resourcesPath, 'database', 'user_data.db')
    : path.join(__dirname, 'user_data.db');

const db = new sqlite3.Database(dbPath);

// Inicializar tablas de usuario
db.serialize(() => {
    // Tabla de Marcatextos (Highlights)
    db.run(`CREATE TABLE IF NOT EXISTS highlights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_name TEXT,
        chapter INTEGER,
        verse_number INTEGER,
        color TEXT,
        version TEXT
    )`);

    // Tabla de Favoritos
    db.run(`CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_name TEXT,
        chapter INTEGER,
        verse_number INTEGER,
        version TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de Notas
    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_name TEXT,
        chapter INTEGER,
        verse_number INTEGER,
        content TEXT,
        version TEXT
    )`);
});

// Funciones para Marcatextos
function saveHighlight(data) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO highlights (book_name, chapter, verse_number, color, version) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [data.book, data.chapter, data.verse, data.color, data.version], function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
        });
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

// Exportamos las funciones que usaremos por ahora
module.exports = { saveHighlight, getHighlights };