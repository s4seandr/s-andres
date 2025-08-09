import { useState, useEffect } from "react";
import { authAPI } from "../services/api";

export default function Authorization({ onSuccess }) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userExists, setUserExists] = useState(null);
    const [checkingUser, setCheckingUser] = useState(false);

    // Debounced User Check
    useEffect(() => {
        if (name.trim().length === 0) {
            setUserExists(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setCheckingUser(true);
            try {
                const result = await authAPI.checkUser(name.trim());
                setUserExists(result.exists);
            } catch (error) {
                console.error('Fehler beim Prüfen des Benutzernamens:', error);
                setUserExists(null);
            }
            setCheckingUser(false);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [name]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (name.trim().length === 0) {
            setError("Name ist erforderlich");
            setLoading(false);
            return;
        }

        if (password.trim().length === 0) {
            setError("Passwort ist erforderlich");
            setLoading(false);
            return;
        }

        try {
            const result = await authAPI.login(name.trim(), password);

            if (result.success) {
                onSuccess(result.user);
                // Form zurücksetzen
                setName("");
                setPassword("");
                setError(null);
            }
        } catch (error) {
            setError(error.message);
        }

        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="m-6 max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-md">
                <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-bold">🥃 Whisky Umfrage</h2>
                    <p className="text-sm text-muted-foreground">
                        Melde dich an, um an der Umfrage teilzunehmen
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="name">
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Dein Name"
                            required
                            disabled={loading}
                        />

                        {/* User Status Anzeige */}
                        {checkingUser && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                Prüfe Benutzername...
                            </p>
                        )}
                        {!checkingUser && userExists === true && (
                            <p className="mt-1 text-sm text-green-600">
                                ✅ Willkommen zurück!
                            </p>
                        )}
                        {!checkingUser && userExists === false && name.trim().length > 0 && (
                            <p className="mt-1 text-sm text-blue-600">
                                ✨ Neuer Benutzer wird erstellt
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="password">
                            Umfrage-Passwort
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Passwort eingeben"
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded bg-red-50 border border-red-200">
                            <p className="text-destructive text-sm">❌ {error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Anmelden...
                            </span>
                        ) : (
                            'Anmelden'
                        )}
                    </button>
                </form>

                <div className="mt-4 p-3 rounded bg-blue-50 border border-blue-200">
                    <p className="text-xs text-blue-700">
                        💡 <strong>Hinweis:</strong> Neue Benutzer werden automatisch registriert.
                        Das Passwort ist für alle Teilnehmer gleich.
                    </p>
                </div>
            </div>
        </div>
    );
}