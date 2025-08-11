export default function Home() {
    return (
        <main className="container mx-auto p-6 flex flex-col items-center text-center min-h-[70vh]">
            <h1 className="text-4xl font-extrabold mb-6 text-foreground">
                Willkommen bei S-Andres!
            </h1>
            <p className="max-w-xl mb-8 text-muted-foreground">
                Erforsche die Welt der Whiskys mit uns! Bewerte Geruch, Geschmack und gib deine persönliche Note ab.
                Deine Meinung zählt und hilft Whisky-Liebhabern bei der Auswahl.
            </p>

            <a
                href="/umfrage"
                className="inline-block rounded bg-primary px-6 py-3 text-primary-foreground font-semibold hover:bg-primary/90 transition"
            >
                Zur Umfrage
            </a>

            <section className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl w-full">
                <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">Einfach & Schnell</h3>
                    <p>Fülle die Umfrage in wenigen Minuten aus, ohne Anmeldung.</p>
                </div>
                <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">Anonyme Bewertungen</h3>
                    <p>Deine Daten bleiben privat, du brauchst nur einen Namen und das Passwort.</p>
                </div>
                <div className="bg-card rounded-lg p-6 shadow hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-2">Auswertung & Analyse</h3>
                    <p>Sieh dir die gesammelten Ergebnisse auf der Analyse-Seite an.</p>
                </div>
            </section>
        </main>
    );
}
