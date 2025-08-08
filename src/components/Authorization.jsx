import { useState } from "react";

export default function Authorization({ password, onSuccess }) {
    const [name, setName] = useState("");
    const [pass, setPass] = useState("");
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pass === password && name.trim().length > 0) {
            onSuccess(name.trim());
            setName("");
            setPass("");
            setError(null);
        } else {
            setError("Falsches Passwort oder Name fehlt.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="m-6 max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-md">
                <h2 className="mb-4 text-2xl font-bold">Anmeldung</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="name">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-semibold" htmlFor="password">Passwort</label>
                        <input
                            id="password"
                            type="password"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    {error && <p className="text-destructive">{error}</p>}
                    <button
                        type="submit"
                        className="w-full rounded bg-primary px-4 py-2 font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        Anmelden
                    </button>
                </form>
            </div>
        </div>
    );
}
