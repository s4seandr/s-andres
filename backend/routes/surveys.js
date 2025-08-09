const express = require('express');
const { runQuery, getQuery, allQuery } = require('../models/database');
const router = express.Router();

// GET /api/surveys/whiskys - Alle Whiskys abrufen
router.get('/whiskys', async (req, res) => {
    try {
        const whiskys = await allQuery('SELECT * FROM whiskys ORDER BY id');
        res.json(whiskys);
    } catch (error) {
        console.error('❌ Whiskys abrufen Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Whiskys' });
    }
});

// GET /api/surveys/user/:userName - Umfragen eines Benutzers abrufen
router.get('/user/:userName', async (req, res) => {
    try {
        const { userName } = req.params;

        // Benutzer finden
        const user = await getQuery('SELECT id FROM users WHERE name = ?', [userName]);
        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }

        // Alle Umfragen des Benutzers
        const responses = await allQuery(`
            SELECT
                sr.*,
                w.name as whisky_name
            FROM survey_responses sr
                     JOIN whiskys w ON sr.whisky_id = w.id
            WHERE sr.user_id = ?
            ORDER BY sr.submitted_at DESC
        `, [user.id]);

        // JSON Strings zurück zu Arrays konvertieren
        const formattedResponses = responses.map(response => ({
            ...response,
            geruch: response.geruch ? JSON.parse(response.geruch) : [],
            geschmack: response.geschmack ? JSON.parse(response.geschmack) : []
        }));

        res.json(formattedResponses);
    } catch (error) {
        console.error('❌ User Surveys Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Benutzer-Umfragen' });
    }
});

// POST /api/surveys/submit - Umfrage abschicken
router.post('/submit', async (req, res) => {
    try {
        const { user, whisky, geruch, geschmack, bewertung } = req.body;

        // Validierung
        if (!user || !whisky || !bewertung) {
            return res.status(400).json({
                error: 'Benutzer, Whisky und Bewertung sind erforderlich'
            });
        }

        if (bewertung < 1 || bewertung > 5) {
            return res.status(400).json({
                error: 'Bewertung muss zwischen 1 und 5 liegen'
            });
        }

        // Benutzer ID finden
        const userRecord = await getQuery('SELECT id FROM users WHERE name = ?', [user]);
        if (!userRecord) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }

        // Whisky ID finden (kann Name oder ID sein)
        let whiskyRecord;
        if (typeof whisky === 'string') {
            whiskyRecord = await getQuery('SELECT id FROM whiskys WHERE name = ?', [whisky]);
        } else {
            whiskyRecord = await getQuery('SELECT id FROM whiskys WHERE id = ?', [whisky]);
        }

        if (!whiskyRecord) {
            return res.status(404).json({ error: 'Whisky nicht gefunden' });
        }

        // Prüfen ob bereits eine Umfrage für diesen Whisky existiert
        const existingResponse = await getQuery(`
            SELECT id FROM survey_responses
            WHERE user_id = ? AND whisky_id = ?
        `, [userRecord.id, whiskyRecord.id]);

        if (existingResponse) {
            return res.status(400).json({
                error: 'Du hast diesen Whisky bereits bewertet'
            });
        }

        // Umfrage in Datenbank speichern
        const result = await runQuery(`
            INSERT INTO survey_responses (user_id, whisky_id, geruch, geschmack, bewertung)
            VALUES (?, ?, ?, ?, ?)
        `, [
            userRecord.id,
            whiskyRecord.id,
            JSON.stringify(geruch || []),
            JSON.stringify(geschmack || []),
            bewertung
        ]);

        console.log(`📝 Neue Umfrage eingegangen: ${user} -> Whisky ID ${whiskyRecord.id} (${bewertung}⭐)`);

        res.json({
            success: true,
            message: 'Umfrage erfolgreich gespeichert',
            responseId: result.id
        });

    } catch (error) {
        console.error('❌ Survey Submit Fehler:', error);
        res.status(500).json({
            error: 'Fehler beim Speichern der Umfrage',
            message: error.message
        });
    }
});

// GET /api/surveys/responses - Alle Umfrageantworten (für Admin/Debug)
router.get('/responses', async (req, res) => {
    try {
        const responses = await allQuery(`
            SELECT
                sr.*,
                u.name as user_name,
                w.name as whisky_name
            FROM survey_responses sr
                     JOIN users u ON sr.user_id = u.id
                     JOIN whiskys w ON sr.whisky_id = w.id
            ORDER BY sr.submitted_at DESC
        `);

        // JSON Strings konvertieren
        const formattedResponses = responses.map(response => ({
            ...response,
            geruch: response.geruch ? JSON.parse(response.geruch) : [],
            geschmack: response.geschmack ? JSON.parse(response.geschmack) : []
        }));

        res.json(formattedResponses);
    } catch (error) {
        console.error('❌ All Responses Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden aller Antworten' });
    }
});

// DELETE /api/surveys/reset/:userName - Alle Umfragen eines Benutzers löschen (optional)
router.delete('/reset/:userName', async (req, res) => {
    try {
        const { userName } = req.params;

        const user = await getQuery('SELECT id FROM users WHERE name = ?', [userName]);
        if (!user) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }

        const result = await runQuery('DELETE FROM survey_responses WHERE user_id = ?', [user.id]);

        console.log(`🗑️ ${result.changes} Umfragen von ${userName} gelöscht`);

        res.json({
            success: true,
            message: `${result.changes} Umfragen gelöscht`,
            deletedCount: result.changes
        });
    } catch (error) {
        console.error('❌ Survey Reset Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Löschen der Umfragen' });
    }
});

module.exports = router;