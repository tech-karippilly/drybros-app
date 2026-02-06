import { useEffect, useRef, useCallback } from 'react';
import { socketService } from '../utils/socket';

/**
 * Custom hook to manage socket connections and event listeners
 * @param events - Object with event names as keys and handler functions as values
 * @param deps - Dependencies array for when to reconnect/resubscribe
 */
export function useSocket(
  events?: Record<string, (...args: any[]) => void>,
  deps: any[] = []
) {
  const socketRef = useRef(socketService.getSocket());

  useEffect(() => {
    // Connect socket if not already connected
    if (!socketService.isConnected()) {
      socketRef.current = socketService.connect();
    }

    // Subscribe to events
    if (events) {
      Object.entries(events).forEach(([event, handler]) => {
        socketService.on(event, handler);
      });
    }

    // Cleanup: remove event listeners on unmount or when deps change
    return () => {
      if (events) {
        Object.entries(events).forEach(([event, handler]) => {
          socketService.off(event, handler);
        });
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = useCallback((event: string, data?: any) => {
    socketService.emit(event, data);
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketService.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketService.leaveRoom(room);
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketService.isConnected(),
    emit,
    joinRoom,
    leaveRoom,
  };
}

/**
 * Hook to listen to a specific socket event
 * @param event - Event name to listen to
 * @param handler - Handler function
 * @param deps - Dependencies array
 */
export function useSocketEvent(
  event: string,
  handler: (...args: any[]) => void,
  deps: any[] = []
) {
  useEffect(() => {
    // Connect socket if not already connected
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Subscribe to event
    socketService.on(event, handler);

    // Cleanup
    return () => {
      socketService.off(event, handler);
    };
  }, [event, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
}
