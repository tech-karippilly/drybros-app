/**
 * Map activity log entries to Critical Events / Notification display format.
 */
import {
  Truck,
  AlertTriangle,
  UserPlus,
  ReceiptText,
  Calendar,
  Star,
  Building,
} from 'lucide-react';
import type { ActivityLogResponse } from '@/lib/features/activities/activityApi';

export function formatActivityTimeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min !== 1 ? 's' : ''} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr !== 1 ? 's' : ''} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day !== 1 ? 's' : ''} ago`;
  return d.toLocaleDateString();
}

function getActivityStyle(action: string, entityType: string): {
  icon: React.ReactNode;
  iconBg: string;
} {
  const tripActions = [
    'TRIP_CREATED',
    'TRIP_ASSIGNED',
    'TRIP_ACCEPTED',
    'TRIP_STARTED',
    'TRIP_ENDED',
    'TRIP_UPDATED',
    'TRIP_STATUS_CHANGED',
  ];
  const complaintActions = ['COMPLAINT_CREATED', 'COMPLAINT_RESOLVED', 'COMPLAINT_STATUS_CHANGED'];
  const driverActions = ['DRIVER_CREATED', 'DRIVER_UPDATED', 'DRIVER_STATUS_CHANGED', 'DRIVER_CLOCK_IN', 'DRIVER_CLOCK_OUT'];
  const leaveActions = ['LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED'];
  const ratingActions = ['RATING_SUBMITTED'];

  if (tripActions.includes(action) || entityType === 'TRIP') {
    return { icon: <Truck className="h-3.5 w-3.5" />, iconBg: 'bg-[#137fec]' };
  }
  if (complaintActions.includes(action) || entityType === 'COMPLAINT') {
    return { icon: <AlertTriangle className="h-3.5 w-3.5" />, iconBg: 'bg-amber-500' };
  }
  if (driverActions.includes(action) || entityType === 'DRIVER') {
    return { icon: <UserPlus className="h-3.5 w-3.5" />, iconBg: 'bg-green-500' };
  }
  if (leaveActions.includes(action) || entityType === 'LEAVE_REQUEST') {
    return { icon: <Calendar className="h-3.5 w-3.5" />, iconBg: 'bg-purple-500' };
  }
  if (ratingActions.includes(action) || entityType === 'RATING') {
    return { icon: <Star className="h-3.5 w-3.5" />, iconBg: 'bg-yellow-500' };
  }
  return { icon: <ReceiptText className="h-3.5 w-3.5" />, iconBg: 'bg-[#137fec]' };
}

export interface ActivityEventItem {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  timeAgo: string;
}

export function activityToEventItem(a: ActivityLogResponse): ActivityEventItem {
  const style = getActivityStyle(a.action, a.entityType);
  return {
    icon: style.icon,
    iconBg: style.iconBg,
    title: a.action.replace(/_/g, ' '),
    description: a.description,
    timeAgo: formatActivityTimeAgo(a.createdAt),
  };
}

export function getEmptyCriticalEventItem(): ActivityEventItem {
  return {
    icon: <Building className="h-3.5 w-3.5" />,
    iconBg: 'bg-[#137fec]',
    title: 'System ready',
    description: 'Dashboard loaded. No critical events.',
    timeAgo: 'Just now',
  };
}
