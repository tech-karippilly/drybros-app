import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../constants/socket';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;

  /**
   * Initialize socket connection
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket!;
    }

    this.isConnecting = true;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    this.socket = io(apiUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on(SOCKET_EVENTS.CONNECTION_ERROR, (error) => {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
    });

    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Emit an event
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Listen to an event
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Join a room
   */
  joinRoom(room: string): void {
    this.emit(SOCKET_EVENTS.JOIN_ROOM, { room });
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    this.emit(SOCKET_EVENTS.LEAVE_ROOM, { room });
  }
}

// Export singleton instance
export const socketService = new SocketService();
