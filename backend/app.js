const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const path = require('path');

// Routes importieren
const authRoutes = require('./routes/auth');
const surveyRoutes = require('./routes/surveys');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

// Database initialisieren
const { initDatabase } = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Erlaubt Cross-Origin für Bilder
}));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vite Standard Port
    credentials: true
}));
app.use(express.json());

// Static files middleware mit CORS-Headern für Bilder
app.use('/images', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:5173');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}, express.static(path.join(__dirname, 'public/images')));

app.use(express.static('public')); // Für andere statische Dateien

// Logging Middleware (Debug)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Gesundheitscheck
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Whisky Backend läuft!',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint nicht gefunden' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Server Fehler:', err);
    res.status(500).json({
        error: 'Interner Server Fehler',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Etwas ist schiefgelaufen'
    });
});

// Server starten
async function startServer() {
    try {
        // Datenbank initialisieren
        await initDatabase();
        console.log('✅ Datenbank initialisiert');

        app.listen(PORT, () => {
            console.log(`🥃 Whisky Backend läuft auf Port ${PORT}`);
            console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
            console.log(`📸 Bilder verfügbar unter: http://localhost:${PORT}/images/`);
        });
    } catch (error) {
        console.error('❌ Server Start Fehler:', error);
        process.exit(1);
    }
}

startServer();