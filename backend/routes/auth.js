const express = require('express');
const { runQuery, getQuery } = require('../models/database');
const router = express.Router();

// Das Passwort aus deiner Frontend-Komponente
const SURVEY_PASSWORD = process.env.SURVEY_PASSWORD || "WhiskyTasting123!";

// POST /api/auth/login - Benutzer anmelden
router.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;

        // Validierung
        if (!name || !password) {
            return res.status(400).json({
                error: 'Name und Passwort sind erforderlich'
            });
        }

        if (name.trim().length === 0) {
            return res.status(400).json({
                error: 'Name darf nicht leer sein'
            });
        }

        // Passwort prüfen
        if (password !== SURVEY_PASSWORD) {
            return res.status(401).json({
                error: 'Falsches Passwort'
            });
        }

        // Benutzer in Datenbank suchen oder erstellen
        const trimmedName = name.trim();
        let user = await getQuery('SELECT * FROM users WHERE name = ?', [trimmedName]);

        if (!user) {
            // Neuen Benutzer erstellen
            const result = await runQuery(
                'INSERT INTO users (name) VALUES (?)',
                [trimmedName]
            );
            user = { id: result.id, name: trimmedName };
            console.log(`👤 Neuer Benutzer erstellt: ${trimmedName}`);
        } else {
            console.log(`👤 Benutzer angemeldet: ${trimmedName}`);
        }

        res.json({
            success: true,
            message: 'Erfolgreich angemeldet',
            user: {
                id: user.id,
                name: user.name
            }
        });

    } catch (error) {
        console.error('❌ Login Fehler:', error);
        res.status(500).json({
            error: 'Anmeldung fehlgeschlagen',
            message: error.message
        });
    }
});

// POST /api/auth/logout - Benutzer abmelden (optional, fürs Frontend)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Erfolgreich abgemeldet'
    });
});

// GET /api/auth/check - Prüfen ob Name bereits existiert (optional)
router.get('/check/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const user = await getQuery('SELECT name FROM users WHERE name = ?', [name.trim()]);

        res.json({
            exists: !!user,
            name: name.trim()
        });
    } catch (error) {
        console.error('❌ User Check Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Prüfen des Benutzernamens' });
    }
});

module.exports = router;