const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Database
const { initDatabase } = require('./models/database');

// Routes importieren (eins nach dem anderen testen)
const authRoutes = require('./routes/auth');
const surveyRoutes = require('./routes/surveys');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);

// Simple Test Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Whisky Backend läuft!',
        timestamp: new Date().toISOString()
    });
});

// Test wird durch auth route ersetzt

// Start Server
async function startServer() {
    try {
        // Datenbank initialisieren
        await initDatabase();
        console.log('✅ Datenbank initialisiert');

        app.listen(PORT, () => {
            console.log(`🥃 Test Backend läuft auf Port ${PORT}`);
            console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Server Start Fehler:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;