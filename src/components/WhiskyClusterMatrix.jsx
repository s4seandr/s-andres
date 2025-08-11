import React, { useMemo, useState, useEffect } from "react";

/**
 * props:
 *  - whiskys: [{ id, name }]
 *  - responses: optional array of { user, whiskyId, geruch:[], geschmack:[], bewertung:number }
 * If responses is not provided, the component falls back to localStorage "surveyResponses" or to sample data.
 */

export default function WhiskyClusterMatrix({ whiskys, responses: propResponses }) {
    // Dark Mode Detection
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        // Observer für Dark Mode Changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // fallback sample responses if nothing in prop or localStorage
    const sampleResponses = [
        { user: "Anna", whiskyId: 1, geruch: ["Fruchtig"], geschmack: ["Süß"], bewertung: 4 },
        { user: "Ben", whiskyId: 1, geruch: ["Fruchtig", "Floral"], geschmack: ["Cremig"], bewertung: 5 },
        { user: "Carla", whiskyId: 2, geruch: ["Rauchig"], geschmack: ["Würzig"], bewertung: 3 },
        { user: "Daniel", whiskyId: 2, geruch: ["Holzig"], geschmack: ["Bitter"], bewertung: 2 },
        { user: "Eva", whiskyId: 3, geruch: ["Fruchtig"], geschmack: ["Süß"], bewertung: 4 },
        { user: "Frank", whiskyId: 3, geruch: ["Holzig"], geschmack: ["Würzig"], bewertung: 3 },
        { user: "Gina", whiskyId: 1, geruch: ["Würzig"], geschmack: ["Fruchtig"], bewertung: 4 },
    ];

    const responses = useMemo(() => {
        if (propResponses && Array.isArray(propResponses)) return propResponses;
        try {
            const raw = localStorage.getItem("surveyResponses");
            if (raw) return JSON.parse(raw);
        } catch (e) {
            // ignore
        }
        return sampleResponses;
    }, [propResponses]);

    // Build feature-set per whisky (union of tags from all responses for that whisky)
    // Tagging scheme: G:geruch_<value>, T:geschmack_<value>, R:rating_<value>
    const featureSets = useMemo(() => {
        const map = new Map(); // whiskyId -> Set(features)
        whiskys.forEach((w) => map.set(w.id, new Set()));
        responses.forEach((r) => {
            if (!map.has(r.whiskyId)) return;
            const s = map.get(r.whiskyId);
            (r.geruch || []).forEach((g) => s.add(`G:${g}`));
            (r.geschmack || []).forEach((t) => s.add(`T:${t}`));
            if (typeof r.bewertung !== "undefined" && r.bewertung !== null) {
                s.add(`R:${r.bewertung}`);
            }
        });
        return map;
    }, [whiskys, responses]);

    // Jaccard similarity between two sets
    const jaccard = (a, b) => {
        const as = Array.from(a);
        let inter = 0;
        const unionSet = new Set(as);
        as.forEach((x) => {
            if (b.has(x)) inter++;
        });
        Array.from(b).forEach((x) => unionSet.add(x));
        const union = unionSet.size;
        return union === 0 ? 0 : inter / union;
    };

    // Build matrix (2D array) of similarities
    const matrix = useMemo(() => {
        const ids = whiskys.map((w) => w.id);
        return ids.map((idA) =>
            ids.map((idB) => {
                const setA = featureSets.get(idA) || new Set();
                const setB = featureSets.get(idB) || new Set();
                return jaccard(setA, setB);
            })
        );
    }, [whiskys, featureSets]);

    // Color helper: return rgba using primary color with alpha = similarity
    // Angepasst für Dark Mode
    const getCellStyle = (sim) => {
        const alpha = Math.min(0.85, 0.15 + sim * 0.85);

        if (isDark) {
            // Dark Mode: Verwende hellere Farbe mit angepasster Deckkraft
            const bg = `rgba(96, 165, 250, ${alpha})`; // blue-400 für Dark Mode
            const textColor = sim > 0.45 ? "#1f2937" : "#f9fafb"; // Kontrastreiche Farben
            return { backgroundColor: bg, color: textColor };
        } else {
            // Light Mode: Original Farbe
            const bg = `rgba(29, 78, 216, ${alpha})`; // blue-700 für Light Mode
            const textColor = sim > 0.45 ? "white" : "#1f2937";
            return { backgroundColor: bg, color: textColor };
        }
    };

    // compute max similarity for legend
    const maxSim = Math.max(...matrix.flat());

    // Legend gradient angepasst für Dark Mode
    const getLegendGradient = () => {
        if (isDark) {
            return "linear-gradient(90deg, rgba(55, 65, 81, 0.3), rgba(96, 165, 250, 0.85))";
        } else {
            return "linear-gradient(90deg, rgba(240, 240, 240, 1), rgba(29, 78, 216, 0.85))";
        }
    };

    return (
        <div className="bg-card p-4 rounded-lg shadow border border-border overflow-auto">
            <h3 className="text-lg font-semibold mb-4 text-card-foreground">
                🔗 Clustermatrix (Whisky-Ähnlichkeit)
            </h3>

            <div className="text-sm mb-3 text-muted-foreground">
                Vergleichsmaß: <strong>Jaccard-Ähnlichkeit</strong> auf Basis von Geruch, Geschmack und Bewertung.
            </div>

            <div className="overflow-x-auto">
                <table className="border-collapse">
                    <thead>
                    <tr>
                        <th className="p-2 border border-border bg-muted/50 sticky top-0 z-10"></th>
                        {whiskys.map((w) => (
                            <th
                                key={w.id}
                                className="p-2 border border-border bg-muted/50 text-muted-foreground text-left min-w-[140px] font-medium"
                            >
                                {w.name}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {whiskys.map((rowWhisky, i) => (
                        <tr key={rowWhisky.id}>
                            <th className="p-2 border border-border bg-muted/50 text-muted-foreground text-left sticky left-0 font-medium">
                                {rowWhisky.name}
                            </th>
                            {whiskys.map((colWhisky, j) => {
                                const sim = matrix[i][j];
                                const style = getCellStyle(sim);
                                return (
                                    <td
                                        key={colWhisky.id}
                                        className="p-2 border border-border text-center align-middle font-medium"
                                        style={style}
                                        title={`${rowWhisky.name} ↔ ${colWhisky.name}: ${(sim * 100).toFixed(0)}%`}
                                    >
                                        {/* show percentage if >0 */}
                                        {sim > 0 ? `${Math.round(sim * 100)}%` : ""}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Legend angepasst für Dark Mode */}
            <div className="mt-4 flex items-center gap-3 text-sm">
                <div className="text-muted-foreground">wenig ähnlich</div>
                <div className="flex items-center gap-2">
                    <div
                        className="w-40 h-3 rounded border border-border"
                        style={{ background: getLegendGradient() }}
                    />
                </div>
                <div className="ml-auto text-muted-foreground">sehr ähnlich</div>
            </div>

            {/* Zusätzliche Info über Anzahl der Vergleiche */}
            <div className="mt-2 text-xs text-muted-foreground">
                📊 Basiert auf {responses.length} Bewertungen von {whiskys.length} Whiskys
            </div>
        </div>
    );
}