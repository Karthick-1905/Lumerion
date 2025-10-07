import { useQuery } from '@tanstack/react-query';
import { learningPathApi } from '../api/learningPath';
import type { LearningPathsResponse, LearningPathDetailResponse, ApiError } from '../api/types';

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
