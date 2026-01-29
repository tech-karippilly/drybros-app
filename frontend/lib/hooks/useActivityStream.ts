/**
 * Polls /activities with selected franchiseId at a fixed interval.
 * Debounces franchiseId changes so the API is not called repeatedly when switching franchises.
 */
import { useEffect, useRef, useState } from 'react';
import { getActivities, type ActivityLogResponse } from '@/lib/features/activities/activityApi';
import { ACTIVITY_CRITICAL_LIMIT, ACTIVITY_STREAM_DEBOUNCE_MS, ACTIVITY_STREAM_POLL_MS } from '@/lib/constants/activity';

export interface UseActivityStreamOptions {
  /** Selected franchise ID; when undefined, no franchise filter is applied (e.g. admin sees all). */
  franchiseId?: string | null;
  /** Max number of activities to fetch per poll. */
  limit?: number;
  /** Poll interval in ms. */
  pollMs?: number;
  /** Debounce delay in ms when franchiseId changes. */
  debounceMs?: number;
  /** If false, polling is paused (e.g. tab not visible). */
  enabled?: boolean;
}

export interface UseActivityStreamResult {
  activities: ActivityLogResponse[];
  loading: boolean;
  error: string | null;
}

export function useActivityStream(options: UseActivityStreamOptions = {}): UseActivityStreamResult {
  const {
    franchiseId,
    limit = ACTIVITY_CRITICAL_LIMIT,
    pollMs = ACTIVITY_STREAM_POLL_MS,
    debounceMs = ACTIVITY_STREAM_DEBOUNCE_MS,
    enabled = true,
  } = options;

  const [activities, setActivities] = useState<ActivityLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedFranchiseIdRef = useRef<string | undefined>(undefined);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    const resolvedFranchiseId = franchiseId ?? undefined;

    // Debounce: wait before applying new franchiseId and (re)starting poll
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      debouncedFranchiseIdRef.current = resolvedFranchiseId;

      const fetchActivities = async () => {
        try {
          setError(null);
          const data = await getActivities({
            franchiseId: debouncedFranchiseIdRef.current,
            limit,
            page: 1,
          });
          setActivities(Array.isArray(data) ? data : []);
        } catch (e) {
          const msg =
            e && typeof e === 'object' && 'response' in e
              ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
              : e instanceof Error
                ? e.message
                : 'Failed to load activities';
          setError(msg ?? 'Failed to load activities');
        } finally {
          setLoading(false);
        }
      };

      setLoading(true);
      void fetchActivities();

      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(fetchActivities, pollMs);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [enabled, franchiseId, limit, pollMs, debounceMs]);

  return { activities, loading, error };
}
