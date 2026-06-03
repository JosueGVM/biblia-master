// Reemplazo Total de src/database/db-manager.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bibles.db');
const db = new sqlite3.Database(dbPath);

// Nueva función: Trae todas las versiones únicas (RV1960, NVI, etc)
function getVersions() {
    return new Promise((resolve, reject) => {
        db.all("SELECT DISTINCT version FROM bible_verses", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.version)); // Devolvemos solo los nombres
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

module.exports = { getChapter, getVersions };