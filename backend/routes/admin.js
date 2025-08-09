const express = require('express');
const { runQuery, getQuery, allQuery } = require('../models/database');
const router = express.Router();

// ADMIN PASSWORD - Für zusätzliche Sicherheit
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Middleware für Admin-Authentifizierung
const adminAuth = (req, res, next) => {
    const { adminpassword } = req.headers;

    if (adminpassword !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Admin-Passwort erforderlich' });
    }
    next();
};

// =============================================================================
// WHISKY MANAGEMENT
// =============================================================================

// GET /api/admin/whiskys - Alle Whiskys mit Details
router.get('/whiskys', adminAuth, async (req, res) => {
    try {
        const whiskys = await allQuery(`
            SELECT 
                w.*,
                COUNT(sr.id) as survey_count,
                AVG(sr.bewertung) as avg_rating
            FROM whiskys w
            LEFT JOIN survey_responses sr ON w.id = sr.whisky_id
            GROUP BY w.id
            ORDER BY w.id
        `);

        res.json(whiskys);
    } catch (error) {
        console.error('❌ Admin Whiskys Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Whiskys' });
    }
});

// POST /api/admin/whiskys - Neuen Whisky hinzufügen
router.post('/whiskys', adminAuth, async (req, res) => {
    try {
        const { name, image_path } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Whisky-Name ist erforderlich' });
        }

        const result = await runQuery(
            'INSERT INTO whiskys (name, image_path) VALUES (?, ?)',
            [name, image_path || null]
        );

        res.json({
            success: true,
            message: 'Whisky hinzugefügt',
            whisky: { id: result.id, name, image_path }
        });
    } catch (error) {
        console.error('❌ Admin Add Whisky Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Hinzufügen des Whiskys' });
    }
});

// PUT /api/admin/whiskys/:id - Whisky bearbeiten
router.put('/whiskys/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image_path } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Whisky-Name ist erforderlich' });
        }

        const result = await runQuery(
            'UPDATE whiskys SET name = ?, image_path = ? WHERE id = ?',
            [name, image_path, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Whisky nicht gefunden' });
        }

        res.json({
            success: true,
            message: 'Whisky aktualisiert',
            whisky: { id, name, image_path }
        });
    } catch (error) {
        console.error('❌ Admin Update Whisky Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Whiskys' });
    }
});

// DELETE /api/admin/whiskys/:id - Whisky löschen
router.delete('/whiskys/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Erst prüfen ob Umfragen existieren
        const responses = await allQuery('SELECT COUNT(*) as count FROM survey_responses WHERE whisky_id = ?', [id]);

        if (responses[0].count > 0) {
            return res.status(400).json({
                error: `Kann Whisky nicht löschen: ${responses[0].count} Umfrage(n) vorhanden`,
                survey_count: responses[0].count
            });
        }

        const result = await runQuery('DELETE FROM whiskys WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Whisky nicht gefunden' });
        }

        res.json({
            success: true,
            message: 'Whisky gelöscht'
        });
    } catch (error) {
        console.error('❌ Admin Delete Whisky Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Whiskys' });
    }
});

// =============================================================================
// USER MANAGEMENT
// =============================================================================

// GET /api/admin/users - Alle Benutzer
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await allQuery(`
            SELECT 
                u.*,
                COUNT(sr.id) as survey_count,
                MAX(sr.submitted_at) as last_survey
            FROM users u
            LEFT JOIN survey_responses sr ON u.id = sr.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);

        res.json(users);
    } catch (error) {
        console.error('❌ Admin Users Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Benutzer' });
    }
});

// =============================================================================
// SURVEY MANAGEMENT
// =============================================================================

// GET /api/admin/surveys - Alle Umfragen
router.get('/surveys', adminAuth, async (req, res) => {
    try {
        const surveys = await allQuery(`
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
        const formattedSurveys = surveys.map(survey => ({
            ...survey,
            geruch: survey.geruch ? JSON.parse(survey.geruch) : [],
            geschmack: survey.geschmack ? JSON.parse(survey.geschmack) : []
        }));

        res.json(formattedSurveys);
    } catch (error) {
        console.error('❌ Admin Surveys Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Umfragen' });
    }
});

// DELETE /api/admin/surveys/:id - Umfrage löschen
router.delete('/surveys/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await runQuery('DELETE FROM survey_responses WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Umfrage nicht gefunden' });
        }

        res.json({
            success: true,
            message: 'Umfrage gelöscht'
        });
    } catch (error) {
        console.error('❌ Admin Delete Survey Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Löschen der Umfrage' });
    }
});

// =============================================================================
// DATABASE STATS
// =============================================================================

// GET /api/admin/stats - Datenbank-Statistiken
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const stats = {
            whiskys: await getQuery('SELECT COUNT(*) as count FROM whiskys'),
            users: await getQuery('SELECT COUNT(*) as count FROM users'),
            surveys: await getQuery('SELECT COUNT(*) as count FROM survey_responses'),
            avgRating: await getQuery('SELECT AVG(bewertung) as avg FROM survey_responses'),
            lastSurvey: await getQuery('SELECT MAX(submitted_at) as last FROM survey_responses')
        };

        res.json({
            whisky_count: stats.whiskys.count,
            user_count: stats.users.count,
            survey_count: stats.surveys.count,
            average_rating: Math.round((stats.avgRating.avg || 0) * 10) / 10,
            last_survey: stats.lastSurvey.last
        });
    } catch (error) {
        console.error('❌ Admin Stats Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Statistiken' });
    }
});

module.exports = router;