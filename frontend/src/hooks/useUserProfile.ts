import { useMutation, useQuery } from '@tanstack/react-query';
import { userApi } from '../api/user';
import type { UserProfileResponse, ApiError, UserSearchResponse } from '../api/types';

export const USER_QUERY_KEYS = {
  all: ['user'] as const,
  profile: () => [...USER_QUERY_KEYS.all, 'profile'] as const,
} as const;

export const useUserProfile = () => {
  return useQuery<UserProfileResponse, ApiError>({
    queryKey: USER_QUERY_KEYS.profile(),
    queryFn: userApi.getProfile,
  });
};

export const useUserSearch = () => {
  return useMutation<UserSearchResponse, ApiError, string>({
    mutationFn: term => userApi.searchUsers(term),
  });
};
