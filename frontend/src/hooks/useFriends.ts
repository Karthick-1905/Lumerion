import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '../api/friends';
import type { ApiError, FriendRequestsResponse, FriendsListResponse, SuccessResponse, UserSearchResponse } from '../api/types';

export const FRIENDS_QUERY_KEYS = {
  all: ['friends'] as const,
  list: (limit?: number, offset?: number) => [...FRIENDS_QUERY_KEYS.all, 'list', limit ?? 'd', offset ?? 'd'] as const,
  requests: (direction?: 'inbound' | 'outbound' | 'all', status?: 'pending' | 'accepted' | 'rejected' | 'blocked', limit?: number, offset?: number) =>
    [...FRIENDS_QUERY_KEYS.all, 'requests', direction ?? 'all', status ?? 'any', limit ?? 'd', offset ?? 'd'] as const,
  search: (term: string) => [...FRIENDS_QUERY_KEYS.all, 'search', term] as const,
} as const;

export const useFriendsList = (limit?: number, offset?: number) =>
  useQuery<FriendsListResponse, ApiError>({
    queryKey: FRIENDS_QUERY_KEYS.list(limit, offset),
    queryFn: () => friendsApi.list(limit, offset),
  });

export const useFriendRequests = (
  direction?: 'inbound' | 'outbound' | 'all',
  status?: 'pending' | 'accepted' | 'rejected' | 'blocked',
  limit?: number,
  offset?: number
) =>
  useQuery<FriendRequestsResponse, ApiError>({
    queryKey: FRIENDS_QUERY_KEYS.requests(direction, status, limit, offset),
    queryFn: () => friendsApi.listRequests(direction, status, limit, offset),
  });

export const useUserSearch = (term: string, limit?: number, offset?: number) =>
  useQuery<UserSearchResponse, ApiError>({
    queryKey: FRIENDS_QUERY_KEYS.search(term),
    queryFn: () => friendsApi.searchUsers(term, limit, offset),
    enabled: term.trim().length > 0,
  });

export const useSendFriendRequest = () => {
  const qc = useQueryClient();
  return useMutation<SuccessResponse, ApiError, { targetUserId: number; message?: string | null }>(
    {
      mutationFn: (body) => friendsApi.sendRequest(body),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.requests('outbound', 'pending') });
      },
    }
  );
};

export const useAcceptFriendRequest = () => {
  const qc = useQueryClient();
  return useMutation<SuccessResponse, ApiError, number>({
    mutationFn: (requestId) => friendsApi.acceptRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.requests('inbound', 'pending') });
      qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.list() });
    },
  });
};

export const useDeclineFriendRequest = () => {
  const qc = useQueryClient();
  return useMutation<SuccessResponse, ApiError, number>({
    mutationFn: (requestId) => friendsApi.declineRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.requests('inbound', 'pending') });
    },
  });
};

export const useRemoveFriend = () => {
  const qc = useQueryClient();
  return useMutation<SuccessResponse, ApiError, number>({
    mutationFn: (friendUserId) => friendsApi.removeFriend(friendUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEYS.list() });
    },
  });
};
