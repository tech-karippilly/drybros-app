/**
 * Token refresh utility
 * Manages refresh token state and modal display
 */

let refreshTokenExpiredCallback: (() => void) | null = null;
let isRefreshTokenExpired = false;

/**
 * Set callback to be called when refresh token expires
 */
export function setRefreshTokenExpiredCallback(callback: () => void): void {
    refreshTokenExpiredCallback = callback;
}

/**
 * Trigger refresh token expired callback
 */
export function triggerRefreshTokenExpired(): void {
    isRefreshTokenExpired = true;
    if (refreshTokenExpiredCallback) {
        refreshTokenExpiredCallback();
    }
}

/**
 * Clear refresh token expired callback
 */
export function clearRefreshTokenExpiredCallback(): void {
    refreshTokenExpiredCallback = null;
}

/**
 * Check if refresh token is expired
 */
export function getIsRefreshTokenExpired(): boolean {
    return isRefreshTokenExpired;
}

/**
 * Reset refresh token expired state (called after successful login)
 */
export function resetRefreshTokenExpired(): void {
    isRefreshTokenExpired = false;
}
