/**
 * API Configuration
 * Centralized API URL configuration that works in both server and client contexts
 */

// Get API URL from environment variable
const getApiUrl = (): string => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (envUrl) {
        return envUrl;
    }
    
    // Fallback to default backend port
    return 'http://localhost:4000';
};

export const API_BASE_URL = getApiUrl();
