const Database = require('better-sqlite3');
const path = require('path');

// Usamos el nombre exacto de tu archivo
const dbPath = path.join(__dirname, 'bibles.db');
const db = new Database(dbPath);

function getChapter(version, book, chapter) {
    try {
        const query = db.prepare(`
            SELECT * FROM bible_verses 
            WHERE version = ? AND book_name = ? AND chapter = ?
            ORDER BY verse_number ASC
        `);
        return query.all(version, book, chapter);
    } catch (err) {
        console.error("Error en la consulta SQL:", err);
        return [];
    }
}

function searchWords(version, keyword) {
    const query = db.prepare(`
        SELECT * FROM bible_verses 
        WHERE version = ? AND text LIKE ? 
        LIMIT 100
    `);
    return query.all(version, `%${keyword}%`);
}

module.exports = { getChapter, searchWords };