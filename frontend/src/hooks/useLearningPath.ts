import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learningPathApi } from '../api/learningPath';
import { roadmapsApi } from '../api/roadmaps';
import type {
  LearningPathsResponse,
  LearningPathDetailResponse,
  ApiError,
  ModuleProgressResponse,
  UpdateModuleProgressPayload,
  ModuleQuizzesResponse,
  QuizSubmissionPayload,
  QuizSubmissionResponse,
  LearningPathProgressResponse,
} from '../api/types';

// Query Keys
export const LEARNING_PATH_QUERY_KEYS = {
  all: ['learningPaths'] as const,
  list: () => [...LEARNING_PATH_QUERY_KEYS.all, 'list'] as const,
  detail: (id: number) => [...LEARNING_PATH_QUERY_KEYS.all, 'detail', id] as const,
  moduleQuizzes: (pathId: number, moduleId: number) =>
    [...LEARNING_PATH_QUERY_KEYS.detail(pathId), 'quizzes', moduleId] as const,
  progress: (pathId: number) => [...LEARNING_PATH_QUERY_KEYS.detail(pathId), 'progress'] as const,
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

export const useModuleQuizzes = (pathId?: number, moduleId?: number) => {
  const enabled = !!pathId && !!moduleId;

  return useQuery<ModuleQuizzesResponse, ApiError>({
    queryKey: enabled
      ? LEARNING_PATH_QUERY_KEYS.moduleQuizzes(pathId!, moduleId!)
      : ['learningPaths', 'quizzes', 'disabled'],
    queryFn: () => roadmapsApi.getModuleQuizzes(pathId!, moduleId!),
    enabled,
  });
};

export const useLearningPathProgress = (pathId?: number) => {
  return useQuery<LearningPathProgressResponse, ApiError>({
    queryKey: pathId
      ? LEARNING_PATH_QUERY_KEYS.progress(pathId)
      : ['learningPaths', 'progress', 'disabled'],
    queryFn: () => roadmapsApi.getLearningPathProgress(pathId!),
    enabled: !!pathId,
    staleTime: 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: LEARNING_PATH_QUERY_KEYS.progress(pathId) });
    },
  });
};

type SubmitQuizVariables = {
  moduleId: number;
  quizId: number;
  payload: QuizSubmissionPayload;
};

export const useSubmitQuiz = (pathId?: number) => {
  const queryClient = useQueryClient();

  return useMutation<QuizSubmissionResponse, ApiError, SubmitQuizVariables>({
    mutationFn: ({ moduleId, quizId, payload }) => {
      if (!pathId || Number.isNaN(pathId)) {
        const error = new Error('Invalid learning path identifier') as ApiError;
        error.status = 400;
        throw error;
      }

      return roadmapsApi.submitQuiz(pathId, moduleId, quizId, payload);
    },
    onSuccess: (_, variables) => {
      if (!pathId || Number.isNaN(pathId)) return;

      queryClient.invalidateQueries({ queryKey: LEARNING_PATH_QUERY_KEYS.detail(pathId) });
      queryClient.invalidateQueries({ queryKey: LEARNING_PATH_QUERY_KEYS.progress(pathId) });

      if (variables?.moduleId) {
        queryClient.invalidateQueries({
          queryKey: LEARNING_PATH_QUERY_KEYS.moduleQuizzes(pathId, variables.moduleId),
        });
      }
    },
  });
};
