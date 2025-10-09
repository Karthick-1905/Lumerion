import { apiClient } from './client';
import { API_CONFIG } from './config';
import type {
  FriendsListResponse,
  FriendRequestsResponse,
  SendFriendRequestBody,
  SuccessResponse,
  UserSearchResponse,
} from './types';

export const friendsApi = {
  list: (limit?: number, offset?: number) =>
    apiClient.get<FriendsListResponse>(API_CONFIG.ENDPOINTS.FRIENDS.LIST(limit, offset)),

  listRequests: (
    direction?: 'inbound' | 'outbound' | 'all',
    status?: 'pending' | 'accepted' | 'rejected' | 'blocked',
    limit?: number,
    offset?: number
  ) => apiClient.get<FriendRequestsResponse>(API_CONFIG.ENDPOINTS.FRIENDS.REQUESTS(direction, status, limit, offset)),

  sendRequest: (body: SendFriendRequestBody) =>
    apiClient.post<SuccessResponse>(API_CONFIG.ENDPOINTS.FRIENDS.REQUEST, body),

  acceptRequest: (requestId: number) =>
    apiClient.post<SuccessResponse>(API_CONFIG.ENDPOINTS.FRIENDS.ACCEPT(requestId)),

  declineRequest: (requestId: number) =>
    apiClient.post<SuccessResponse>(API_CONFIG.ENDPOINTS.FRIENDS.DECLINE(requestId)),

  removeFriend: (friendUserId: number) =>
    apiClient.delete<SuccessResponse>(API_CONFIG.ENDPOINTS.FRIENDS.REMOVE(friendUserId)),

  searchUsers: (term: string, limit?: number, offset?: number) =>
    apiClient.get<UserSearchResponse>(API_CONFIG.ENDPOINTS.USER.SEARCH(term, limit, offset)),
};
