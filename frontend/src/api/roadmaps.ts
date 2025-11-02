import { apiClient } from './client';
import { API_CONFIG } from './config';
import type {
  PublicRoadmapsResponse,
  GenerateRoadmapRequest,
  GenerateRoadmapResponse,
  SaveRoadmapRequest,
  SaveRoadmapResponse,
  ModuleQuizzesResponse,
  QuizSubmissionPayload,
  QuizSubmissionResponse,
  LearningPathProgressResponse,
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

  // Fetch quizzes for a learning path module
  getModuleQuizzes: async (
    pathId: number,
    moduleId: number
  ): Promise<ModuleQuizzesResponse> => {
    return apiClient.get<ModuleQuizzesResponse>(
      API_CONFIG.ENDPOINTS.ROADMAPS.MODULE_QUIZZES(pathId, moduleId)
    );
  },

  // Submit quiz responses for evaluation
  submitQuiz: async (
    pathId: number,
    moduleId: number,
    quizId: number,
    payload: QuizSubmissionPayload
  ): Promise<QuizSubmissionResponse> => {
    return apiClient.post<QuizSubmissionResponse>(
      API_CONFIG.ENDPOINTS.ROADMAPS.SUBMIT_QUIZ(pathId, moduleId, quizId),
      payload
    );
  },

  // Retrieve persisted progress for a learning path
  getLearningPathProgress: async (
    pathId: number
  ): Promise<LearningPathProgressResponse> => {
    return apiClient.get<LearningPathProgressResponse>(
      API_CONFIG.ENDPOINTS.ROADMAPS.PATH_PROGRESS(pathId)
    );
  },
};
