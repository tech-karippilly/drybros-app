'use client';

import { useState, useEffect, useRef } from 'react';
import { socketService } from '@/services/socketService';
import { SOCKET_EVENTS } from '@/lib/constants/socket';

interface AttendanceEvent {
  id: string;
  personId: string;
  personName: string;
  action: 'clock-in' | 'clock-out' | 'login' | 'logout';
  timestamp: string;
  franchiseId?: string;
  roleType?: string;
}

const AttendanceMonitor = ({ franchiseId }: { franchiseId?: string }) => {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const eventContainerRef = useRef<HTMLDivElement>(null);

  // Add a new event to the list
  const addEvent = (event: Omit<AttendanceEvent, 'id'>) => {
    const newEvent: AttendanceEvent = {
      ...event,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
    };

    setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep only last 50 events
  };

  // Format time for display
  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '--:--';
    }
  };

  // Get action text based on event type
  const getActionText = (action: string, personName: string, time: string) => {
    switch (action) {
      case 'clock-in':
        return `${personName} clocked in at ${time}`;
      case 'clock-out':
        return `${personName} clocked out at ${time}`;
      case 'login':
        return `${personName} logged in at ${time}`;
      case 'logout':
        return `${personName} logged out at ${time}`;
      default:
        return `${personName} ${action} at ${time}`;
    }
  };

  // Scroll to bottom when new events are added
  useEffect(() => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop = 0;
    }
  }, [events]);

  // Set up socket listeners
  useEffect(() => {
    if (!socketService.isConnected()) {
      console.warn('Socket not connected for attendance monitor');
      setLoading(false);
      return;
    }

    // Define callback functions to be able to remove them later
    const handleClockIn = (data: any) => {
      if (!franchiseId || data.franchiseId === franchiseId) {
        addEvent({
          personId: data.personId,
          personName: data.personName,
          action: 'clock-in',
          timestamp: data.clockInTime,
          franchiseId: data.franchiseId,
          roleType: data.roleType
        });
      }
    };

    const handleClockOut = (data: any) => {
      if (!franchiseId || data.franchiseId === franchiseId) {
        addEvent({
          personId: data.personId,
          personName: data.personName,
          action: 'clock-out',
          timestamp: data.clockOutTime,
          franchiseId: data.franchiseId,
          roleType: data.roleType
        });
      }
    };

    const handleLogin = (data: any) => {
      if (!franchiseId || data.franchiseId === franchiseId) {
        addEvent({
          personId: data.personId,
          personName: data.personName,
          action: 'login',
          timestamp: data.loginTime,
          franchiseId: data.franchiseId,
          roleType: data.roleType
        });
      }
    };

    const handleLogout = (data: any) => {
      if (!franchiseId || data.franchiseId === franchiseId) {
        addEvent({
          personId: data.personId,
          personName: data.personName,
          action: 'logout',
          timestamp: data.logoutTime,
          franchiseId: data.franchiseId,
          roleType: data.roleType
        });
      }
    };

    // Listen for events
    socketService.on(SOCKET_EVENTS.ATTENDANCE_CLOCK_IN, handleClockIn);
    socketService.on(SOCKET_EVENTS.ATTENDANCE_CLOCK_OUT, handleClockOut);
    socketService.on(SOCKET_EVENTS.ATTENDANCE_LOGIN, handleLogin);
    socketService.on(SOCKET_EVENTS.ATTENDANCE_LOGOUT, handleLogout);

    setLoading(false);

    // Clean up listeners on unmount
    return () => {
      socketService.off(SOCKET_EVENTS.ATTENDANCE_CLOCK_IN, handleClockIn);
      socketService.off(SOCKET_EVENTS.ATTENDANCE_CLOCK_OUT, handleClockOut);
      socketService.off(SOCKET_EVENTS.ATTENDANCE_LOGIN, handleLogin);
      socketService.off(SOCKET_EVENTS.ATTENDANCE_LOGOUT, handleLogout);
    };
  }, [franchiseId]);

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Real-time Attendance Events</h3>
        <div className="text-sm text-gray-400">
          Live
          <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
        </div>
      </div>
      
      <div 
        ref={eventContainerRef}
        className="max-h-96 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
      >
        {events.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            No recent attendance events
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id} 
              className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  event.action === 'clock-in' ? 'bg-green-400' :
                  event.action === 'clock-out' ? 'bg-red-400' :
                  event.action === 'login' ? 'bg-blue-400' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-300">
                  {getActionText(event.action, event.personName, formatTime(event.timestamp))}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceMonitor;