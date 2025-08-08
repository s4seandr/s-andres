import { useState, useEffect } from "react";
import Authorization from "../components/Authorization";
import glenfiddichImg from "../assets/glenfiddich.jpg";
import lagavulinImg from "../assets/lagavulin.jpg";
import macallanImg from "../assets/macallan.jpg";

const PASSWORD = "meinGeheimesPasswort";

const whiskys = [
    { id: 1, name: "Glenfiddich 12 Jahre", image: glenfiddichImg },
    { id: 2, name: "Lagavulin 16 Jahre", image: lagavulinImg },
    { id: 3, name: "Macallan Sherry Oak", image: macallanImg },
];

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
    const [authorizedName, setAuthorizedName] = useState(null);
    const [selectedWhisky, setSelectedWhisky] = useState(null);
    const [submittedCurrent, setSubmittedCurrent] = useState(false);
    const [submittedWhiskys, setSubmittedWhiskys] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("submittedWhiskys");
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });


    // Antworten als State
    const [geruch, setGeruch] = useState([]);
    const [geschmack, setGeschmack] = useState([]);
    const [bewertung, setBewertung] = useState(null);

    // Steuerung, ob ausgeblendete Whiskys gezeigt werden
    const [showAll, setShowAll] = useState(false);

    const displayedWhiskys = showAll
        ? whiskys
        : whiskys.filter((w) => !submittedWhiskys.includes(w.id));

    // Persistiere submittedWhiskys immer im localStorage
    useEffect(() => {
        localStorage.setItem("submittedWhiskys", JSON.stringify(submittedWhiskys));
    }, [submittedWhiskys]);


    useEffect(() => {
        const savedName = localStorage.getItem("authorizedName");
        if (savedName) {
            setAuthorizedName(savedName);
        }
    }, []);

    const handleLoginSuccess = (name) => {
        setAuthorizedName(name);
        localStorage.setItem("authorizedName", name);
    };

    const handleLogout = () => {
        setAuthorizedName(null);
        localStorage.removeItem("authorizedName");
    };

    const openSurvey = (whisky) => {
        setSelectedWhisky(whisky);
        // Reset Antworten bei neuem Whisky
        setGeruch([]);
        setGeschmack([]);
        setBewertung(null);
    };

    const closeSurvey = () => {
        setSelectedWhisky(null);
    };

    // Handhabung Mehrfachauswahl (Checkbox)
    const toggleSelection = (option, setState, state) => {
        if (state.includes(option)) {
            setState(state.filter((o) => o !== option));
        } else {
            setState([...state, option]);
        }
    };

    // Beispiel-Submit-Funktion (kann angepasst werden)
    const handleSubmit = () => {
        const result = {
            user: authorizedName,
            whisky: selectedWhisky.name,
            geruch,
            geschmack,
            bewertung,
        };
        console.log("Umfrage Ergebnis:", result);
        alert("Danke für deine Teilnahme!");

        // Whisky zur Liste der abgeschickten hinzufügen
        setSubmittedWhiskys((prev) => [...prev, selectedWhisky.id]);

        setSubmittedCurrent(true);
        closeSurvey();
    };


    function handleClose() {
        // Wenn Umfrage abgeschickt wurde, schließen bedeutet Whisky ausblenden
        if (submittedCurrent && selectedWhisky) {
            // already in submittedWhiskys, also einfach schließen
            setSelectedWhisky(null);
            setSubmittedCurrent(false);
        } else {
            // Falls noch nicht abgeschickt, einfach schließen
            setSelectedWhisky(null);
            setSubmittedCurrent(false);
        }
    }

    if (!authorizedName) {
        return <Authorization password={PASSWORD} onSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="relative m-6">
            <div className="mb-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-card-foreground">Umfrage</h1>
                <button
                    onClick={handleLogout}
                    className="rounded bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                >
                    Logout
                </button>
            </div>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/80"
                >
                    {showAll ? "Nur neue Whiskys zeigen" : "Alle Whiskys anzeigen"}
                </button>
            </div>

            <p className="mb-6 text-muted-foreground">
                Angemeldet als: <strong>{authorizedName}</strong>
            </p>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {displayedWhiskys.map((whisky) => (
                    <div
                        key={whisky.id}
                        onClick={() => openSurvey(whisky)}
                        className="cursor-pointer rounded-lg border border-border bg-background p-4 shadow-md hover:shadow-lg"
                    >
                        <img
                            src={whisky.image}
                            alt={whisky.name}
                            className="mb-3 h-48 w-full rounded object-cover"
                        />
                        <h2 className="text-lg font-semibold text-foreground">{whisky.name}</h2>
                    </div>
                ))}
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
                className={`fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-auto rounded-t-lg border border-border bg-card p-6 text-card-foreground shadow-xl transition-transform duration-300 ${
                    selectedWhisky ? "translate-y-0" : "translate-y-full"
                }`}
            >
                {selectedWhisky && (
                    <>
                        <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-xl font-semibold">{selectedWhisky.name}</h3>
                            <button
                                onClick={closeSurvey}
                                className="rounded bg-destructive px-3 py-1 text-destructive-foreground hover:bg-destructive/90"
                            >
                                Schließen
                            </button>
                        </div>

                        {/* Frage 1: Geruch (Mehrfachauswahl) */}
                        <div className="mb-4">
                            <p className="font-semibold mb-2">Wie ist der Geruch?</p>
                            <div className="flex flex-wrap gap-3">
                                {geruchOptions.map((opt) => (
                                    <label
                                        key={opt}
                                        className={`cursor-pointer rounded border px-3 py-1 select-none ${
                                            geruch.includes(opt)
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-foreground"
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
                            <p className="font-semibold mb-2">Wie ist der Geschmack?</p>
                            <div className="flex flex-wrap gap-3">
                                {geschmackOptions.map((opt) => (
                                    <label
                                        key={opt}
                                        className={`cursor-pointer rounded border px-3 py-1 select-none ${
                                            geschmack.includes(opt)
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-foreground"
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
                        <div className="mb-4">
                            <p className="font-semibold mb-2">Wie ist die Bewertung?</p>
                            <div className="flex gap-3">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <label
                                        key={num}
                                        className={`cursor-pointer rounded border px-3 py-1 select-none ${
                                            bewertung === num
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border bg-background text-foreground"
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
                                className="rounded bg-primary px-4 py-2 text-primary-foreground"
                                onClick={handleSubmit}
                                disabled={submittedCurrent} // Verhindert mehrmaliges Absenden
                            >
                                Absenden
                            </button>
                            <button
                                className="rounded border px-4 py-2"
                                onClick={handleClose}
                            >
                                Schließen
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
