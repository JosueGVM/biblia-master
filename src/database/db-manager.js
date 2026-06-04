const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

const isPackaged = app.isPackaged;
const dbPath = isPackaged 
    ? path.join(process.resourcesPath, 'database', 'bibles.db')
    : path.join(__dirname, 'bibles.db');

const db = new sqlite3.Database(dbPath);

function getVersions() {
    return new Promise((resolve, reject) => {
        db.all("SELECT DISTINCT version FROM bible_verses", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.version));
        });
    });
}

function getChapter(version, book, chapter) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM bible_verses WHERE version = ? AND book_name = ? AND chapter = ? ORDER BY verse_number ASC`;
        db.all(sql, [version, book, chapter], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function searchWords(version, keyword) {
    return new Promise((resolve, reject) => {
        // Búsqueda de palabra exacta usando límites de espacio o puntuación
        // Buscamos la palabra rodeada de espacios, inicios de línea o signos
        const sql = `SELECT * FROM bible_verses 
                     WHERE version = ? 
                     AND (text LIKE ? OR text LIKE ? OR text LIKE ? OR text LIKE ?)
                     LIMIT 500`;
        
        const params = [
            version,
            `${keyword} %`,   // Al inicio
            `% ${keyword}`,   // Al final
            `% ${keyword} %`, // En medio
            keyword           // Palabra sola
        ];

        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { getChapter, getVersions, searchWords };