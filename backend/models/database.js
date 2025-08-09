const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Datenbank Pfad
const DB_PATH = path.join(__dirname, '..', 'whisky_survey.db');

// Datenbank Connection
let db = null;

function getDatabase() {
    if (!db) {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Datenbank Verbindungsfehler:', err);
            } else {
                console.log('✅ SQLite Datenbank verbunden');
            }
        });
    }
    return db;
}

// Datenbank initialisieren und Tabellen erstellen
async function initDatabase() {
    return new Promise((resolve, reject) => {
        const database = getDatabase();

        // Users Tabelle
        database.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Users Tabelle Fehler:', err);
                reject(err);
                return;
            }
        });

        // Whiskys Tabelle
        database.run(`
            CREATE TABLE IF NOT EXISTS whiskys (
                id INTEGER PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                image_path VARCHAR(500)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Whiskys Tabelle Fehler:', err);
                reject(err);
                return;
            }
        });

        // Survey Responses Tabelle
        database.run(`
            CREATE TABLE IF NOT EXISTS survey_responses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                whisky_id INTEGER NOT NULL,
                geruch TEXT, -- JSON String: ["Fruchtig", "Holzig"]
                geschmack TEXT, -- JSON String: ["Süß", "Cremig"] 
                bewertung INTEGER NOT NULL CHECK(bewertung >= 1 AND bewertung <= 5),
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (whisky_id) REFERENCES whiskys(id)
            )
        `, (err) => {
            if (err) {
                console.error('❌ Survey Responses Tabelle Fehler:', err);
                reject(err);
                return;
            }

            // Beispiel-Whiskys einfügen
            insertSampleWhiskys();
            resolve();
        });
    });
}

// Beispiel Whiskys einfügen (falls noch nicht vorhanden)
function insertSampleWhiskys() {
    const database = getDatabase();

    const whiskys = [
        { id: 1, name: "Glenfiddich 12 Jahre", image_path: "/images/glenfiddich.jpg" },
        { id: 2, name: "Lagavulin 16 Jahre", image_path: "/images/lagavulin.jpg" },
        { id: 3, name: "Macallan Sherry Oak", image_path: "/images/macallan.jpg" }
    ];

    const stmt = database.prepare(`
        INSERT OR IGNORE INTO whiskys (id, name, image_path) 
        VALUES (?, ?, ?)
    `);

    whiskys.forEach(whisky => {
        stmt.run(whisky.id, whisky.name, whisky.image_path);
    });

    stmt.finalize();
    console.log('✅ Beispiel-Whiskys eingefügt');
}

// Helper Funktionen für Datenbankabfragen
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        const database = getDatabase();
        database.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        const database = getDatabase();
        database.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        const database = getDatabase();
        database.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Graceful Shutdown
process.on('SIGINT', () => {
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('❌ Datenbank Schließen Fehler:', err);
            } else {
                console.log('✅ Datenbank Verbindung geschlossen');
            }
        });
    }
    process.exit(0);
});

module.exports = {
    initDatabase,
    getDatabase,
    runQuery,
    getQuery,
    allQuery
};