const express = require('express');
const { runQuery, getQuery } = require('../models/database');
const router = express.Router();

// Das Passwort aus deiner Frontend-Komponente
const SURVEY_PASSWORD = "WhiskyTasting123!";

// =============================================================
// NEU: Benutzer-Check Endpoint
// =============================================================
router.get('/check/:name', async (req, res) => {
    try {
        const name = req.params.name.trim();

        if (name.length === 0) {
            return res.status(400).json({ error: 'Name darf nicht leer sein' });
        }

        const user = await getQuery('SELECT * FROM users WHERE name = ?', [name]);
        res.json({ exists: !!user }); // true wenn gefunden, false sonst
    } catch (error) {
        console.error('❌ Fehler bei /auth/check:', error);
        res.status(500).json({ error: 'Benutzerprüfung fehlgeschlagen' });
    }
});

// =============================================================
// POST /api/auth/login - Benutzer anmelden
// =============================================================
router.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;

        // Validierung
        if (!name || !password) {
            return res.status(400).json({ error: 'Name und Passwort sind erforderlich' });
        }
        if (name.trim().length === 0) {
            return res.status(400).json({ error: 'Name darf nicht leer sein' });
        }

        // Passwort prüfen
        if (password !== SURVEY_PASSWORD) {
            return res.status(401).json({ error: 'Falsches Passwort' });
        }

        // Benutzer in DB suchen oder erstellen
        const trimmedName = name.trim();
        let user = await getQuery('SELECT * FROM users WHERE name = ?', [trimmedName]);

        if (!user) {
            const result = await runQuery('INSERT INTO users (name) VALUES (?)', [trimmedName]);
            user = { id: result.id, name: trimmedName };
            console.log(`👤 Neuer Benutzer erstellt: ${trimmedName}`);
        } else {
            console.log(`👤 Benutzer angemeldet: ${trimmedName}`);
        }

        res.json({
            success: true,
            message: 'Erfolgreich angemeldet',
            user: { id: user.id, name: user.name }
        });

    } catch (error) {
        console.error('❌ Login Fehler:', error);
        res.status(500).json({ error: 'Anmeldung fehlgeschlagen', message: error.message });
    }
});

// =============================================================
// POST /api/auth/logout - Benutzer abmelden
// =============================================================
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Erfolgreich abgemeldet' });
});

module.exports = router;
