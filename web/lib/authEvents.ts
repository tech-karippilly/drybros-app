/**
 * Simple event emitter for authentication state changes.
 * Used to notify the app when refresh token expires.
 */

type AuthEventType = 'TOKEN_EXPIRED';
type AuthEventListener = (data?: any) => void;

class AuthEventEmitter {
    private listeners: Map<AuthEventType, AuthEventListener[]> = new Map();

    on(event: AuthEventType, listener: AuthEventListener): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(listener);
    }

    off(event: AuthEventType, listener: AuthEventListener): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(listener);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }

    emit(event: AuthEventType, data?: any): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach((listener) => listener(data));
        }
    }

    removeAllListeners(): void {
        this.listeners.clear();
    }
}

export const authEvents = new AuthEventEmitter();
