import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roadmapsApi } from '../api/roadmaps';
import type {
  PublicRoadmapsResponse,
  ApiError,
  GenerateRoadmapRequest,
  GenerateRoadmapResponse,
  SaveRoadmapRequest,
  SaveRoadmapResponse,
} from '../api/types';

// Query Keys
export const ROADMAPS_QUERY_KEYS = {
  all: ['roadmaps'] as const,
  public: () => [...ROADMAPS_QUERY_KEYS.all, 'public'] as const,
} as const;

// Get public roadmaps
export const usePublicRoadmaps = () => {
  return useQuery<PublicRoadmapsResponse, ApiError>({
    queryKey: ROADMAPS_QUERY_KEYS.public(),
    queryFn: roadmapsApi.getPublicRoadmaps,
  });
};

export const useGenerateRoadmap = () => {
  return useMutation<GenerateRoadmapResponse, ApiError, GenerateRoadmapRequest>({
    mutationFn: roadmapsApi.generateRoadmap,
  });
};

export const useSaveRoadmap = () => {
  const queryClient = useQueryClient();

  return useMutation<SaveRoadmapResponse, ApiError, SaveRoadmapRequest>({
    mutationFn: roadmapsApi.saveRoadmap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROADMAPS_QUERY_KEYS.public() });
    },
  });
};
