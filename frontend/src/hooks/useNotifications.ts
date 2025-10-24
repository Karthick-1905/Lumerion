import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user';
import type { NotificationsResponse } from '../api/types';

// Query Keys
export const USER_QUERY_KEYS = {
  notifications: ['user', 'notifications'] as const,
} as const;

// Notifications Query
export const useNotifications = () => {
  return useQuery<NotificationsResponse, Error>({
    queryKey: USER_QUERY_KEYS.notifications,
    queryFn: userApi.getNotifications,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};