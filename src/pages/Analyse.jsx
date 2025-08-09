import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { useAPI } from '../hooks/useAPI';

export default function Analyse() {
    const [selectedWhisky, setSelectedWhisky] = useState(null);

    // Alle Analytics Daten laden
    const {
        data: overviewData,
        loading: overviewLoading,
        error: overviewError,
        refetch: refetchOverview
    } = useAPI(() => analyticsAPI.getAllStats());

    const {
        data: rankingData,
        loading: rankingLoading,
        error: rankingError
    } = useAPI(() => analyticsAPI.getRanking());

    // Whisky-spezifische Stats laden
    const [whiskyStats, setWhiskyStats] = useState(null);
    const [whiskyStatsLoading, setWhiskyStatsLoading] = useState(false);

    const loadWhiskyStats = async (whiskyId) => {
        setWhiskyStatsLoading(true);
        try {
            const stats = await analyticsAPI.getWhiskyStats(whiskyId);
            setWhiskyStats(stats);
        } catch (error) {
            console.error('Fehler beim Laden der Whisky-Stats:', error);
        }
        setWhiskyStatsLoading(false);
    };

    useEffect(() => {
        if (selectedWhisky) {
            loadWhiskyStats(selectedWhisky.id);
        }
    }, [selectedWhisky]);

    const handleWhiskySelect = (whisky) => {
        setSelectedWhisky(whisky);
    };

    if (overviewLoading || rankingLoading) {
        return (
            <div className="m-6 text-center">
                <div className="text-lg mb-2">📊</div>
                <p>Lade Analytics-Daten...</p>
            </div>
        );
    }

    if (overviewError) {
        return (
            <div className="m-6">
                <div className="bg-red-50 border border-red-200 rounded p-4">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">Fehler beim Laden der Daten</h2>
                    <p className="text-red-700">{overviewError}</p>
                    <button
                        onClick={refetchOverview}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Erneut versuchen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="m-6">
            <h1 className="text-2xl font-bold mb-6">📊 Whisky Analytics</h1>

            {/* Übersicht */}
            {overviewData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-card rounded-lg border border-border p-4">
                        <h3 className="font-semibold text-muted-foreground mb-2">Gesamt Bewertungen</h3>
                        <p className="text-2xl font-bold text-primary">{overviewData.total_surveys}</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <h3 className="font-semibold text-muted-foreground mb-2">Aktive Benutzer</h3>
                        <p className="text-2xl font-bold text-primary">{overviewData.total_users}</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <h3 className="font-semibold text-muted-foreground mb-2">Verfügbare Whiskys</h3>
                        <p className="text-2xl font-bold text-primary">{overviewData.total_whiskys}</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <h3 className="font-semibold text-muted-foreground mb-2">⌀ Bewertung</h3>
                        <p className="text-2xl font-bold text-primary">
                            {overviewData.avg_rating ? `${overviewData.avg_rating}/10` : 'N/A'}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Whisky Rangliste */}
                <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-xl font-semibold mb-4">🏆 Whisky Rangliste</h2>

                    {rankingLoading && <p>Lade Rangliste...</p>}
                    {rankingError && <p className="text-red-600">Fehler: {rankingError}</p>}

                    {rankingData && rankingData.length > 0 ? (
                        <div className="space-y-3">
                            {rankingData.map((whisky, index) => (
                                <div
                                    key={whisky.id}
                                    onClick={() => handleWhiskySelect(whisky)}
                                    className="flex items-center justify-between p-3 rounded border border-border hover:bg-secondary cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className={`text-lg font-bold ${
                                            index === 0 ? 'text-yellow-500' :
                                                index === 1 ? 'text-gray-400' :
                                                    index === 2 ? 'text-amber-600' :
                                                        'text-muted-foreground'
                                        }`}>
                                            {index + 1}.
                                        </span>
                                        <div>
                                            <p className="font-medium">{whisky.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {whisky.survey_count} Bewertung{whisky.survey_count !== 1 ? 'en' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-primary">
                                            {whisky.avg_rating}/10
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            ⭐ {whisky.avg_rating}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Noch keine Bewertungen vorhanden.</p>
                    )}
                </div>

                {/* Whisky Details */}
                <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-xl font-semibold mb-4">🔍 Whisky Details</h2>

                    {!selectedWhisky && (
                        <p className="text-muted-foreground">
                            Wähle einen Whisky aus der Rangliste, um Details zu sehen.
                        </p>
                    )}

                    {selectedWhisky && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">{selectedWhisky.name}</h3>

                            {whiskyStatsLoading && <p>Lade Details...</p>}

                            {whiskyStats && (
                                <div className="space-y-4">
                                    {/* Basis Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-background rounded">
                                            <p className="text-2xl font-bold text-primary">
                                                {whiskyStats.avg_rating}/10
                                            </p>
                                            <p className="text-sm text-muted-foreground">Durchschnitt</p>
                                        </div>
                                        <div className="text-center p-3 bg-background rounded">
                                            <p className="text-2xl font-bold text-primary">
                                                {whiskyStats.survey_count}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Bewertungen</p>
                                        </div>
                                    </div>

                                    {/* Geruch Analyse */}
                                    {whiskyStats.geruch_stats && whiskyStats.geruch_stats.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2">👃 Häufigste Gerüche</h4>
                                            <div className="space-y-2">
                                                {whiskyStats.geruch_stats.slice(0, 5).map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <span className="text-sm">{item.geruch}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-20 h-2 bg-secondary rounded-full">
                                                                <div
                                                                    className="h-full bg-primary rounded-full"
                                                                    style={{
                                                                        width: `${(item.count / whiskyStats.survey_count) * 100}%`
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground w-8">
                                                                {item.count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Geschmack Analyse */}
                                    {whiskyStats.geschmack_stats && whiskyStats.geschmack_stats.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold mb-2">👅 Häufigste Geschmäcker</h4>
                                            <div className="space-y-2">
                                                {whiskyStats.geschmack_stats.slice(0, 5).map((item, index) => (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <span className="text-sm">{item.geschmack}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-20 h-2 bg-secondary rounded-full">
                                                                <div
                                                                    className="h-full bg-primary rounded-full"
                                                                    style={{
                                                                        width: `${(item.count / whiskyStats.survey_count) * 100}%`
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground w-8">
                                                                {item.count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bewertungsverteilung */}
                                    {whiskyStats.rating_distribution && (
                                        <div>
                                            <h4 className="font-semibold mb-2">📊 Bewertungsverteilung</h4>
                                            <div className="space-y-1">
                                                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(rating => {
                                                    const count = whiskyStats.rating_distribution[rating] || 0;
                                                    const percentage = whiskyStats.survey_count > 0
                                                        ? (count / whiskyStats.survey_count) * 100
                                                        : 0;

                                                    return (
                                                        <div key={rating} className="flex items-center space-x-2 text-sm">
                                                            <span className="w-6">{rating}</span>
                                                            <div className="flex-1 h-2 bg-secondary rounded-full">
                                                                <div
                                                                    className="h-full bg-primary rounded-full transition-all"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="w-8 text-xs text-muted-foreground">
                                                                {count}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}