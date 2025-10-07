import { useQuery } from '@tanstack/react-query';
import { roadmapsApi } from '../api/roadmaps';
import type { PublicRoadmapsResponse, ApiError } from '../api/types';

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
