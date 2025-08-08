import { Link } from "react-router-dom";

export default function Navigation() {
    return (
        <nav className="flex gap-4">
            <Link
                to="/"
                className="text-foreground hover:text-primary transition-colors"
            >
                Home
            </Link>
            <Link
                to="/umfrage"
                className="text-foreground hover:text-primary transition-colors"
            >
                Umfrage
            </Link>
            <Link
                to="/analyse"
                className="text-foreground hover:text-primary transition-colors"
            >
                Analyse
            </Link>
        </nav>
    );
}
