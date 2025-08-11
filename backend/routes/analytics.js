const express = require('express');
const { allQuery } = require('../models/database');
const router = express.Router();

// GET /api/analytics/top-whiskys - Top bewertete Whiskys mit Bildern
router.get('/top-whiskys', async (req, res) => {
    try {
        console.log('🔍 Loading top whiskys...');

        const topWhiskys = await allQuery(`
            SELECT 
                w.id,
                w.name,
                w.image_path,
                COALESCE(AVG(CAST(sr.bewertung AS DECIMAL(3,2))), 0) as average_rating,
                COUNT(sr.id) as total_reviews,
                COALESCE(SUM(sr.bewertung), 0) as total_rating
            FROM whiskys w
            LEFT JOIN survey_responses sr ON w.id = sr.whisky_id
            GROUP BY w.id, w.name, w.image_path
            ORDER BY 
                CASE WHEN COUNT(sr.id) = 0 THEN 1 ELSE 0 END,
                average_rating DESC, 
                total_reviews DESC
        `);

        console.log(`✅ Found ${topWhiskys.length} whiskys`);

        // Formatierte Daten mit Ranking
        const formattedTopWhiskys = topWhiskys.map((whisky, index) => ({
            rank: index + 1,
            id: whisky.id,
            name: whisky.name,
            image_path: whisky.image_path,
            description: whisky.description,
            averageRating: whisky.total_reviews > 0 ? Math.round(whisky.average_rating * 10) / 10 : 0,
            totalReviews: whisky.total_reviews || 0,
            totalRating: whisky.total_rating || 0
        }));

        console.log('📊 Top 3 Whiskys:', formattedTopWhiskys.slice(0, 3));
        res.json(formattedTopWhiskys);

    } catch (error) {
        console.error('❌ Top Whiskys Analytics Fehler:', error);
        res.status(500).json({
            error: 'Fehler beim Laden der Top Whiskys',
            details: error.message
        });
    }
});

// GET /api/analytics/geruch - Aggregierte Geruch-Daten
router.get('/geruch', async (req, res) => {
    try {
        console.log('🔍 Loading geruch data...');
        const responses = await allQuery('SELECT geruch FROM survey_responses WHERE geruch IS NOT NULL AND geruch != ""');

        // Alle Gerüche sammeln und zählen
        const geruchCount = {};
        responses.forEach(response => {
            if (response.geruch) {
                try {
                    const geruchArray = JSON.parse(response.geruch);
                    if (Array.isArray(geruchArray)) {
                        geruchArray.forEach(geruch => {
                            geruchCount[geruch] = (geruchCount[geruch] || 0) + 1;
                        });
                    }
                } catch (parseError) {
                    console.warn('⚠️ Could not parse geruch data:', response.geruch);
                }
            }
        });

        // In Format für Recharts konvertieren
        const data = Object.entries(geruchCount)
            .map(([name, votes]) => ({ name, votes }))
            .sort((a, b) => b.votes - a.votes);

        console.log(`✅ Found ${data.length} geruch categories`);
        res.json(data);
    } catch (error) {
        console.error('❌ Geruch Analytics Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Geruch-Daten' });
    }
});

// GET /api/analytics/geschmack - Aggregierte Geschmack-Daten
router.get('/geschmack', async (req, res) => {
    try {
        console.log('🔍 Loading geschmack data...');
        const responses = await allQuery('SELECT geschmack FROM survey_responses WHERE geschmack IS NOT NULL AND geschmack != ""');

        // Alle Geschmäcker sammeln und zählen
        const geschmackCount = {};
        responses.forEach(response => {
            if (response.geschmack) {
                try {
                    const geschmackArray = JSON.parse(response.geschmack);
                    if (Array.isArray(geschmackArray)) {
                        geschmackArray.forEach(geschmack => {
                            geschmackCount[geschmack] = (geschmackCount[geschmack] || 0) + 1;
                        });
                    }
                } catch (parseError) {
                    console.warn('⚠️ Could not parse geschmack data:', response.geschmack);
                }
            }
        });

        // In Format für Recharts konvertieren
        const data = Object.entries(geschmackCount)
            .map(([name, votes]) => ({ name, votes }))
            .sort((a, b) => b.votes - a.votes);

        console.log(`✅ Found ${data.length} geschmack categories`);
        res.json(data);
    } catch (error) {
        console.error('❌ Geschmack Analytics Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Geschmack-Daten' });
    }
});

// GET /api/analytics/bewertungen - Aggregierte Bewertungs-Daten
router.get('/bewertungen', async (req, res) => {
    try {
        console.log('🔍 Loading bewertung data...');
        const responses = await allQuery('SELECT bewertung FROM survey_responses WHERE bewertung IS NOT NULL');

        // Bewertungen zählen
        const bewertungCount = {};
        responses.forEach(response => {
            const rating = response.bewertung;
            const stars = `${rating} ⭐`;
            bewertungCount[stars] = (bewertungCount[stars] || 0) + 1;
        });

        // In Format für Recharts PieChart konvertieren
        const data = Object.entries(bewertungCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => parseInt(a.name) - parseInt(b.name));

        console.log(`✅ Found ratings distribution:`, data);
        res.json(data);
    } catch (error) {
        console.error('❌ Bewertung Analytics Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Bewertungs-Daten' });
    }
});

// GET /api/analytics/matrix - Daten für Whisky-Cluster-Matrix
router.get('/matrix', async (req, res) => {
    try {
        console.log('🔍 Loading matrix data...');

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
            WHERE sr.geruch IS NOT NULL OR sr.geschmack IS NOT NULL
        `);

        // Daten für WhiskyClusterMatrix Komponente formatieren
        const formattedResponses = responses.map(response => ({
            whiskyId: response.whisky_id,
            geruch: response.geruch ? (
                typeof response.geruch === 'string' ?
                    JSON.parse(response.geruch) : response.geruch
            ) : [],
            geschmack: response.geschmack ? (
                typeof response.geschmack === 'string' ?
                    JSON.parse(response.geschmack) : response.geschmack
            ) : [],
            bewertung: response.bewertung
        }));

        // Alle Whiskys für die Matrix
        const whiskys = await allQuery('SELECT id, name FROM whiskys ORDER BY name');

        console.log(`✅ Matrix data: ${formattedResponses.length} responses, ${whiskys.length} whiskys`);

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
        console.log('🔍 Loading summary data...');

        // Gesamtanzahl Umfragen
        const totalSurveys = await allQuery('SELECT COUNT(*) as count FROM survey_responses');

        // Anzahl unterschiedlicher Benutzer
        const totalUsers = await allQuery('SELECT COUNT(DISTINCT user_id) as count FROM survey_responses');

        // Durchschnittliche Bewertung
        const avgRating = await allQuery('SELECT AVG(CAST(bewertung AS DECIMAL(3,2))) as avg FROM survey_responses WHERE bewertung IS NOT NULL');

        // Beliebtester Whisky (meiste Bewertungen)
        const popularWhisky = await allQuery(`
            SELECT w.name, COUNT(*) as count 
            FROM survey_responses sr
            JOIN whiskys w ON sr.whisky_id = w.id
            GROUP BY sr.whisky_id, w.name
            ORDER BY count DESC
            LIMIT 1
        `);

        // Am besten bewerteter Whisky
        const topRatedWhisky = await allQuery(`
            SELECT w.name, AVG(CAST(sr.bewertung AS DECIMAL(3,2))) as avg_rating, COUNT(*) as review_count
            FROM survey_responses sr
            JOIN whiskys w ON sr.whisky_id = w.id
            WHERE sr.bewertung IS NOT NULL
            GROUP BY sr.whisky_id, w.name
            HAVING COUNT(*) >= 1
            ORDER BY avg_rating DESC, review_count DESC
            LIMIT 1
        `);

        const result = {
            totalSurveys: totalSurveys[0]?.count || 0,
            totalUsers: totalUsers[0]?.count || 0,
            averageRating: avgRating[0]?.avg ? Math.round(avgRating[0].avg * 10) / 10 : 0,
            popularWhisky: popularWhisky[0] || null,
            topRatedWhisky: topRatedWhisky[0] ? {
                ...topRatedWhisky[0],
                avg_rating: Math.round(topRatedWhisky[0].avg_rating * 10) / 10
            } : null
        };

        console.log('✅ Summary data:', result);
        res.json(result);
    } catch (error) {
        console.error('❌ Summary Analytics Fehler:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Zusammenfassung' });
    }
});

module.exports = router;