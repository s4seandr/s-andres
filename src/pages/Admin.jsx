import { useState, useEffect } from "react";

export default function Admin() {
    const [password, setPassword] = useState("");
    const [token, setToken] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);
    const [name, setName] = useState("");
    const [file, setFile] = useState(null);
    const [whiskys, setWhiskys] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");

    // API Base URL - angepasst an dein Backend
    const API_BASE = "http://localhost:3001/api";

    useEffect(() => {
        if (loggedIn && token) {
            console.log("🔄 Login Status geändert, lade Whiskys...");
            fetchWhiskys();
        }
    }, [loggedIn, token]); // Abhängigkeit von beiden: loggedIn UND token

    // Fehlermeldungen automatisch ausblenden
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError("");
                setSuccess("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!password.trim()) {
            setError("Bitte Passwort eingeben");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE}/admin/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password }),
            });

            console.log("Login Response Status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Login fehlgeschlagen");
            }

            const data = await response.json();
            console.log("Login erfolgreich:", data);
            console.log("Erhaltener Token:", data.token);

            setToken(data.token); // Token speichern
            setLoggedIn(true);    // Login Status setzen
            setPassword("");
            setSuccess("Login erfolgreich!");
        } catch (err) {
            console.error("Login Fehler:", err);
            setError(err.message || "Verbindungsfehler");
        } finally {
            setLoading(false);
        }
    };

    const fetchWhiskys = async () => {
        if (!token) {
            console.log("⚠️ Kein Token vorhanden, überspringe Whisky-Loading");
            return;
        }

        try {
            console.log("📋 Lade Whiskys von:", `${API_BASE}/admin/whiskys`);
            console.log("🔑 Verwende Token:", token.substring(0, 8) + "...");

            const response = await fetch(`${API_BASE}/admin/whiskys`, {
                headers: {
                    'Authorization': token
                }
            });

            console.log("📊 Fetch Whiskys Status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.log("❌ Error Response Text:", errorText);
                throw new Error(`Fehler beim Laden der Whiskys (${response.status})`);
            }

            const data = await response.json();
            console.log("✅ Whiskys geladen:", data);
            console.log("📈 Anzahl Whiskys:", data.length);
            setWhiskys(data);
        } catch (err) {
            console.error("❌ Fetch Whiskys Fehler:", err);
            setError(err.message || "Fehler beim Laden der Whiskys");
        }
    };

    const addWhisky = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError("Bitte Whisky-Name eingeben");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("name", name.trim());
            if (file) {
                formData.append("image", file);
            }

            const response = await fetch(`${API_BASE}/admin/whiskys`, {
                method: "POST",
                headers: {
                    'Authorization': token
                },
                body: formData,
            });

            console.log("Add Whisky Response Status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Fehler beim Hinzufügen");
            }

            const data = await response.json();
            console.log("Whisky hinzugefügt:", data);

            // Form zurücksetzen
            setName("");
            setFile(null);
            document.querySelector('input[type="file"]').value = '';

            setSuccess("Whisky erfolgreich hinzugefügt!");
            await fetchWhiskys(); // Aktualisiere die Liste
        } catch (err) {
            console.error("Add Whisky Fehler:", err);
            setError(err.message || "Fehler beim Hinzufügen");
        } finally {
            setLoading(false);
        }
    };

    const deleteWhisky = async (id, name) => {
        if (!window.confirm(`"${name}" wirklich löschen?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/admin/whiskys/${id}`, {
                method: "DELETE",
                headers: {
                    'Authorization': token
                }
            });

            console.log("Delete Whisky Response Status:", response.status);

            if (!response.ok) {
                throw new Error("Fehler beim Löschen");
            }

            setSuccess(`"${name}" wurde gelöscht`);
            await fetchWhiskys(); // Aktualisiere die Liste
        } catch (err) {
            console.error("Delete Whisky Fehler:", err);
            setError(err.message || "Fehler beim Löschen");
        }
    };

    const logout = () => {
        setLoggedIn(false);
        setToken("");
        setWhiskys([]);
        setError("");
        setSuccess("");
        console.log("Logout erfolgreich");
    };

    // Login Formular
    if (!loggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">🥃 Whisky Admin</h1>
                        <p className="text-gray-600 mt-2">Admin-Bereich Login</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Passwort
                            </label>
                            <input
                                type="password"
                                placeholder="Passwort eingeben..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Anmeldung läuft..." : "Anmelden"}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
                            {success}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Admin Dashboard
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-800">🥃 Whisky Admin Dashboard</h1>
                        <button
                            onClick={logout}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                {/* Status Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                        ❌ {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                        ✅ {success}
                    </div>
                )}

                {/* Whisky hinzufügen */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Neuen Whisky hinzufügen</h2>

                    <form onSubmit={addWhisky} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Whisky Name *
                            </label>
                            <input
                                type="text"
                                placeholder="z.B. Macallan 18 Jahre"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bild (optional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Wird hinzugefügt..." : "Whisky hinzufügen"}
                        </button>
                    </form>
                </div>

                {/* Whisky Liste */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Whisky Sammlung ({whiskys.length})
                        </h2>
                    </div>

                    {whiskys.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>Noch keine Whiskys hinzugefügt.</p>
                            <p className="text-sm mt-2">Füge deinen ersten Whisky über das Formular oben hinzu.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {whiskys.map((whisky) => (
                                <div key={whisky.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {whisky.image_path ? (
                                                <img
                                                    src={`http://localhost:3001/images/${whisky.image_path}`}
                                                    alt={whisky.name}
                                                    className="h-16 w-16 object-cover rounded-lg border"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        console.log('Bild-Ladefehler:', whisky.image_path);
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <span className="text-gray-500 text-xs">Kein Bild</span>
                                                </div>
                                            )}

                                            <div>
                                                <h3 className="font-medium text-gray-800">{whisky.name}</h3>
                                                <p className="text-sm text-gray-500">ID: {whisky.id}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => deleteWhisky(whisky.id, whisky.name)}
                                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                                        >
                                            Löschen
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}