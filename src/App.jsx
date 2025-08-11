import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Umfrage from "./pages/Umfrage.jsx";
import Analyse from "@/pages/Analyse.jsx";
import Admin from "@/pages/Admin.jsx";

export default function App() {
    return (
        <Router>
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/umfrage" element={<Umfrage />} />
                        <Route path="/analyse" element={<Analyse />} />
                        <Route path="/admin" element={<Admin /> } />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}
