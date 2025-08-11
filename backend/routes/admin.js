const express = require('express');
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();

// Datenbank-Funktionen importieren
const database = require('../models/database');

// Speicherort und Dateiname für hochgeladene Bilder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../public/images"));
    },
    filename: (req, file, cb) => {
        // Filename wird später basierend auf Whisky-Name gesetzt
        // Hier verwenden wir erstmal einen temporären Namen
        const tempName = `temp_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, tempName);
    },
});
const upload = multer({ storage });

// Einfacher In-Memory Token-Speicher (später besser mit DB/JWT)
let validTokens = [];
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "geheim";

// Middleware: prüft ob Token gültig ist
function tokenAuth(req, res, next) {
    const token = req.headers["authorization"];
    if (!token || !validTokens.includes(token)) {
        return res.status(401).json({ error: "Nicht autorisiert" });
    }
    next();
}

// =======================
// LOGIN
// =======================
router.post("/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(32).toString("hex");
        validTokens.push(token);
        console.log("✅ Admin Login erfolgreich");
        return res.json({ token });
    }
    console.log("❌ Admin Login fehlgeschlagen");
    res.status(401).json({ error: "Falsches Passwort" });
});

// =======================
// WHISKY CRUD mit Datenbankanbindung
// =======================

// Alle Whiskys abrufen (geschützt)
router.get("/whiskys", tokenAuth, async (req, res) => {
    try {
        console.log("📋 Lade Whiskys aus Datenbank...");
        const whiskys = await database.allQuery('SELECT * FROM whiskys ORDER BY id DESC');
        console.log(`✅ ${whiskys.length} Whiskys geladen`);
        res.json(whiskys);
    } catch (error) {
        console.error('❌ Fehler beim Laden der Whiskys:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Whiskys aus der Datenbank' });
    }
});

// Whisky hinzufügen (geschützt + Bild-Upload)
router.post("/whiskys", tokenAuth, upload.single("image"), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Name erforderlich" });
        }

        const fs = require('fs');
        let finalImagePath = null;

        if (req.file) {
            // Whisky-Name für Dateinamen bereinigen (Sonderzeichen entfernen)
            const safeName = name.trim()
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_') // Alle nicht-alphanumerischen Zeichen durch _ ersetzen
                .replace(/_+/g, '_') // Mehrfache _ durch einzelne ersetzen
                .replace(/^_|_$/g, ''); // _ am Anfang/Ende entfernen

            const fileExtension = path.extname(req.file.originalname);
            const newFileName = `${safeName}${fileExtension}`;
            const tempPath = req.file.path;
            const finalPath = path.join(path.dirname(tempPath), newFileName);

            try {
                // Datei von temporärem Namen zum gewünschten Namen verschieben
                fs.renameSync(tempPath, finalPath);
                finalImagePath = newFileName; // Nur Dateiname, ohne /images/
                console.log(`📸 Bild umbenannt: ${req.file.filename} → ${newFileName}`);
            } catch (renameError) {
                console.error('❌ Fehler beim Umbenennen der Datei:', renameError);
                // Falls Umbenennen fehlschlägt, verwende temporären Namen
                finalImagePath = req.file.filename;
            }
        }

        console.log(`📝 Füge Whisky hinzu: "${name}"${finalImagePath ? ` (Bild: ${finalImagePath})` : ''}`);

        // Whisky in Datenbank einfügen
        const result = await database.runQuery(
            'INSERT INTO whiskys (name, image_path) VALUES (?, ?)',
            [name.trim(), finalImagePath] // Nur Dateiname ohne /images/
        );

        const newWhisky = {
            id: result.id,
            name: name.trim(),
            image_path: finalImagePath
        };

        console.log(`✅ Whisky hinzugefügt mit ID: ${result.id}`);
        res.json({ success: true, whisky: newWhisky });

    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen des Whiskys:', error);
        res.status(500).json({
            error: 'Fehler beim Hinzufügen des Whiskys zur Datenbank',
            message: error.message
        });
    }
});

// Whisky löschen (geschützt)
router.delete("/whiskys/:id", tokenAuth, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({ error: "Ungültige ID" });
        }

        console.log(`🗑️ Lösche Whisky mit ID: ${id}`);

        // Prüfen ob Whisky existiert
        const existingWhisky = await database.getQuery('SELECT * FROM whiskys WHERE id = ?', [id]);
        if (!existingWhisky) {
            return res.status(404).json({ error: "Whisky nicht gefunden" });
        }

        // Whisky löschen
        const result = await database.runQuery('DELETE FROM whiskys WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Whisky nicht gefunden" });
        }

        console.log(`✅ Whisky "${existingWhisky.name}" gelöscht`);
        res.json({ success: true, message: 'Whisky erfolgreich gelöscht' });

    } catch (error) {
        console.error('❌ Fehler beim Löschen des Whiskys:', error);
        res.status(500).json({
            error: 'Fehler beim Löschen des Whiskys aus der Datenbank',
            message: error.message
        });
    }
});

// Token-Cleanup (optional - entfernt alte Tokens)
router.post("/logout", tokenAuth, (req, res) => {
    const token = req.headers["authorization"];
    validTokens = validTokens.filter(t => t !== token);
    console.log("👋 Admin Logout");
    res.json({ success: true, message: "Logout erfolgreich" });
});

// Debug: Alle aktuellen Tokens anzeigen (nur in Development)
if (process.env.NODE_ENV === 'development') {
    router.get("/debug/tokens", (req, res) => {
        res.json({
            tokenCount: validTokens.length,
            tokens: validTokens.map(t => t.substring(0, 8) + '...')
        });
    });
}

module.exports = router;