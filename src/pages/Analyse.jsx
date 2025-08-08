import React, { useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import WhiskyClusterMatrix from "../components/WhiskyClusterMatrix";

// Zentrale Whisky-Daten mit Beispiel-Auswertungen
const whiskys = [
    {
        id: 1,
        name: "Glenfiddich 12 Jahre",
        geruch: ["Fruchtig", "Floral", "Würzig", "Fruchtig", "Fruchtig"],
        geschmack: ["Süß", "Cremig", "Fruchtig"],
        bewertungen: [4, 5, 4, 3]
    },
    {
        id: 2,
        name: "Lagavulin 16 Jahre",
        geruch: ["Rauchig", "Holzig", "Würzig", "Rauchig"],
        geschmack: ["Würzig", "Bitter", "Rauchig"],
        bewertungen: [3, 2, 4]
    },
    {
        id: 3,
        name: "Macallan Sherry Oak",
        geruch: ["Fruchtig", "Holzig", "Fruchtig", "Fruchtig"],
        geschmack: ["Süß", "Würzig", "Fruchtig"],
        bewertungen: [4, 3, 5, 4]
    }
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1"];

export default function Analyse() {

    // Geruch aggregieren
    const geruchData = useMemo(() => {
        const countMap = {};
        whiskys.forEach(w => {
            w.geruch.forEach(g => {
                countMap[g] = (countMap[g] || 0) + 1;
            });
        });
        return Object.entries(countMap).map(([name, votes]) => ({ name, votes }));
    }, []);

    // Geschmack aggregieren
    const geschmackData = useMemo(() => {
        const countMap = {};
        whiskys.forEach(w => {
            w.geschmack.forEach(g => {
                countMap[g] = (countMap[g] || 0) + 1;
            });
        });
        return Object.entries(countMap).map(([name, votes]) => ({ name, votes }));
    }, []);

    // Bewertungen aggregieren
    const bewertungData = useMemo(() => {
        const countMap = {};
        whiskys.forEach(w => {
            w.bewertungen.forEach(b => {
                const stars = "⭐".repeat(b);
                countMap[stars] = (countMap[stars] || 0) + 1;
            });
        });
        return Object.entries(countMap).map(([name, value]) => ({ name, value }));
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Analyse der Umfragen</h1>

            {/* Diagramm 1: Geruch */}
            <div className="mb-12 bg-card p-4 rounded shadow">
                <h2 className="text-lg font-semibold mb-4">Geruch (Anzahl Stimmen)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={geruchData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="votes" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Diagramm 2: Geschmack */}
            <div className="mb-12 bg-card p-4 rounded shadow">
                <h2 className="text-lg font-semibold mb-4">Geschmack (Anzahl Stimmen)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={geschmackData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="votes" fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Diagramm 3: Bewertung */}
            <div className="bg-card p-4 rounded shadow mb-12">
                <h2 className="text-lg font-semibold mb-4">Bewertungen</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={bewertungData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                            }
                        >
                            {bewertungData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Cluster-Matrix */}
            <div className="mb-8">
                <WhiskyClusterMatrix whiskys={whiskys.map(w => ({
                    id: w.id,
                    name: w.name
                }))} />
            </div>
        </div>
    );
}
