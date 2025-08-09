import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { checkBackendHealth, analyticsAPI } from '../services/api';
import { useAuth } from '../hooks/useAPI';

export default function Home() {
    const [backendStatus, setBackendStatus] = useState('checking');
    const [stats, setStats] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        checkBackend();
        if (user) {
            loadStats();
        }
    }, [user]);

    const checkBackend = async () => {
        try {
            const isHealthy = await checkBackendHealth();
            setBackendStatus(isHealthy ? 'connected' : 'error');
        } catch (error) {
            setBackendStatus('error');
        }
    };

    const loadStats = async () => {
        try {
            const data = await analyticsAPI.getAllStats();
            setStats(data);
        } catch (error) {
            console.error('Fehler beim Laden der Stats:', error);
        }
    };

    return (
        <div className="m-6">
            {/* Hero Section */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">
                    🥃 Willkommen zur Whisky Umfrage
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                    Teile deine Meinung über verschiedene Whiskys und entdecke,
                    was andere Whisky-Liebhaber denken.
                </p>

                {/* Backend Status */}
                <div className="mb-6">
                    {backendStatus === 'checking' && (
                        <div className="inline-flex items-center space-x-2 text-yellow-600">
                            <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse"></div>
                            <span>Backend-Verbindung prüfen...</span>
                        </div>
                    )}
                    {backendStatus === 'connected' && (
                        <div className="inline-flex items-center space-x-2 text-green-600">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span>✅ Backend verbunden</span>
                        </div>
                    )}
                    {backendStatus === 'error' && (
                        <div className="inline-flex items-center space-x-2 text-red-600">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            <span>❌ Backend nicht erreichbar</span>
                            <button
                                onClick={checkBackend}
                                className="ml-2 text-sm underline hover:no-underline"
                            >
                                Erneut prüfen
                            </button>
                        </div>
                    )}
                </div>

                {/* User Status */}
                {user && (
                    <div className="bg-card border border-border rounded-lg p-4 mb-6 inline-block">
                        <p className="text-sm text-muted-foreground mb-1">Angemeldet als</p>
                        <p className="font-semibold">{user.name}</p>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-card rounded-lg border border-border p-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                            {stats.total_whiskys || 0}
                        </div>
                        <div className="text-muted-foreground">Verschiedene Whiskys</div>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                            {stats.total_surveys || 0}
                        </div>
                        <div className="text-muted-foreground">Bewertungen gesamt</div>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-6 text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                            {stats.total_users || 0}
                        </div>
                        <div className="text-muted-foreground">Teilnehmer</div>
                    </div>
                </div>
            )}

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <Link
                    to="/umfrage"
                    className="group block bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-all hover:scale-105"
                >
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        Umfrage starten
                    </h3>
                    <p className="text-muted-foreground">
                        Bewerte verschiedene Whiskys nach Geruch, Geschmack und Gesamteindruck.
                        {user ? ' Du kannst direkt loslegen!' : ' Melde dich zuerst an.'}
                    </p>
                </Link>

                <Link
                    to="/analyse"
                    className="group block bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-all hover:scale-105"
                >
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        Ergebnisse ansehen
                    </h3>
                    <p className="text-muted-foreground">
                        Schaue dir die Bewertungen und Statistiken aller Teilnehmer an.
                        Welcher Whisky ist am beliebtesten?
                    </p>
                </Link>
            </div>

            {/* Info Section */}
            <div className="bg-card rounded-lg border border-border p-8">
                <h2 className="text-2xl font-semibold mb-4">Wie funktioniert es?</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-3xl mb-3">1️⃣</div>
                        <h3 className="font-semibold mb-2">Anmelden</h3>
                        <p className="text-sm text-muted-foreground">
                            Melde dich mit deinem Namen und dem Umfrage-Passwort an.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="text-3xl mb-3">2️⃣</div>
                        <h3 className="font-semibold mb-2">Bewerten</h3>
                        <p className="text-sm text-muted-foreground">
                            Bewerte Whiskys nach Geruch, Geschmack und gib eine Gesamtnote von 1-10.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="text-3xl mb-3">3️⃣</div>
                        <h3 className="font-semibold mb-2">Entdecken</h3>
                        <p className="text-sm text-muted-foreground">
                            Schaue dir die Ergebnisse aller Teilnehmer an und entdecke neue Favoriten.
                        </p>
                    </div>
                </div>
            </div>

            {/* Backend Error State */}
            {backendStatus === 'error' && (
                <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Backend nicht verfügbar
                    </h3>
                    <p className="text-red-700 mb-4">
                        Das Backend ist momentan nicht erreichbar. Einige Funktionen sind
                        möglicherweise eingeschränkt.
                    </p>
                    <div className="text-sm text-red-600">
                        <p className="font-medium mb-2">Prüfe folgende Punkte:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Ist das Backend gestartet? (<code>npm start</code> im backend Ordner)</li>
                            <li>Läuft es auf http://localhost:3001?</li>
                            <li>Sind alle Dependencies installiert?</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}