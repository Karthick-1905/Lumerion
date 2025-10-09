import { apiClient } from './client';
import { API_CONFIG } from './config';
import type { UserProfileResponse, UserSearchResponse, NotificationsResponse } from './types';

export const userApi = {
  getProfile: async (): Promise<UserProfileResponse> => {
    return apiClient.get<UserProfileResponse>(API_CONFIG.ENDPOINTS.USER.GET_PROFILE);
  },

  searchUsers: async (term: string): Promise<UserSearchResponse> => {
    return apiClient.get<UserSearchResponse>(API_CONFIG.ENDPOINTS.USER.SEARCH(term));
  },

  getNotifications: async (): Promise<NotificationsResponse> => {
    return apiClient.get<NotificationsResponse>(API_CONFIG.ENDPOINTS.USER.NOTIFICATIONS);
  },
};
