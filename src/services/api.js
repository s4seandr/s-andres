// Backend API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function für API calls mit Error Handling
const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

// =============================================================================
// AUTH API
// =============================================================================

export const authAPI = {
    // Benutzer anmelden (mit Backend-Validierung)
    login: async (name, password) => {
        return apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ name, password })
        });
    },

    // Benutzer abmelden
    logout: async () => {
        return apiCall('/auth/logout', {
            method: 'POST'
        });
    },

    // Prüfen ob Benutzername existiert
    checkUser: async (name) => {
        return apiCall(`/auth/check/${encodeURIComponent(name)}`);
    }
};

// =============================================================================
// SURVEY API
// =============================================================================

export const surveyAPI = {
    // Alle verfügbaren Whiskys abrufen
    getWhiskys: async () => {
        return apiCall('/surveys/whiskys');
    },

    // Einzelnen Whisky mit Details abrufen
    getWhiskyDetails: async (whiskyId) => {
        return apiCall(`/surveys/whiskys/${whiskyId}`);
    },

    // Umfrage absenden
    submitSurvey: async (surveyData) => {
        return apiCall('/surveys/submit', {
            method: 'POST',
            body: JSON.stringify(surveyData)
        });
    },

    // Alle Umfragen eines Benutzers abrufen
    getUserSurveys: async (userId) => {
        return apiCall(`/surveys/user/${userId}`);
    }
};

// =============================================================================
// ANALYTICS API
// =============================================================================

export const analyticsAPI = {
    // Statistiken für einen bestimmten Whisky
    getWhiskyStats: async (whiskyId) => {
        return apiCall(`/analytics/whisky/${whiskyId}`);
    },

    // Überblick über alle Statistiken
    getAllStats: async () => {
        return apiCall('/analytics/overview');
    },

    // Whisky-Rangliste
    getRanking: async () => {
        return apiCall('/analytics/ranking');
    }
};

// =============================================================================
// ADMIN API
// =============================================================================

const getAdminHeaders = () => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    return {
        'adminpassword': adminPassword
    };
};

export const adminAPI = {
    // Admin-Statistiken
    getStats: async () => {
        return apiCall('/admin/stats', {
            headers: getAdminHeaders()
        });
    },

    // Alle Whiskys für Admin
    getWhiskys: async () => {
        return apiCall('/admin/whiskys', {
            headers: getAdminHeaders()
        });
    },

    // Whisky hinzufügen
    addWhisky: async (whiskyData) => {
        return apiCall('/admin/whiskys', {
            method: 'POST',
            headers: getAdminHeaders(),
            body: JSON.stringify(whiskyData)
        });
    },

    // Whisky bearbeiten
    updateWhisky: async (whiskyId, whiskyData) => {
        return apiCall(`/admin/whiskys/${whiskyId}`, {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify(whiskyData)
        });
    },

    // Whisky löschen
    deleteWhisky: async (whiskyId) => {
        return apiCall(`/admin/whiskys/${whiskyId}`, {
            method: 'DELETE',
            headers: getAdminHeaders()
        });
    },

    // Alle Benutzer
    getUsers: async () => {
        return apiCall('/admin/users', {
            headers: getAdminHeaders()
        });
    },

    // Alle Umfragen
    getSurveys: async () => {
        return apiCall('/admin/surveys', {
            headers: getAdminHeaders()
        });
    },

    // Umfrage löschen
    deleteSurvey: async (surveyId) => {
        return apiCall(`/admin/surveys/${surveyId}`, {
            method: 'DELETE',
            headers: getAdminHeaders()
        });
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Health Check des Backends
export const checkBackendHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
        return response.ok;
    } catch (error) {
        console.error('Backend Health Check failed:', error);
        return false;
    }
};