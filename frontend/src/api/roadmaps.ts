import { apiClient } from './client';
import { API_CONFIG } from './config';
import type {
  PublicRoadmapsResponse,
  GenerateRoadmapRequest,
  GenerateRoadmapResponse,
  SaveRoadmapRequest,
  SaveRoadmapResponse,
} from './types';

// Roadmaps API Service
export const roadmapsApi = {
  // Get all public roadmaps
  getPublicRoadmaps: async (): Promise<PublicRoadmapsResponse> => {
    return apiClient.get<PublicRoadmapsResponse>(
      API_CONFIG.ENDPOINTS.ROADMAPS.GET_PUBLIC
    );
  },

  // Generate a roadmap based on topic
  generateRoadmap: async (payload: GenerateRoadmapRequest): Promise<GenerateRoadmapResponse> => {
    return apiClient.post<GenerateRoadmapResponse>(
      API_CONFIG.ENDPOINTS.ROADMAPS.GENERATE,
      payload
    );
  },

  // Save a generated roadmap as a learning path
  saveRoadmap: async (payload: SaveRoadmapRequest): Promise<SaveRoadmapResponse> => {
    return apiClient.post<SaveRoadmapResponse>(
      API_CONFIG.ENDPOINTS.ROADMAPS.SAVE,
      payload
    );
  },
};
