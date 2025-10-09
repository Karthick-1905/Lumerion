import { apiClient } from './client';
import { API_CONFIG } from './config';
import type {
  StudyGroupsListResponse,
  StudyGroupDetailResponse,
  StudyGroupMembersResponse,
  UserStudyGroupsResponse,
  CreateStudyGroupPayload,
  StudyGroupResponse,
  AddMemberPayload,
  UpdateMemberPayload,
  SuccessResponse,
} from './types';

// Study Groups API Service
export const studyGroupsApi = {
  // Get all study groups for a learning path
  getGroupsByPath: async (pathId: number): Promise<StudyGroupsListResponse> => {
    return apiClient.get<StudyGroupsListResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.GET_BY_PATH(pathId)
    );
  },

  // Create a study group for a learning path
  createGroup: async (pathId: number, payload: CreateStudyGroupPayload): Promise<StudyGroupResponse> => {
    return apiClient.post<StudyGroupResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.CREATE(pathId),
      payload
    );
  },

  // Get a single study group by ID
  getGroupById: async (groupId: number): Promise<StudyGroupDetailResponse> => {
    return apiClient.get<StudyGroupDetailResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.GET_BY_ID(groupId)
    );
  },

  // Get members of a study group
  getGroupMembers: async (groupId: number): Promise<StudyGroupMembersResponse> => {
    return apiClient.get<StudyGroupMembersResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.GET_MEMBERS(groupId)
    );
  },

  // Add a member to the study group
  addMember: async (groupId: number, payload: AddMemberPayload): Promise<SuccessResponse> => {
    return apiClient.post<SuccessResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.ADD_MEMBER(groupId),
      payload
    );
  },

  // Update a member's role in the study group
  updateMember: async (groupId: number, userId: number, payload: UpdateMemberPayload): Promise<SuccessResponse> => {
    return apiClient.patch<SuccessResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.MEMBER_DETAIL(groupId, userId),
      payload
    );
  },

  // Remove a member from the study group
  removeMember: async (groupId: number, userId: number): Promise<SuccessResponse> => {
    return apiClient.delete<SuccessResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.MEMBER_DETAIL(groupId, userId)
    );
  },

  // Get all user's study groups
  getMyGroups: async (): Promise<UserStudyGroupsResponse> => {
    return apiClient.get<UserStudyGroupsResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.GET_MY_GROUPS
    );
  },
};
