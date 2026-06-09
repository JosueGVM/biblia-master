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
    dbPath = path.join(dataDir, 'outlines.db');
} else {
    dbPath = path.join(__dirname, 'outlines.db');
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Tabla principal — común a los 3 tipos
    db.run(`CREATE TABLE IF NOT EXISTS outlines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL, -- 'full' | 'simple' | 'free'
        title TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tipo 1: Homilético completo
    db.run(`CREATE TABLE IF NOT EXISTS outlines_full (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        outline_id INTEGER UNIQUE,
        theme TEXT,
        general_purpose TEXT,
        specific_purpose TEXT,
        bible_base TEXT,
        introduction TEXT,
        sermon_question TEXT,
        proposition TEXT,
        transition_prayer TEXT,
        key_word TEXT,
        conclusion_recap TEXT,
        conclusion_application TEXT,
        conclusion_invitation TEXT,
        FOREIGN KEY(outline_id) REFERENCES outlines(id) ON DELETE CASCADE
    )`);

    // Tipo 2: Sencillo
    db.run(`CREATE TABLE IF NOT EXISTS outlines_simple (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        outline_id INTEGER UNIQUE,
        bible_base TEXT,
        FOREIGN KEY(outline_id) REFERENCES outlines(id) ON DELETE CASCADE
    )`);

    // Tipo 3: Libre
    db.run(`CREATE TABLE IF NOT EXISTS outlines_free (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        outline_id INTEGER UNIQUE,
        content TEXT,
        FOREIGN KEY(outline_id) REFERENCES outlines(id) ON DELETE CASCADE
    )`);

    // Puntos principales — compartidos por 'full' y 'simple'
    db.run(`CREATE TABLE IF NOT EXISTS outline_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        outline_id INTEGER,
        order_num INTEGER,
        title TEXT,
        verse_ref TEXT,
        verse_text TEXT,
        development TEXT,
        transition TEXT,
        FOREIGN KEY(outline_id) REFERENCES outlines(id) ON DELETE CASCADE
    )`);
});

// ============================================
// FUNCIONES GENERALES
// ============================================

function getOutlines() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM outlines ORDER BY updated_at DESC`, [], (err, rows) => {
            if (err) reject(err); else resolve(rows || []);
        });
    });
}

function deleteOutline(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM outlines WHERE id=?`, [id], (err) => {
            if (err) reject(err); else resolve({ success: true });
        });
    });
}

// ============================================
// TIPO 1: HOMILÉTICO COMPLETO
// ============================================

function saveFullOutline(data) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO outlines (type, title) VALUES ('full', ?)`, [data.title], function(err) {
            if (err) { reject(err); return; }
            const outlineId = this.lastID;
            db.run(`INSERT INTO outlines_full 
                (outline_id, theme, general_purpose, specific_purpose, bible_base, introduction,
                 sermon_question, proposition, transition_prayer, key_word,
                 conclusion_recap, conclusion_application, conclusion_invitation)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [outlineId, data.theme, data.general_purpose, data.specific_purpose,
                 data.bible_base, data.introduction, data.sermon_question, data.proposition,
                 data.transition_prayer, data.key_word,
                 data.conclusion_recap, data.conclusion_application, data.conclusion_invitation],
                (err2) => { if (err2) reject(err2); else resolve({ id: outlineId }); }
            );
        });
    });
}

function updateFullOutline(data) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE outlines SET title=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [data.title, data.id], (err) => {
                if (err) { reject(err); return; }
                db.run(`UPDATE outlines_full SET
                    theme=?, general_purpose=?, specific_purpose=?, bible_base=?,
                    introduction=?, sermon_question=?, proposition=?, transition_prayer=?,
                    key_word=?, conclusion_recap=?, conclusion_application=?, conclusion_invitation=?
                    WHERE outline_id=?`,
                    [data.theme, data.general_purpose, data.specific_purpose, data.bible_base,
                     data.introduction, data.sermon_question, data.proposition, data.transition_prayer,
                     data.key_word, data.conclusion_recap, data.conclusion_application,
                     data.conclusion_invitation, data.id],
                    (err2) => { if (err2) reject(err2); else resolve({ success: true }); }
                );
            }
        );
    });
}

function getFullOutlineById(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT o.*, f.* FROM outlines o 
                LEFT JOIN outlines_full f ON o.id = f.outline_id 
                WHERE o.id=?`, [id], (err, outline) => {
            if (err) { reject(err); return; }
            db.all(`SELECT * FROM outline_points WHERE outline_id=? ORDER BY order_num ASC`,
                [id], (err2, points) => {
                    if (err2) reject(err2);
                    else resolve({ ...outline, points: points || [] });
                }
            );
        });
    });
}

// ============================================
// TIPO 2: SENCILLO
// ============================================

function saveSimpleOutline(data) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO outlines (type, title) VALUES ('simple', ?)`, [data.title], function(err) {
            if (err) { reject(err); return; }
            const outlineId = this.lastID;
            db.run(`INSERT INTO outlines_simple (outline_id, bible_base) VALUES (?,?)`,
                [outlineId, data.bible_base],
                (err2) => { if (err2) reject(err2); else resolve({ id: outlineId }); }
            );
        });
    });
}

function updateSimpleOutline(data) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE outlines SET title=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [data.title, data.id], (err) => {
                if (err) { reject(err); return; }
                db.run(`UPDATE outlines_simple SET bible_base=? WHERE outline_id=?`,
                    [data.bible_base, data.id],
                    (err2) => { if (err2) reject(err2); else resolve({ success: true }); }
                );
            }
        );
    });
}

function getSimpleOutlineById(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT o.*, s.* FROM outlines o 
                LEFT JOIN outlines_simple s ON o.id = s.outline_id 
                WHERE o.id=?`, [id], (err, outline) => {
            if (err) { reject(err); return; }
            db.all(`SELECT * FROM outline_points WHERE outline_id=? ORDER BY order_num ASC`,
                [id], (err2, points) => {
                    if (err2) reject(err2);
                    else resolve({ ...outline, points: points || [] });
                }
            );
        });
    });
}

// ============================================
// TIPO 3: LIBRE
// ============================================

function saveFreeOutline(data) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO outlines (type, title) VALUES ('free', ?)`, [data.title], function(err) {
            if (err) { reject(err); return; }
            const outlineId = this.lastID;
            db.run(`INSERT INTO outlines_free (outline_id, content) VALUES (?,?)`,
                [outlineId, data.content],
                (err2) => { if (err2) reject(err2); else resolve({ id: outlineId }); }
            );
        });
    });
}

function updateFreeOutline(data) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE outlines SET title=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
            [data.title, data.id], (err) => {
                if (err) { reject(err); return; }
                db.run(`UPDATE outlines_free SET content=? WHERE outline_id=?`,
                    [data.content, data.id],
                    (err2) => { if (err2) reject(err2); else resolve({ success: true }); }
                );
            }
        );
    });
}

function getFreeOutlineById(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT o.*, f.* FROM outlines o 
                LEFT JOIN outlines_free f ON o.id = f.outline_id 
                WHERE o.id=?`, [id], (err, outline) => {
            if (err) reject(err); else resolve(outline);
        });
    });
}

// ============================================
// PUNTOS PRINCIPALES (full y simple)
// ============================================

function saveOutlinePoints(outlineId, points) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM outline_points WHERE outline_id=?`, [outlineId], (err) => {
            if (err) { reject(err); return; }
            if (!points || points.length === 0) { resolve({ success: true }); return; }
            const stmt = db.prepare(`INSERT INTO outline_points 
                (outline_id, order_num, title, verse_ref, verse_text, development, transition)
                VALUES (?,?,?,?,?,?,?)`);
            points.forEach((p, i) => {
                stmt.run([outlineId, i + 1, p.title, p.verse_ref, p.verse_text, p.development, p.transition]);
            });
            stmt.finalize((err2) => {
                if (err2) reject(err2); else resolve({ success: true });
            });
        });
    });
}

module.exports = {
    getOutlines, deleteOutline,
    saveFullOutline, updateFullOutline, getFullOutlineById,
    saveSimpleOutline, updateSimpleOutline, getSimpleOutlineById,
    saveFreeOutline, updateFreeOutline, getFreeOutlineById,
    saveOutlinePoints
};