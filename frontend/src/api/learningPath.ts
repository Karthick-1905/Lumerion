import { apiClient } from './client';
import { API_CONFIG } from './config';
import type {
  LearningPathsResponse,
  LearningPathDetailResponse,
  ModuleProgressResponse,
  UpdateModuleProgressPayload,
} from './types';

// Learning Path API Service
export const learningPathApi = {
  // Get all learning paths for the user
  getAllPaths: async (): Promise<LearningPathsResponse> => {
    return apiClient.get<LearningPathsResponse>(
      API_CONFIG.ENDPOINTS.LEARNING_PATHS.GET_ALL
    );
  },

  // Get a single learning path by ID
  getPathById: async (pathId: number): Promise<LearningPathDetailResponse> => {
    return apiClient.get<LearningPathDetailResponse>(
      API_CONFIG.ENDPOINTS.LEARNING_PATHS.GET_BY_ID(pathId)
    );
  },

  // Update module progress within a learning path
  updateModuleProgress: async (
    pathId: number,
    moduleId: number,
    payload: UpdateModuleProgressPayload
  ): Promise<ModuleProgressResponse> => {
    return apiClient.patch<ModuleProgressResponse>(
      API_CONFIG.ENDPOINTS.LEARNING_PATHS.MODULE_PROGRESS(pathId, moduleId),
      payload
    );
  },
};
