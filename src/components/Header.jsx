import Navigation from "./Navigation";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
    return (
        <header className="border-b border-border bg-card text-card-foreground">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <img
                        src="/favicon.svg"
                        alt="Logo"
                        className="h-8 w-8"
                    />
                    <h1 className="text-xl font-bold">S-Andres.de</h1>
                </div>
                <div className="flex items-center">
                    <Navigation />
                    <DarkModeToggle />
                </div>
            </div>
        </header>
    );
}
