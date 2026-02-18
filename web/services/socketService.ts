import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../lib/constants/socket';

// Types for socket events
interface StatusChangePayload {
  userId?: string;
  staffId?: string;
  driverId?: string;
  onlineStatus: boolean;
  lastStatusChange: Date;
  franchiseId?: string;
}

interface OnlineStaffListPayload {
  staff: Array<{
    id: string;
    name: string;
    onlineStatus: boolean;
    franchiseId: string;
  }>;
}

interface OnlineDriversListPayload {
  drivers: Array<{
    id: string;
    name: string;
    onlineStatus: boolean;
    franchiseId: string;
  }>;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      // Clean up existing socket
      if (this.socket) {
        this.disconnect();
      }

      // Create new socket connection
      this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
        transports: ['websocket'],
        auth: {
          token: `Bearer ${token}`,
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server actively disconnected, don't reconnect automatically
          this.cleanup();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to socket after maximum attempts'));
        }
      });

      // Setup event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Staff status change events
    this.socket.on(SOCKET_EVENTS.STAFF_STATUS_CHANGED, (payload: StatusChangePayload) => {
      this.emitEvent(SOCKET_EVENTS.STAFF_STATUS_CHANGED, payload);
    });

    // Driver status change events
    this.socket.on(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, (payload: StatusChangePayload) => {
      this.emitEvent(SOCKET_EVENTS.DRIVER_STATUS_CHANGED, payload);
    });

    // Online staff list
    this.socket.on(SOCKET_EVENTS.ONLINE_STAFF_LIST, (payload: OnlineStaffListPayload) => {
      this.emitEvent(SOCKET_EVENTS.ONLINE_STAFF_LIST, payload);
    });

    // Online drivers list
    this.socket.on(SOCKET_EVENTS.ONLINE_DRIVERS_LIST, (payload: OnlineDriversListPayload) => {
      this.emitEvent(SOCKET_EVENTS.ONLINE_DRIVERS_LIST, payload);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.cleanup();
    }
  }

  private cleanup() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Emit events to server
  emit(event: string, data?: any) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot emit event:', event);
      return;
    }
    this.socket.emit(event, data);
  }

  // Listen for events
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Request initial data for online status events
    if (event === SOCKET_EVENTS.STAFF_STATUS_CHANGED || event === SOCKET_EVENTS.ONLINE_STAFF_LIST) {
      this.requestOnlineStaff();
    }
    if (event === SOCKET_EVENTS.DRIVER_STATUS_CHANGED || event === SOCKET_EVENTS.ONLINE_DRIVERS_LIST) {
      this.requestOnlineDrivers();
    }
  }

  // Remove event listener
  off(event: string, callback: Function) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Emit event to all listeners
  private emitEvent(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in socket event listener:', error);
        }
      });
    }
  }

  // Request online staff list
  requestOnlineStaff() {
    this.emit(SOCKET_EVENTS.GET_ONLINE_STAFF);
  }

  // Request online drivers list
  requestOnlineDrivers() {
    this.emit(SOCKET_EVENTS.GET_ONLINE_DRIVERS);
  }

  // Join a specific room
  joinRoom(room: string) {
    this.emit('join_room', { room });
  }

  // Leave a specific room
  leaveRoom(room: string) {
    this.emit('leave_room', { room });
  }

  // Check connection status
  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Export socket events for convenience
export { SOCKET_EVENTS };
export type { StatusChangePayload, OnlineStaffListPayload, OnlineDriversListPayload };