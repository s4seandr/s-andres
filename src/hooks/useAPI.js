import { useState, useEffect } from 'react';

// Hook für automatisches Laden von Daten
export const useAPI = (apiFunction, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiFunction();
            setData(result);
        } catch (err) {
            setError(err.message);
            console.error('API Hook Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, dependencies);

    return { data, loading, error, refetch: fetchData };
};

// Hook für manuelle API-Calls (Forms, Actions)
export const useAPICall = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = async (apiFunction) => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiFunction();
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setLoading(false);
    };

    return { execute, loading, error, reset };
};

// Hook für User Authentication
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // User aus localStorage laden
        const savedUser = localStorage.getItem('whiskyUser');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Fehler beim Laden des Users:', error);
                localStorage.removeItem('whiskyUser');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('whiskyUser', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('whiskyUser');
    };

    return {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
    };
};