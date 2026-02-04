"use client";

import React, { useEffect, useState } from 'react';
import { Truck, AlertTriangle, UserPlus, ReceiptText, MessageSquare, Calendar, Star, Loader2 } from 'lucide-react';
import { getActivities, ActivityLogResponse } from '@/lib/features/activities/activityApi';
import { cn } from '@/lib/utils';

function formatTimeAgo(date: Date | string): string {
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

function getActivityStyle(action: string, entityType: string): { icon: typeof Truck; iconBg: string; iconColor: string } {
  const tripActions = ['TRIP_CREATED', 'TRIP_ASSIGNED', 'TRIP_ACCEPTED', 'TRIP_STARTED', 'TRIP_ENDED', 'TRIP_UPDATED', 'TRIP_STATUS_CHANGED'];
  const complaintActions = ['COMPLAINT_CREATED', 'COMPLAINT_RESOLVED', 'COMPLAINT_STATUS_CHANGED'];
  const driverActions = ['DRIVER_CREATED', 'DRIVER_UPDATED', 'DRIVER_STATUS_CHANGED', 'DRIVER_CLOCK_IN', 'DRIVER_CLOCK_OUT'];
  const leaveActions = ['LEAVE_REQUESTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_CANCELLED'];
  const ratingActions = ['RATING_SUBMITTED'];

  if (tripActions.includes(action) || entityType === 'TRIP') {
    return { icon: Truck, iconBg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-[#0d59f2]' };
  }
  if (complaintActions.includes(action) || entityType === 'COMPLAINT') {
    return { icon: AlertTriangle, iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-500' };
  }
  if (driverActions.includes(action) || entityType === 'DRIVER') {
    return { icon: UserPlus, iconBg: 'bg-green-50 dark:bg-green-900/30', iconColor: 'text-green-600' };
  }
  if (leaveActions.includes(action) || entityType === 'LEAVE_REQUEST') {
    return { icon: Calendar, iconBg: 'bg-purple-50 dark:bg-purple-900/30', iconColor: 'text-purple-600' };
  }
  if (ratingActions.includes(action) || entityType === 'RATING') {
    return { icon: Star, iconBg: 'bg-yellow-50 dark:bg-yellow-900/30', iconColor: 'text-yellow-600' };
  }
  return { icon: ReceiptText, iconBg: 'bg-purple-50 dark:bg-purple-900/30', iconColor: 'text-purple-600' };
}

export function RecentActivities() {
  const [activities, setActivities] = useState<ActivityLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'staff' | 'driver'>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getActivities({ page: 1, limit: 10 });
        if (!cancelled) setActivities(data);
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
            : e instanceof Error ? e.message : 'Failed to load activities';
          setError(String(msg));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex-1">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold dark:text-white">Recent Activities</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn('text-sm px-3 py-1 rounded', filter === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900' : 'text-slate-500')}
          >
            All
          </button>
          <button
            onClick={() => setFilter('staff')}
            className={cn('text-sm px-3 py-1 rounded', filter === 'staff' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500')}
          >
            Staff
          </button>
          <button
            onClick={() => setFilter('driver')}
            className={cn('text-sm px-3 py-1 rounded', filter === 'driver' ? 'bg-blue-50 text-[#0d59f2]' : 'text-slate-500')}
          >
            Driver
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-[#0d59f2]" />
        </div>
      ) : error ? (
        <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-[#49659c] dark:text-gray-400">No recent activities.</p>
      ) : (
        <div className="space-y-6">
          {activities
            .filter((a) => {
              if (filter === 'all') return true;
              if (filter === 'staff') return Boolean(a.staffId || a.staff || a.user?.role === 'STAFF' || a.user?.role === 'OFFICE_STAFF');
              if (filter === 'driver') return Boolean(a.driverId || a.driver || a.user?.role === 'DRIVER');
              return true;
            })
            .map((activity) => {
            const { icon: Icon, iconBg, iconColor } = getActivityStyle(activity.action, activity.entityType);
            return (
              <div key={activity.id} className="flex gap-4">
                <div className={cn('size-8 rounded-full flex items-center justify-center shrink-0', iconBg, iconColor)}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-gray-200">{activity.description}</p>
                  <p className="text-xs text-[#49659c] dark:text-gray-400">
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                  {activity.user && (
                    <p className="text-xs text-slate-400 mt-1">By: {activity.user.fullName} ({activity.user.role})</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
