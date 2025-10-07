import { apiClient } from './client';
import { API_CONFIG } from './config';
import type { PublicRoadmapsResponse } from './types';

// Roadmaps API Service
export const roadmapsApi = {
  // Get all public roadmaps
  getPublicRoadmaps: async (): Promise<PublicRoadmapsResponse> => {
    return apiClient.get<PublicRoadmapsResponse>(
      API_CONFIG.ENDPOINTS.ROADMAPS.GET_PUBLIC
    );
  },
};
