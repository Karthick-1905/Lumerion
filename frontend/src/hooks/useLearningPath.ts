import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learningPathApi } from '../api/learningPath';
import type {
  LearningPathsResponse,
  LearningPathDetailResponse,
  ApiError,
  ModuleProgressResponse,
  UpdateModuleProgressPayload,
} from '../api/types';

// Query Keys
export const LEARNING_PATH_QUERY_KEYS = {
  all: ['learningPaths'] as const,
  list: () => [...LEARNING_PATH_QUERY_KEYS.all, 'list'] as const,
  detail: (id: number) => [...LEARNING_PATH_QUERY_KEYS.all, 'detail', id] as const,
} as const;

// Get all learning paths
export const useLearningPaths = () => {
  return useQuery<LearningPathsResponse, ApiError>({
    queryKey: LEARNING_PATH_QUERY_KEYS.list(),
    queryFn: learningPathApi.getAllPaths,
  });
};

// Get a single learning path by ID
export const useLearningPathDetail = (pathId: number) => {
  return useQuery<LearningPathDetailResponse, ApiError>({
    queryKey: LEARNING_PATH_QUERY_KEYS.detail(pathId),
    queryFn: () => learningPathApi.getPathById(pathId),
    enabled: !!pathId,
  });
};

type UpdateModuleProgressVariables = {
  moduleId: number;
  payload: UpdateModuleProgressPayload;
};

export const useUpdateModuleProgress = (pathId?: number) => {
  const queryClient = useQueryClient();

  return useMutation<ModuleProgressResponse, ApiError, UpdateModuleProgressVariables>({
    mutationFn: ({ moduleId, payload }) => {
      if (!pathId || Number.isNaN(pathId)) {
        const error = new Error('Invalid learning path identifier') as ApiError;
        error.status = 400;
        throw error;
      }
      return learningPathApi.updateModuleProgress(pathId, moduleId, payload);
    },
    onSuccess: () => {
      if (!pathId || Number.isNaN(pathId)) return;
      queryClient.invalidateQueries({ queryKey: LEARNING_PATH_QUERY_KEYS.detail(pathId) });
    },
  });
};
