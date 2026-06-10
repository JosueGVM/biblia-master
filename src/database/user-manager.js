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
        book_name TEXT, chapter INTEGER, verse_number INTEGER, color TEXT, version TEXT, text TEXT,
        UNIQUE(book_name, chapter, verse_number, version)
    )`);
        db.run(`ALTER TABLE highlights ADD COLUMN text TEXT`, (err) => {
            // Ignorar error si la columna ya existe
        });
    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_name TEXT, chapter INTEGER, verse_number INTEGER, content TEXT, version TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // ✨ NUEVA TABLA: FAVORITOS
    db.run(`CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_name TEXT, 
        chapter INTEGER, 
        verse_number INTEGER, 
        text TEXT, 
        version TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book_name, chapter, verse_number, version)
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
            db.run(`INSERT OR REPLACE INTO highlights (book_name, chapter, verse_number, color, version, text) VALUES (?,?,?,?,?,?)`,
            [data.book, data.chapter, data.verse, data.color, data.version, data.text || ''], (err) => {
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

function getAllHighlights() {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM highlights ORDER BY book_name, chapter, verse_number`,
            [],
            (err, rows) => { if (err) reject(err); else resolve(rows || []); }
        );
    });
}

// ✨ NUEVAS FUNCIONES DE FAVORITOS
function saveFavorite(data) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT OR IGNORE INTO favorites (book_name, chapter, verse_number, text, version) VALUES (?,?,?,?,?)`,
            [data.book, data.chapter, data.verse, data.text, data.version],
            (err) => {
                if (err) reject(err); 
                else resolve({ success: true });
            }
        );
    });
}

function getFavorites() {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM favorites ORDER BY created_at DESC`,
            [],
            (err, rows) => {
                if (err) reject(err); 
                else resolve(rows || []);
            }
        );
    });
}

function removeFavorite(data) {
    return new Promise((resolve, reject) => {
        db.run(
            `DELETE FROM favorites WHERE book_name=? AND chapter=? AND verse_number=? AND version=?`,
            [data.book, data.chapter, data.verse, data.version],
            (err) => {
                if (err) reject(err); 
                else resolve({ deleted: true });
            }
        );
    });
}

function isFavorite(data) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT id FROM favorites WHERE book_name=? AND chapter=? AND verse_number=? AND version=?`,
            [data.book, data.chapter, data.verse, data.version],
            (err, row) => {
                if (err) reject(err); 
                else resolve(row ? true : false);
            }
        );
    });
}

// FUNCIONES DE NOTAS:
function saveNote(data) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO notes (book_name, chapter, verse_number, content, version) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [data.book, data.chapter, data.verse, data.content, data.version],
            function(err){
                if (err) reject(err); else resolve({ id: this.lastID });
            });
    });
}

function getNotes() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM notes ORDER BY timestamp DESC`, [], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

function deleteNote(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM notes WHERE id = ?`, [id], (err) => {
            if(err) {
                reject(err);
            } else {
                resolve({ success: true });
            }
        });
    });
}

function updateNote(id, content) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE notes SET content = ?, timestamp = CURRENT_TIMESTAMP WHERE id = ?`;
        db.run(sql, [content, id], (err) => {
            if (err) reject(err); else resolve(true);
        });
    });
}

module.exports = { 
    saveHighlight, getHighlights, getAllHighlights,
    saveFavorite, getFavorites, removeFavorite, isFavorite,
    saveNote, getNotes, deleteNote, updateNote
};