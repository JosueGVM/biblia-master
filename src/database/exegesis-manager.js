const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

const isPackaged = app.isPackaged;
let dbPath;

if (isPackaged) {
    const portableDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
    const dataDir = path.join(portableDir, 'biblia_master_data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    dbPath = path.join(dataDir, 'exegesis.db');
} else {
    dbPath = path.join(__dirname, 'exegesis.db');
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS exegesis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        passage TEXT,

        -- 1. Introducción y Delimitación
        delimitacion TEXT,
        proposito TEXT,
        tesis TEXT,

        -- 2. Contexto Histórico y Cultural
        autoria TEXT,
        fecha_lugar TEXT,
        proposito_original TEXT,

        -- 3. Contexto Literario
        genero TEXT,
        relacion TEXT,
        estructura TEXT,

        -- 4. Análisis Gramatical y Léxico
        analisis_palabras TEXT,
        gramatica TEXT,
        traduccion TEXT,

        -- 5. Significado Teológico
        ensenanza_original TEXT,
        mensaje_central TEXT,

        -- 6. Aplicación Contemporánea
        relevancia TEXT,
        ejemplos TEXT,

        -- 7. Conclusión
        resumen TEXT,
        reflexion TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

function getExegesisList() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT id, title, passage, created_at, updated_at FROM exegesis ORDER BY updated_at DESC`, [], (err, rows) => {
            if (err) reject(err); else resolve(rows || []);
        });
    });
}

function getExegesisById(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM exegesis WHERE id=?`, [id], (err, row) => {
            if (err) reject(err); else resolve(row);
        });
    });
}

function saveExegesis(data) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO exegesis 
            (title, passage, delimitacion, proposito, tesis,
             autoria, fecha_lugar, proposito_original,
             genero, relacion, estructura,
             analisis_palabras, gramatica, traduccion,
             ensenanza_original, mensaje_central,
             relevancia, ejemplos, resumen, reflexion)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        db.run(sql, [
            data.title, data.passage, data.delimitacion, data.proposito, data.tesis,
            data.autoria, data.fecha_lugar, data.proposito_original,
            data.genero, data.relacion, data.estructura,
            data.analisis_palabras, data.gramatica, data.traduccion,
            data.ensenanza_original, data.mensaje_central,
            data.relevancia, data.ejemplos, data.resumen, data.reflexion
        ], function(err) {
            if (err) reject(err); else resolve({ id: this.lastID });
        });
    });
}

function updateExegesis(data) {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE exegesis SET
            title=?, passage=?, delimitacion=?, proposito=?, tesis=?,
            autoria=?, fecha_lugar=?, proposito_original=?,
            genero=?, relacion=?, estructura=?,
            analisis_palabras=?, gramatica=?, traduccion=?,
            ensenanza_original=?, mensaje_central=?,
            relevancia=?, ejemplos=?, resumen=?, reflexion=?,
            updated_at=CURRENT_TIMESTAMP
            WHERE id=?`;
        db.run(sql, [
            data.title, data.passage, data.delimitacion, data.proposito, data.tesis,
            data.autoria, data.fecha_lugar, data.proposito_original,
            data.genero, data.relacion, data.estructura,
            data.analisis_palabras, data.gramatica, data.traduccion,
            data.ensenanza_original, data.mensaje_central,
            data.relevancia, data.ejemplos, data.resumen, data.reflexion,
            data.id
        ], (err) => { if (err) reject(err); else resolve({ success: true }); });
    });
}

function deleteExegesis(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM exegesis WHERE id=?`, [id], (err) => {
            if (err) reject(err); else resolve({ success: true });
        });
    });
}

module.exports = { getExegesisList, getExegesisById, saveExegesis, updateExegesis, deleteExegesis };