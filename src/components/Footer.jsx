export default function Footer() {
    return (
        <footer className="border-t border-border bg-card text-card-foreground">
            <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-3 text-sm md:flex-row">
                <p className="text-muted-foreground">
                    © {new Date().getFullYear()} S-Andres.de - wagen Sie mal etwas Andres
                </p>
                <div className="flex gap-4">
                    <a
                        href="#"
                        className="hover:text-primary transition-colors"
                    >
                        Kontakt
                    </a>
                </div>
            </div>
        </footer>
    );
}
