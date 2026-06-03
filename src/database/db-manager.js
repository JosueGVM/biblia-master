const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bibles.db');
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

// BUSCADOR MEJORADO
function searchWords(version, keyword) {
    return new Promise((resolve, reject) => {
        // Usamos LOWER para que no importe si escribes en mayúsculas o minúsculas
        const sql = `SELECT * FROM bible_verses WHERE version = ? AND text LIKE ? LIMIT 100`;
        const param = `%${keyword}%`;
        
        console.log(`Ejecutando SQL: Buscar "${keyword}" en versión "${version}"`);
        
        db.all(sql, [version, param], (err, rows) => {
            if (err) {
                console.error("Error en SQL:", err);
                reject(err);
            } else {
                console.log(`SQL encontró ${rows.length} resultados`);
                resolve(rows);
            }
        });
    });
}

module.exports = { getChapter, getVersions, searchWords };