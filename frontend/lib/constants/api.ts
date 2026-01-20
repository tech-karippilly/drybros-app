/**
 * API Configuration
 * Centralized API URL configuration that works in both server and client contexts
 * 
 * In Next.js, NEXT_PUBLIC_ variables are embedded at build time and available
 * in both server and client code.
 * 
 * IMPORTANT: This module must not contain any client-only code (like typeof window checks)
 * to avoid hydration mismatches between server and client rendering.
 */

// Get API URL from environment variable
// process.env.NEXT_PUBLIC_API_URL is available in both server and client
const getApiUrl = (): string => {
    // Next.js automatically makes NEXT_PUBLIC_ variables available
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (envUrl) {
        return envUrl;
    }
    
    // Fallback to default backend port
    return 'http://localhost:5000';
};

export const API_BASE_URL = getApiUrl();
