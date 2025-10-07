import { apiClient } from './client';
import { API_CONFIG } from './config';
import type { 
  StudyGroupsListResponse, 
  StudyGroupDetailResponse, 
  StudyGroupMembersResponse,
  UserStudyGroupsResponse 
} from './types';

// Study Groups API Service
export const studyGroupsApi = {
  // Get all study groups for a learning path
  getGroupsByPath: async (pathId: number): Promise<StudyGroupsListResponse> => {
    return apiClient.get<StudyGroupsListResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.GET_BY_PATH(pathId)
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

  // Get all user's study groups
  getMyGroups: async (): Promise<UserStudyGroupsResponse> => {
    return apiClient.get<UserStudyGroupsResponse>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.GET_MY_GROUPS
    );
  },
};
