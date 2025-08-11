import { useState, useEffect } from "react";
import Authorization from "../components/Authorization";
import { surveyAPI } from "../services/api";

const geruchOptions = [
    "Fruchtig",
    "Holzig",
    "Rauchig",
    "Floral",
    "Würzig",
];

const geschmackOptions = [
    "Süß",
    "Bitter",
    "Würzig",
    "Fruchtig",
    "Cremig",
];

export default function Umfrage() {
    const [authorizedUser, setAuthorizedUser] = useState(null);
    const [whiskys, setWhiskys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [selectedWhisky, setSelectedWhisky] = useState(null);
    const [submittedCurrent, setSubmittedCurrent] = useState(false);
    const [userSurveys, setUserSurveys] = useState([]);
    const [loadingSurveys, setLoadingSurveys] = useState(false);

    // Antworten als State
    const [geruch, setGeruch] = useState([]);
    const [geschmack, setGeschmack] = useState([]);
    const [bewertung, setBewertung] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Steuerung, ob ausgeblendete Whiskys gezeigt werden
    const [showAll, setShowAll] = useState(false);

    // Gespeicherten User aus localStorage laden beim Mount
    useEffect(() => {
        const savedUser = localStorage.getItem("authorizedUser");
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                setAuthorizedUser(user);
                console.log('✅ User aus localStorage geladen:', user);
            } catch (error) {
                console.error('❌ Fehler beim Laden des gespeicherten Users:', error);
                localStorage.removeItem("authorizedUser");
            }
        }
    }, []);

    // Whiskys laden beim Komponenten-Mount
    useEffect(() => {
        loadWhiskys();
    }, []);

    // User surveys laden wenn User eingeloggt ist
    useEffect(() => {
        if (authorizedUser) {
            loadUserSurveys();
        }
    }, [authorizedUser]);

    // Whiskys vom Backend laden
    const loadWhiskys = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await surveyAPI.getWhiskys();
            setWhiskys(data);
            console.log('✅ Whiskys geladen:', data);
            console.log('🖼️ Erste Whisky image_path:', data[0]?.image_path); // Debug
        } catch (error) {
            console.error('❌ Fehler beim Laden der Whiskys:', error);
            setError('Fehler beim Laden der Whiskys: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Hilfsfunktion um Bild-URL zu generieren
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath; // Schon vollständige URL

        // Relative Pfade zu vollständiger URL konvertieren
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
        const imageUrl = `${baseUrl}/images/${imagePath}`;
        console.log('🖼️ Generiere Bild-URL:', imageUrl); // Debug
        return imageUrl;
    };

    // Benutzer-Umfragen vom Backend laden
    const loadUserSurveys = async () => {
        if (!authorizedUser?.name) return;

        setLoadingSurveys(true);
        try {
            const surveys = await surveyAPI.getUserSurveys(authorizedUser.name);
            setUserSurveys(surveys);
            console.log('✅ User surveys geladen:', surveys.length);
        } catch (error) {
            console.error('❌ Fehler beim Laden der User-Surveys:', error);
            // Fehler nicht als kritisch behandeln
        } finally {
            setLoadingSurveys(false);
        }
    };

    // Bereits bewertete Whisky IDs ermitteln
    const submittedWhiskyIds = userSurveys.map(survey => survey.whisky_id);

    // Angezeigte Whiskys basierend auf showAll und bereits bewerteten
    const displayedWhiskys = showAll
        ? whiskys
        : whiskys.filter((w) => !submittedWhiskyIds.includes(w.id));

    // Login-Erfolg Handler
    const handleLoginSuccess = (user) => {
        setAuthorizedUser(user);
        // User im localStorage speichern für Persistierung
        localStorage.setItem("authorizedUser", JSON.stringify(user));
        console.log('✅ Login erfolgreich:', user);
    };

    // Logout Handler
    const handleLogout = async () => {
        try {
            // Optional: Logout API call (wenn implementiert)
            // await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setAuthorizedUser(null);
            setUserSurveys([]);
            // User aus localStorage entfernen
            localStorage.removeItem("authorizedUser");
        }
    };

    // Survey öffnen
    const openSurvey = (whisky) => {
        setSelectedWhisky(whisky);
        // Reset Antworten bei neuem Whisky
        setGeruch([]);
        setGeschmack([]);
        setBewertung(null);
        setSubmittedCurrent(false);
    };

    // Survey schließen
    const closeSurvey = () => {
        setSelectedWhisky(null);
        setSubmittedCurrent(false);
    };

    // Handhabung Mehrfachauswahl (Checkbox)
    const toggleSelection = (option, setState, state) => {
        if (state.includes(option)) {
            setState(state.filter((o) => o !== option));
        } else {
            setState([...state, option]);
        }
    };

    // Umfrage ans Backend senden
    const handleSubmit = async () => {
        if (!authorizedUser || !selectedWhisky) {
            alert('Fehler: Benutzer oder Whisky nicht gefunden');
            return;
        }

        if (!bewertung) {
            alert('Bitte gib eine Bewertung ab!');
            return;
        }

        setSubmitting(true);
        try {
            const surveyData = {
                user: authorizedUser.name,
                whisky: selectedWhisky.id, // Verwende ID statt Name
                geruch,
                geschmack,
                bewertung,
            };

            const result = await surveyAPI.submitSurvey(surveyData);
            console.log('✅ Umfrage erfolgreich gesendet:', result);

            setSubmittedCurrent(true);

            // User surveys neu laden um die Liste zu aktualisieren
            await loadUserSurveys();

        } catch (error) {
            console.error('❌ Fehler beim Senden der Umfrage:', error);
            alert('Fehler beim Senden der Umfrage: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Close Handler
    function handleClose() {
        closeSurvey();
    }

    // Wenn nicht eingeloggt, zeige Authorization
    if (!authorizedUser) {
        return <Authorization onSuccess={handleLoginSuccess} />;
    }

    // Loading-Zustand für Whiskys
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Lade Whiskys...</p>
                </div>
            </div>
        );
    }

    // Error-Zustand
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-destructive mb-4">❌ {error}</p>
                    <button
                        onClick={loadWhiskys}
                        className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                        Erneut versuchen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative m-6">
            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-card-foreground">Whisky Umfrage</h1>
                <div className="flex items-center gap-3">
                    {loadingSurveys && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="rounded bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="mb-4 flex justify-between items-center">
                <p className="text-muted-foreground">
                    Angemeldet als: <strong>{authorizedUser.name}</strong>
                    {userSurveys.length > 0 && (
                        <span className="ml-2 text-xs bg-primary/20 px-2 py-1 rounded">
                            {userSurveys.length} Bewertungen abgegeben
                        </span>
                    )}
                </p>
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                    {showAll ? "Nur neue Whiskys" : "Alle Whiskys"}
                </button>
            </div>

            {/* Keine Whiskys verfügbar */}
            {whiskys.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">Keine Whiskys verfügbar.</p>
                </div>
            )}

            {/* Alle Whiskys bereits bewertet */}
            {displayedWhiskys.length === 0 && whiskys.length > 0 && !showAll && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                        🎉 Du hast bereits alle verfügbaren Whiskys bewertet!
                    </p>
                    <button
                        onClick={() => setShowAll(true)}
                        className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                        Alle Bewertungen anzeigen
                    </button>
                </div>
            )}

            {/* Whisky Grid */}
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {displayedWhiskys.map((whisky) => {
                    const isRated = submittedWhiskyIds.includes(whisky.id);
                    return (
                        <div
                            key={whisky.id}
                            onClick={() => openSurvey(whisky)}
                            className={`cursor-pointer rounded-lg border border-border bg-background p-4 shadow-md hover:shadow-lg relative ${
                                isRated ? 'opacity-75' : ''
                            }`}
                        >
                            {/* Whisky Bild */}
                            <div className="mb-3 h-48 w-full rounded bg-muted flex items-center justify-center">
                                {whisky.image_path ? (
                                    <img
                                        src={getImageUrl(whisky.image_path)}
                                        alt={whisky.name}
                                        className="h-full w-full rounded object-cover"
                                        onError={(e) => {
                                            console.warn(`❌ Bild nicht geladen: ${e.target.src}`);
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`flex items-center justify-center text-muted-foreground text-sm ${whisky.image_path ? 'hidden' : ''}`}>
                                    🥃 {whisky.name}
                                </div>
                            </div>

                            <h2 className="text-lg font-semibold text-foreground mb-1">
                                {whisky.name}
                            </h2>

                            {whisky.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                    {whisky.description}
                                </p>
                            )}

                            {isRated && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                                    ✅ Bewertet
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Overlay */}
            {selectedWhisky && (
                <div
                    onClick={closeSurvey}
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                ></div>
            )}

            {/* Slide-up Survey Panel */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-auto rounded-t-lg border border-border bg-card p-6 text-card-foreground shadow-xl transition-transform duration-300 ${
                    selectedWhisky ? "translate-y-0" : "translate-y-full"
                }`}
            >
                {selectedWhisky && (
                    <>
                        <div className="mb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-semibold">{selectedWhisky.name}</h3>
                                {selectedWhisky.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedWhisky.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={closeSurvey}
                                className="rounded bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                            >
                                ✕
                            </button>
                        </div>

                        {submittedCurrent && (
                            <div className="mb-4 p-3 rounded bg-green-50 border border-green-200">
                                <p className="text-green-700 text-sm">
                                    ✅ Umfrage erfolgreich gesendet! Danke für deine Teilnahme.
                                </p>
                            </div>
                        )}

                        {!submittedCurrent && (
                            <>
                                {/* Frage 1: Geruch (Mehrfachauswahl) */}
                                <div className="mb-4">
                                    <p className="font-semibold mb-2">Wie ist der Geruch? (Mehrfachauswahl)</p>
                                    <div className="flex flex-wrap gap-3">
                                        {geruchOptions.map((opt) => (
                                            <label
                                                key={opt}
                                                className={`cursor-pointer rounded border px-3 py-1 select-none transition-colors ${
                                                    geruch.includes(opt)
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-background text-foreground hover:bg-muted"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={geruch.includes(opt)}
                                                    onChange={() => toggleSelection(opt, setGeruch, geruch)}
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Frage 2: Geschmack (Mehrfachauswahl) */}
                                <div className="mb-4">
                                    <p className="font-semibold mb-2">Wie ist der Geschmack? (Mehrfachauswahl)</p>
                                    <div className="flex flex-wrap gap-3">
                                        {geschmackOptions.map((opt) => (
                                            <label
                                                key={opt}
                                                className={`cursor-pointer rounded border px-3 py-1 select-none transition-colors ${
                                                    geschmack.includes(opt)
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-background text-foreground hover:bg-muted"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={geschmack.includes(opt)}
                                                    onChange={() => toggleSelection(opt, setGeschmack, geschmack)}
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Frage 3: Bewertung (Single Choice 1-5) */}
                                <div className="mb-6">
                                    <p className="font-semibold mb-2">
                                        Wie bewertest du diesen Whisky? <span className="text-destructive">*</span>
                                    </p>
                                    <div className="flex gap-3">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <label
                                                key={num}
                                                className={`cursor-pointer rounded border px-3 py-1 select-none transition-colors ${
                                                    bewertung === num
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-background text-foreground hover:bg-muted"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="bewertung"
                                                    className="hidden"
                                                    checked={bewertung === num}
                                                    onChange={() => setBewertung(num)}
                                                />
                                                {num} ⭐
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        onClick={handleSubmit}
                                        disabled={submitting || !bewertung}
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Sende...
                                            </>
                                        ) : (
                                            'Absenden'
                                        )}
                                    </button>
                                    <button
                                        className="rounded border px-4 py-2 hover:bg-muted"
                                        onClick={handleClose}
                                        disabled={submitting}
                                    >
                                        Schließen
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}