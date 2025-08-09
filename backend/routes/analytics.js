const express = require('express');
const { allQuery } = require('../models/database');
const router = express.Router();

// GET /api/analytics/geruch - Aggregierte Geruch-Daten
router.get('/geruch', async (req, res) => {
    try {
        const responses = await allQuery('SELECT geruch FROM survey_responses WHERE geruch IS NOT NULL');

        // Alle Gerüche sammeln und zählen
        const geruchCount = {};
        responses.forEach(response => {
            if (response.geruch) {
                const geruchArray = JSON.parse(response.geruch);
                geruchArray.forEach(geruch => {
                    geruchCount[geruch] = (geruchCount[geruch] || 0) + 1;
                });
            }
        });

        // In Format für Recharts konvertieren
        const data = Object.entries(geruchCount).map(([name, votes]) => ({
            name,
            votes
        }));

        res.json(data);
    } catch (error) {
        console.error('❌ Geruch Analytics Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Geruch-Daten' });
    }
});

// GET /api/analytics/geschmack - Aggregierte Geschmack-Daten
router.get('/geschmack', async (req, res) => {
    try {
        const responses = await allQuery('SELECT geschmack FROM survey_responses WHERE geschmack IS NOT NULL');

        // Alle Geschmäcker sammeln und zählen
        const geschmackCount = {};
        responses.forEach(response => {
            if (response.geschmack) {
                const geschmackArray = JSON.parse(response.geschmack);
                geschmackArray.forEach(geschmack => {
                    geschmackCount[geschmack] = (geschmackCount[geschmack] || 0) + 1;
                });
            }
        });

        // In Format für Recharts konvertieren
        const data = Object.entries(geschmackCount).map(([name, votes]) => ({
            name,
            votes
        }));

        res.json(data);
    } catch (error) {
        console.error('❌ Geschmack Analytics Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Geschmack-Daten' });
    }
});

// GET /api/analytics/bewertungen - Aggregierte Bewertungs-Daten
router.get('/bewertungen', async (req, res) => {
    try {
        const responses = await allQuery('SELECT bewertung FROM survey_responses WHERE bewertung IS NOT NULL');

        // Bewertungen zählen
        const bewertungCount = {};
        responses.forEach(response => {
            const stars = "⭐".repeat(response.bewertung);
            bewertungCount[stars] = (bewertungCount[stars] || 0) + 1;
        });

        // In Format für Recharts PieChart konvertieren
        const data = Object.entries(bewertungCount).map(([name, value]) => ({
            name,
            value
        }));

        res.json(data);
    } catch (error) {
        console.error('❌ Bewertung Analytics Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Bewertungs-Daten' });
    }
});

// GET /api/analytics/matrix - Daten für Whisky-Cluster-Matrix
router.get('/matrix', async (req, res) => {
    try {
        // Alle Responses mit Whisky-Infos laden
        const responses = await allQuery(`
            SELECT 
                sr.whisky_id,
                sr.geruch,
                sr.geschmack, 
                sr.bewertung,
                w.name as whisky_name
            FROM survey_responses sr
            JOIN whiskys w ON sr.whisky_id = w.id
        `);

        // Daten für deine WhiskyClusterMatrix Komponente formatieren
        const formattedResponses = responses.map(response => ({
            whiskyId: response.whisky_id,
            geruch: response.geruch ? JSON.parse(response.geruch) : [],
            geschmack: response.geschmack ? JSON.parse(response.geschmack) : [],
            bewertung: response.bewertung
        }));

        // Alle Whiskys für die Matrix
        const whiskys = await allQuery('SELECT id, name FROM whiskys ORDER BY id');

        res.json({
            responses: formattedResponses,
            whiskys: whiskys
        });
    } catch (error) {
        console.error('❌ Matrix Analytics Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Matrix-Daten' });
    }
});

// GET /api/analytics/summary - Übersicht aller Statistiken
router.get('/summary', async (req, res) => {
    try {
        // Gesamtanzahl Umfragen
        const totalSurveys = await allQuery('SELECT COUNT(*) as count FROM survey_responses');

        // Anzahl unterschiedlicher Benutzer
        const totalUsers = await allQuery('SELECT COUNT(DISTINCT user_id) as count FROM survey_responses');

        // Durchschnittliche Bewertung
        const avgRating = await allQuery('SELECT AVG(bewertung) as avg FROM survey_responses');

        // Beliebtester Whisky (meiste Bewertungen)
        const popularWhisky = await allQuery(`
            SELECT w.name, COUNT(*) as count 
            FROM survey_responses sr
            JOIN whiskys w ON sr.whisky_id = w.id
            GROUP BY sr.whisky_id
            ORDER BY count DESC
            LIMIT 1
        `);

        // Am besten bewerteter Whisky
        const topRatedWhisky = await allQuery(`
            SELECT w.name, AVG(sr.bewertung) as avg_rating, COUNT(*) as review_count
            FROM survey_responses sr
            JOIN whiskys w ON sr.whisky_id = w.id
            GROUP BY sr.whisky_id
            HAVING COUNT(*) >= 1
            ORDER BY avg_rating DESC
            LIMIT 1
        `);

        res.json({
            totalSurveys: totalSurveys[0]?.count || 0,
            totalUsers: totalUsers[0]?.count || 0,
            averageRating: Math.round((avgRating[0]?.avg || 0) * 10) / 10,
            popularWhisky: popularWhisky[0] || null,
            topRatedWhisky: topRatedWhisky[0] || null
        });
    } catch (error) {
        console.error('❌ Summary Analytics Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Zusammenfassung' });
    }
});

module.exports = router;