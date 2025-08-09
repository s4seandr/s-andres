import { useState, useEffect } from "react";
import Authorization from "../components/Authorization";
import { surveyAPI } from "../services/api";

const geruchOptions = [
    "Fruchtig", "Holzig", "Rauchig", "Floral", "Würzig",
];

const geschmackOptions = [
    "Süß", "Bitter", "Würzig", "Fruchtig", "Cremig",
];

export default function Umfrage() {
    // User State
    const [user, setUser] = useState(null);

    // Data State
    const [whiskys, setWhiskys] = useState([]);
    const [userSurveys, setUserSurveys] = useState([]);
    const [selectedWhisky, setSelectedWhisky] = useState(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showAll, setShowAll] = useState(false);

    // Survey Form State
    const [geruch, setGeruch] = useState([]);
    const [geschmack, setGeschmack] = useState([]);
    const [bewertung, setBewertung] = useState(null);

    // User aus localStorage laden
    useEffect(() => {
        const savedUser = localStorage.getItem("whiskyUser");
        if (savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
            } catch (error) {
                console.error("Fehler beim Laden des Users:", error);
                localStorage.removeItem("whiskyUser");
            }
        }
    }, []);

    // Daten laden wenn User angemeldet ist
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Parallel laden für bessere Performance
            const [whiskysResult, surveysResult] = await Promise.all([
                surveyAPI.getWhiskys(),
                surveyAPI.getUserSurveys(user.id)
            ]);

            setWhiskys(whiskysResult);
            setUserSurveys(surveysResult);
        } catch (error) {
            console.error("Fehler beim Laden der Daten:", error);
            setError(`Fehler beim Laden der Daten: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        localStorage.setItem("whiskyUser", JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("whiskyUser");
        setWhiskys([]);
        setUserSurveys([]);
    };

    const openSurvey = (whisky) => {
        setSelectedWhisky(whisky);
        // Reset form
        setGeruch([]);
        setGeschmack([]);
        setBewertung(null);
    };

    const closeSurvey = () => {
        setSelectedWhisky(null);
        setGeruch([]);
        setGeschmack([]);
        setBewertung(null);
    };

    const toggleSelection = (option, setState, state) => {
        if (state.includes(option)) {
            setState(state.filter((o) => o !== option));
        } else {
            setState([...state, option]);
        }
    };

    const handleSubmit = async () => {
        // Validierung
        if (!bewertung) {
            alert("Bitte gib eine Bewertung ab!");
            return;
        }

        if (geruch.length === 0) {
            alert("Bitte wähle mindestens einen Geruch!");
            return;
        }

        if (geschmack.length === 0) {
            alert("Bitte wähle mindestens einen Geschmack!");
            return;
        }

        setSubmitting(true);

        try {
            const surveyData = {
                user_id: user.id,
                whisky_id: selectedWhisky.id,
                geruch: JSON.stringify(geruch),
                geschmack: JSON.stringify(geschmack),
                bewertung: bewertung
            };

            const result = await surveyAPI.submitSurvey(surveyData);

            if (result.success) {
                alert("Danke für deine Bewertung! 🥃");

                // Survey zu User-Surveys hinzufügen (für UI Update)
                const newSurvey = {
                    id: result.survey_id,
                    whisky_id: selectedWhisky.id,
                    user_id: user.id,
                    geruch: JSON.stringify(geruch),
                    geschmack: JSON.stringify(geschmack),
                    bewertung: bewertung,
                    submitted_at: new Date().toISOString()
                };

                setUserSurveys(prev => [...prev, newSurvey]);
                closeSurvey();
            }
        } catch (error) {
            console.error("Fehler beim Absenden:", error);
            alert(`Fehler beim Absenden: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Nicht angemeldet
    if (!user) {
        return <Authorization onSuccess={handleLoginSuccess} />;
    }

    // Loading State
    if (loading) {
        return (
            <div className="m-6 text-center">
                <div className="text-lg mb-2">🥃</div>
                <p>Lade Whiskys...</p>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="m-6">
                <div className="bg-red-50 border border-red-200 rounded p-4">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">Fehler</h2>
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={loadData}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Erneut versuchen
                    </button>
                </div>
            </div>
        );
    }

    // Bereits bewertete Whiskys
    const completedWhiskyIds = userSurveys.map(survey => survey.whisky_id);

    // Angezeigte Whiskys basierend auf showAll
    const displayedWhiskys = showAll
        ? whiskys
        : whiskys.filter(whisky => !completedWhiskyIds.includes(whisky.id));

    const availableCount = whiskys.length - completedWhiskyIds.length;

    return (
        <div className="relative m-6">
            {/* Header */}
            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-card-foreground">Whisky Umfrage</h1>
                <button
                    onClick={handleLogout}
                    className="rounded bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                >
                    Logout
                </button>
            </div>

            {/* User Info */}
            <div className="mb-4 p-4 bg-card rounded-lg border border-border">
                <p className="text-card-foreground">
                    Angemeldet als: <strong>{user.name}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                    {availableCount} von {whiskys.length} Whiskys noch zu bewerten
                    {userSurveys.length > 0 && ` • ${userSurveys.length} bereits bewertet`}
                </p>
            </div>

            {/* Show All Toggle */}
            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                    {showAll ? "Nur verfügbare anzeigen" : "Alle Whiskys anzeigen"}
                </button>
            </div>

            {/* Whiskys Grid */}
            {displayedWhiskys.length === 0 && !showAll ? (
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold mb-2">Alle Whiskys bewertet!</h2>
                    <p className="text-muted-foreground mb-4">
                        Du hast bereits alle {whiskys.length} verfügbaren Whiskys bewertet.
                    </p>
                    <button
                        onClick={() => setShowAll(true)}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                        Alle Bewertungen anzeigen
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                    {displayedWhiskys.map((whisky) => {
                        const isCompleted = completedWhiskyIds.includes(whisky.id);

                        return (
                            <div
                                key={whisky.id}
                                onClick={() => !isCompleted && openSurvey(whisky)}
                                className={`rounded-lg border border-border bg-background p-4 shadow-md transition-all ${
                                    isCompleted
                                        ? "opacity-60 cursor-default"
                                        : "cursor-pointer hover:shadow-lg hover:scale-105"
                                }`}
                            >
                                {whisky.image_path && (
                                    <img
                                        src={`http://localhost:3001/${whisky.image_path}`}
                                        alt={whisky.name}
                                        className="mb-3 h-48 w-full rounded object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                )}

                                <h2 className="text-lg font-semibold text-foreground mb-2">
                                    {whisky.name}
                                </h2>

                                {isCompleted && (
                                    <div className="text-sm text-green-600 font-medium">
                                        ✅ Bereits bewertet
                                    </div>
                                )}

                                {!isCompleted && (
                                    <div className="text-sm text-muted-foreground">
                                        Klicken zum Bewerten
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Survey Modal */}
            {selectedWhisky && (
                <>
                    {/* Overlay */}
                    <div
                        onClick={closeSurvey}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-auto rounded-t-lg border border-border bg-card p-6 text-card-foreground shadow-xl">
                        {/* Modal Header */}
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-xl font-bold">{selectedWhisky.name}</h3>
                            <button
                                onClick={closeSurvey}
                                className="rounded bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Geruch */}
                        <div className="mb-6">
                            <p className="font-semibold mb-3 text-foreground">
                                Wie riecht der Whisky? *
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {geruchOptions.map((opt) => (
                                    <label
                                        key={opt}
                                        className={`cursor-pointer rounded border px-3 py-2 select-none text-sm transition-colors ${
                                            geruch.includes(opt)
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-foreground hover:bg-secondary"
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

                        {/* Geschmack */}
                        <div className="mb-6">
                            <p className="font-semibold mb-3 text-foreground">
                                Wie schmeckt der Whisky? *
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {geschmackOptions.map((opt) => (
                                    <label
                                        key={opt}
                                        className={`cursor-pointer rounded border px-3 py-2 select-none text-sm transition-colors ${
                                            geschmack.includes(opt)
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-foreground hover:bg-secondary"
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

                        {/* Bewertung */}
                        <div className="mb-6">
                            <p className="font-semibold mb-3 text-foreground">
                                Gesamtbewertung (1-10) *
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <label
                                        key={num}
                                        className={`cursor-pointer rounded border px-4 py-2 select-none font-medium transition-colors ${
                                            bewertung === num
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-foreground hover:bg-secondary"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="bewertung"
                                            className="hidden"
                                            checked={bewertung === num}
                                            onChange={() => setBewertung(num)}
                                        />
                                        {num}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <button
                                onClick={closeSurvey}
                                className="px-6 py-2 rounded border border-border text-foreground hover:bg-secondary transition-colors"
                                disabled={submitting}
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !bewertung || geruch.length === 0 || geschmack.length === 0}
                                className="px-6 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {submitting ? "Wird gespeichert..." : "Bewertung absenden"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}