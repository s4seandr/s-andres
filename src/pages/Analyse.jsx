import React, { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import { analyticsAPI, surveyAPI } from "../services/api";
import WhiskyClusterMatrix from "../components/WhiskyClusterMatrix";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#8dd1e1"];

export default function Analyse() {
    // State für Backend-Daten
    const [geruchData, setGeruchData] = useState([]);
    const [geschmackData, setGeschmackData] = useState([]);
    const [bewertungData, setBewertungData] = useState([]);
    const [matrixData, setMatrixData] = useState(null);
    const [summaryData, setSummaryData] = useState(null);
    const [topWhiskys, setTopWhiskys] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dark Mode Detection mit CSS Custom Properties
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
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

    // Dynamische Chart-Farben basierend auf CSS Custom Properties
    const getChartTheme = () => {
        const computedStyle = getComputedStyle(document.documentElement);

        return {
            textColor: isDark ? '#f9fafb' : '#1f2937',
            gridColor: isDark ? '#374151' : '#e5e7eb',
            axisColor: isDark ? '#6b7280' : '#4b5563',
            tooltipBg: isDark ? '#374151' : '#ffffff',
            tooltipBorder: isDark ? '#4b5563' : '#d1d5db'
        };
    };

    const chartTheme = getChartTheme();

    // Hilfsfunktion für Bild-URLs
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;

        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
        return `${baseUrl}/images/${imagePath}`;
    };

    // Top 3 Whiskys berechnen
    const calculateTopWhiskys = async () => {
        try {
            const topWhiskysData = await analyticsAPI.getTopWhiskys();
            const top3 = topWhiskysData.slice(0, 3).map(whisky => ({
                ...whisky,
                imageUrl: getImageUrl(whisky.image_path)
            }));
            setTopWhiskys(top3);
        } catch (error) {
            console.error('❌ Fehler beim Laden der Top Whiskys:', error);
            try {
                const allWhiskys = await surveyAPI.getWhiskys();
                const fallbackTop3 = allWhiskys.slice(0, 3).map((whisky, index) => ({
                    rank: index + 1,
                    ...whisky,
                    averageRating: 0,
                    totalReviews: 0,
                    imageUrl: getImageUrl(whisky.image_path)
                }));
                setTopWhiskys(fallbackTop3);
            } catch (fallbackError) {
                console.error('❌ Auch Fallback fehlgeschlagen:', fallbackError);
            }
        }
    };

    // Alle Daten laden
    const loadAnalyticsData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [geruch, geschmack, bewertungen, matrix, summary] = await Promise.all([
                analyticsAPI.getGeruch(),
                analyticsAPI.getGeschmack(),
                analyticsAPI.getBewertungen(),
                analyticsAPI.getMatrix(),
                analyticsAPI.getSummary()
            ]);

            setGeruchData(geruch);
            setGeschmackData(geschmack);
            setBewertungData(bewertungen);
            setMatrixData(matrix);
            setSummaryData(summary);

            await calculateTopWhiskys();

            console.log('✅ Analytics-Daten geladen');
        } catch (error) {
            console.error('❌ Fehler beim Laden der Analytics:', error);
            setError('Fehler beim Laden der Analysedaten: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Daten beim Mount laden
    useEffect(() => {
        loadAnalyticsData();
    }, []);

    // Custom Tooltip für Dark Mode
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div
                    className="rounded-lg border border-border p-3 shadow-lg bg-card text-card-foreground"
                >
                    <p className="font-medium">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Lade Analysedaten...</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-destructive mb-4">❌ {error}</p>
                    <button
                        onClick={loadAnalyticsData}
                        className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                    >
                        Erneut versuchen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8 text-center text-foreground">🥃 Whisky Umfrage Analyse</h1>

            {/* Summary Cards - bereits dark mode ready */}
            {summaryData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card p-4 rounded-lg shadow text-center border border-border">
                        <h3 className="text-2xl font-bold text-primary">{summaryData.totalSurveys}</h3>
                        <p className="text-sm text-muted-foreground">Gesamte Bewertungen</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg shadow text-center border border-border">
                        <h3 className="text-2xl font-bold text-primary">{summaryData.totalUsers}</h3>
                        <p className="text-sm text-muted-foreground">Teilnehmer</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg shadow text-center border border-border">
                        <h3 className="text-2xl font-bold text-primary">{summaryData.averageRating}⭐</h3>
                        <p className="text-sm text-muted-foreground">Ø Bewertung</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg shadow text-center border border-border">
                        <h3 className="text-2xl font-bold text-primary">{summaryData.popularWhisky?.count || 0}</h3>
                        <p className="text-sm text-muted-foreground">Meiste Bewertungen</p>
                    </div>
                </div>
            )}

            {/* Top 3 Whiskys - bereits dark mode ready */}
            <div className="mb-12 bg-card p-6 rounded-lg shadow border border-border">
                <h2 className="text-2xl font-bold mb-6 text-center text-card-foreground">🏆 Top 3 Whiskys</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {topWhiskys.map((whisky, index) => (
                        <div
                            key={whisky.id}
                            className={`relative bg-gradient-to-br p-6 rounded-xl shadow-lg text-white text-center ${
                                index === 0 ? 'from-yellow-400 to-yellow-600' :
                                    index === 1 ? 'from-gray-300 to-gray-500' :
                                        'from-orange-400 to-orange-600'
                            }`}
                        >
                            <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                    index === 1 ? 'bg-gray-400 text-gray-900' :
                                        'bg-orange-500 text-orange-900'
                            }`}>
                                {whisky.rank}
                            </div>

                            <div className="mb-4">
                                {whisky.image_path ? (
                                    <img
                                        src={whisky.imageUrl}
                                        alt={whisky.name}
                                        className="w-24 h-32 mx-auto rounded-lg object-cover shadow-md"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`w-24 h-32 mx-auto rounded-lg bg-white/20 flex items-center justify-center ${whisky.image_path ? 'hidden' : ''}`}>
                                    <span className="text-4xl">🥃</span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold mb-2">{whisky.name}</h3>
                            <div className="space-y-1 text-sm">
                                <p className="flex items-center justify-center gap-1">
                                    <span className="text-yellow-300">⭐</span>
                                    {whisky.averageRating.toFixed(1)} / 5
                                </p>
                                <p className="text-white/90">
                                    {whisky.totalReviews} Bewertungen
                                </p>
                            </div>

                            {index === 0 && (
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                                    <span className="text-3xl">🏆</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Geruch Analyse - mit Dark Mode Support */}
            <div className="mb-12 bg-card p-6 rounded-lg shadow border border-border">
                <h2 className="text-xl font-bold mb-4 text-card-foreground">👃 Geruch Analyse</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={geruchData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: chartTheme.textColor, fontSize: 12 }}
                            axisLine={{ stroke: chartTheme.axisColor }}
                            tickLine={{ stroke: chartTheme.axisColor }}
                        />
                        <YAxis
                            tick={{ fill: chartTheme.textColor, fontSize: 12 }}
                            axisLine={{ stroke: chartTheme.axisColor }}
                            tickLine={{ stroke: chartTheme.axisColor }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{
                                color: chartTheme.textColor,
                                paddingTop: '20px'
                            }}
                        />
                        <Bar dataKey="votes" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Geschmack Analyse - mit Dark Mode Support */}
            <div className="mb-12 bg-card p-6 rounded-lg shadow border border-border">
                <h2 className="text-xl font-bold mb-4 text-card-foreground">👅 Geschmack Analyse</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={geschmackData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: chartTheme.textColor, fontSize: 12 }}
                            axisLine={{ stroke: chartTheme.axisColor }}
                            tickLine={{ stroke: chartTheme.axisColor }}
                        />
                        <YAxis
                            tick={{ fill: chartTheme.textColor, fontSize: 12 }}
                            axisLine={{ stroke: chartTheme.axisColor }}
                            tickLine={{ stroke: chartTheme.axisColor }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{
                                color: chartTheme.textColor,
                                paddingTop: '20px'
                            }}
                        />
                        <Bar dataKey="votes" fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Bewertungs Verteilung - mit Dark Mode Support */}
            <div className="bg-card p-6 rounded-lg shadow mb-12 border border-border">
                <h2 className="text-xl font-bold mb-4 text-card-foreground">⭐ Bewertungsverteilung</h2>
                <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie
                            data={bewertungData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            labelStyle={{
                                fill: chartTheme.textColor,
                                fontSize: 14,
                                fontWeight: 500
                            }}
                        >
                            {bewertungData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Cluster Matrix */}
            {matrixData && (
                <div className="mb-8">
                    <WhiskyClusterMatrix
                        whiskys={matrixData.whiskys}
                        responses={matrixData.responses}
                    />
                </div>
            )}

            {/* Keine Daten Meldung */}
            {geruchData.length === 0 && geschmackData.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                        📊 Noch keine Umfragedaten verfügbar.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Die Analyse wird angezeigt, sobald Bewertungen eingegangen sind.
                    </p>
                </div>
            )}
        </div>
    );
}