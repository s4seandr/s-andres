import React, { useMemo } from "react";

/**
 * props:
 *  - whiskys: [{ id, name }]
 *  - responses: optional array of { user, whiskyId, geruch:[], geschmack:[], bewertung:number }
 * If responses is not provided, the component falls back to localStorage "surveyResponses" or to sample data.
 */

export default function WhiskyClusterMatrix({ whiskys, responses: propResponses }) {
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

    // Color helper: return rgba using primary blue with alpha = similarity
    const getCellStyle = (sim) => {
        // use a blue color and vary opacity; also adjust text color for contrast
        const alpha = Math.min(0.85, 0.15 + sim * 0.85);
        const bg = `rgba(29,78,216, ${alpha})`; // Tailwind's blue-700 ~ rgb(29,78,216)
        const textColor = sim > 0.45 ? "white" : "rgb(30,30,30)";
        return { backgroundColor: bg, color: textColor };
    };

    // compute max similarity for legend
    const maxSim = Math.max(...matrix.flat());

    return (
        <div className="bg-card p-4 rounded shadow overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Clustermatrix (Whisky-Ähnlichkeit)</h3>

            <div className="text-sm mb-3 text-muted-foreground">
                Vergleichsmaß: <strong>Jaccard-Ähnlichkeit</strong> auf Basis von Geruch, Geschmack und Bewertung.
            </div>

            <div className="overflow-x-auto">
                <table className="border-collapse">
                    <thead>
                    <tr>
                        <th className="p-2 border bg-gray-100 sticky top-0 z-10"></th>
                        {whiskys.map((w) => (
                            <th key={w.id} className="p-2 border bg-gray-100 text-left min-w-[140px]">
                                {w.name}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {whiskys.map((rowWhisky, i) => (
                        <tr key={rowWhisky.id}>
                            <th className="p-2 border bg-gray-100 text-left sticky left-0">{rowWhisky.name}</th>
                            {whiskys.map((colWhisky, j) => {
                                const sim = matrix[i][j];
                                const style = getCellStyle(sim);
                                return (
                                    <td
                                        key={colWhisky.id}
                                        className="p-2 border text-center align-middle"
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

            {/* simple legend */}
            <div className="mt-4 flex items-center gap-3 text-sm">
                <div className="text-muted-foreground">wenig ähnlich</div>
                <div className="flex items-center gap-2">
                    <div className="w-40 h-3 rounded" style={{ background: "linear-gradient(90deg, rgba(240,240,240,1), rgba(29,78,216,0.85))" }} />
                </div>
                <div className="ml-auto text-muted-foreground">sehr ähnlich</div>
            </div>
        </div>
    );
}
