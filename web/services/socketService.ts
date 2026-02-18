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
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  // Event listeners
  private listeners: Map<string, Set<Function>> = new Map();

  // Debounced connect function with 5-second delay
  private debouncedConnect = this.createDebouncedFunction(async () => {
    await this.connectInternal();
  }, 5000);

  private createDebouncedFunction<T extends (...args: any[]) => Promise<any>>(
    func: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastCallPromise: Promise<any> | null = null;
    
    return function (...args: Parameters<T>): Promise<ReturnType<T>> {
      return new Promise((resolve, reject) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(async () => {
          try {
            const result = await func(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            timeoutId = null;
          }
        }, delay);
      }) as Promise<ReturnType<T>>;
    } as T;
  }

  connect(): Promise<void> {
    // Return existing connection promise if one is in progress
    if (this.connectionPromise && this.isConnecting) {
      return this.connectionPromise;
    }
    
    // Use debounced connection
    return this.debouncedConnect();
  }

  private queuedRequests: Set<string> = new Set();

  private sendQueuedRequests() {
    if (this.queuedRequests.has('staff')) {
      this.requestOnlineStaff();
      this.queuedRequests.delete('staff');
    }
    if (this.queuedRequests.has('drivers')) {
      this.requestOnlineDrivers();
      this.queuedRequests.delete('drivers');
    }
    console.log('Sent queued requests, remaining:', this.queuedRequests);
  }

  private async connectInternal(): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }
    
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise<void>(async (resolve, reject) => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        
        // Validate token exists and has proper format
        console.log('Token validation:', {
          tokenExists: !!token,
          tokenLength: token ? token.length : 0,
          isJWT: token ? token.startsWith('eyJ') : false,
          tokenStart: token ? token.substring(0, 50) + '...' : 'null'
        });
        
        if (!token) {
          throw new Error('No authentication token available');
        }
        
        if (!token.startsWith('eyJ')) {
          console.error('Invalid token format:', token.substring(0, 50) + '...');
          throw new Error('Invalid authentication token format');
        }

        // Log token info for debugging
        console.log('Socket connection attempt with token:', {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...',
          timestamp: new Date().toISOString()
        });

        // Clean up existing socket
        if (this.socket) {
          this.disconnect();
        }

        // Log the API URL being used
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('Socket connecting to:', apiUrl);
        
        // Create new socket connection
        this.socket = io(apiUrl, {
          transports: ['websocket'],
          auth: {
            token: token, // Send token without Bearer prefix
          },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          timeout: 10000, // 10 second timeout
        });

        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket?.id);
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.connectionPromise = null;
          
          // Send any queued requests for online data
          this.sendQueuedRequests();
          
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server actively disconnected, don't reconnect automatically
            this.cleanup();
          }
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('Socket connection error:', error.message || error);
          
          // Debug token information
          const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
          console.log('Token debug info:', {
            tokenExists: !!token,
            tokenLength: token ? token.length : 0,
            tokenStart: token ? token.substring(0, 20) + '...' : 'null',
            isJWT: token ? token.startsWith('eyJ') : false
          });
          
          // Check if it's an authentication error
          if (error.message && error.message.includes('Invalid authentication token')) {
            console.error('Authentication failed - token may be expired or invalid');
            // Don't increment reconnect attempts for auth errors
            this.isConnecting = false;
            this.connectionPromise = null;
            reject(new Error('Invalid authentication token'));
            return;
          }
          
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.isConnecting = false;
            this.connectionPromise = null;
            reject(new Error('Failed to connect to socket after maximum attempts'));
          }
        });

        // Setup event listeners
        this.setupEventListeners();

        // Set a timeout for connection
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            this.connectionPromise = null;
            reject(new Error('Socket connection timeout'));
          }
        }, 15000); // 15 second timeout

      } catch (error) {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });
    
    return this.connectionPromise;
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

    // Attendance events
    this.socket.on(SOCKET_EVENTS.ATTENDANCE_CLOCK_IN, (payload: any) => {
      this.emitEvent(SOCKET_EVENTS.ATTENDANCE_CLOCK_IN, payload);
    });

    this.socket.on(SOCKET_EVENTS.ATTENDANCE_CLOCK_OUT, (payload: any) => {
      this.emitEvent(SOCKET_EVENTS.ATTENDANCE_CLOCK_OUT, payload);
    });

    this.socket.on(SOCKET_EVENTS.ATTENDANCE_LOGIN, (payload: any) => {
      this.emitEvent(SOCKET_EVENTS.ATTENDANCE_LOGIN, payload);
    });

    this.socket.on(SOCKET_EVENTS.ATTENDANCE_LOGOUT, (payload: any) => {
      this.emitEvent(SOCKET_EVENTS.ATTENDANCE_LOGOUT, payload);
    });

    // Your new event
    this.socket.on(SOCKET_EVENTS.YOUR_NEW_EVENT, (payload: any) => {
      this.emitEvent(SOCKET_EVENTS.YOUR_NEW_EVENT, payload);
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
    this.queuedRequests.clear();
  }

  // Emit events to server
  emit(event: string, data?: any) {
    if (!this.socket) {
      console.warn('Socket not initialized, cannot emit event:', event);
      return;
    }
    if (!this.socket.connected) {
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

    // Request initial data for online status events, but only if connected
    if (this.socket?.connected) {
      if (event === SOCKET_EVENTS.STAFF_STATUS_CHANGED || event === SOCKET_EVENTS.ONLINE_STAFF_LIST) {
        this.requestOnlineStaff();
      }
      if (event === SOCKET_EVENTS.DRIVER_STATUS_CHANGED || event === SOCKET_EVENTS.ONLINE_DRIVERS_LIST) {
        this.requestOnlineDrivers();
      }
    } else {
      // If not connected, queue the requests to be sent when connected
      console.log('Socket not connected yet, queuing initial data requests for:', event);
      if (event === SOCKET_EVENTS.STAFF_STATUS_CHANGED || event === SOCKET_EVENTS.ONLINE_STAFF_LIST) {
        this.queuedRequests.add('staff');
      }
      if (event === SOCKET_EVENTS.DRIVER_STATUS_CHANGED || event === SOCKET_EVENTS.ONLINE_DRIVERS_LIST) {
        this.queuedRequests.add('drivers');
      }
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
  requestOnlineStaff(franchiseId?: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot request online staff - socket not connected');
      return;
    }
    this.emit(SOCKET_EVENTS.GET_ONLINE_STAFF, franchiseId ? { franchiseId } : {});
  }

  // Request online drivers list
  requestOnlineDrivers(franchiseId?: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot request online drivers - socket not connected');
      return;
    }
    this.emit(SOCKET_EVENTS.GET_ONLINE_DRIVERS, franchiseId ? { franchiseId } : {});
  }

  // Join a specific room
  joinRoom(room: string) {
    this.emit('join_room', { room });
  }

  // Leave a specific room
  leaveRoom(room: string) {
    this.emit('leave_room', { room });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('accessToken');
    return !!token && token.startsWith('eyJ');
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