const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conexión a la base de datos
const dbPath = path.join(__dirname, 'bibles.db');
const db = new sqlite3.Database(dbPath);

/**
 * Función para obtener un capítulo
 * Usamos una "Promise" para que el programa espere la respuesta de la DB
 */
function getChapter(version, book, chapter) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT * FROM bible_verses 
            WHERE version = ? AND book_name = ? AND chapter = ?
            ORDER BY verse_number ASC
        `;
        
        db.all(sql, [version, book, chapter], (err, rows) => {
            if (err) {
                console.error("Error en la consulta:", err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Función para buscar palabras o frases
 */
function searchWords(version, keyword) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT * FROM bible_verses 
            WHERE version = ? AND text LIKE ? 
            LIMIT 100
        `;
        
        db.all(sql, [version, `%${keyword}%`], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { getChapter, searchWords };