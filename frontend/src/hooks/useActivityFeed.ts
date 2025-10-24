import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user';
import type { ActivityFeedResponse } from '../api/types';

// Query Keys
export const USER_QUERY_KEYS = {
  activityFeed: ['user', 'activity-feed'] as const,
} as const;

// Activity Feed Query
export const useActivityFeed = () => {
  return useQuery<ActivityFeedResponse, Error>({
    queryKey: USER_QUERY_KEYS.activityFeed,
    queryFn: userApi.getActivityFeed,
    staleTime: 2 * 60 * 1000, // 2 minutes - activity feed should be relatively fresh
  });
};