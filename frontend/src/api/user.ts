import { apiClient } from './client';
import { API_CONFIG } from './config';
import type { UserProfileResponse, UserSearchResponse, NotificationsResponse, SkillAssessment, SkillAssessmentDetail, ActivityFeedResponse } from './types';

export const userApi = {
  getProfile: async (): Promise<UserProfileResponse> => {
    return apiClient.get<UserProfileResponse>(API_CONFIG.ENDPOINTS.USER.GET_PROFILE);
  },

  searchUsers: async (term: string): Promise<UserSearchResponse> => {
    return apiClient.get<UserSearchResponse>(API_CONFIG.ENDPOINTS.USER.SEARCH(term));
  },

  getNotifications: async (): Promise<NotificationsResponse> => {
    return apiClient.get<NotificationsResponse>(API_CONFIG.ENDPOINTS.USER.NOTIFICATIONS);
  },

  getSkillAssessments: async (): Promise<{ success: boolean; assessments: SkillAssessment[] }> => {
    return apiClient.get<{ success: boolean; assessments: SkillAssessment[] }>(API_CONFIG.ENDPOINTS.USER.SKILL_ASSESSMENTS.GET_ALL);
  },

  getSkillAssessment: async (assessmentId: number): Promise<{ success: boolean; assessment: SkillAssessmentDetail }> => {
    return apiClient.get<{ success: boolean; assessment: SkillAssessmentDetail }>(API_CONFIG.ENDPOINTS.USER.SKILL_ASSESSMENTS.GET_BY_ID(assessmentId));
  },

  submitSkillAssessment: async (assessmentId: number, answers: { questionId: number; answer: string }[]): Promise<{ success: boolean; result: any }> => {
    return apiClient.post<{ success: boolean; result: any }>(API_CONFIG.ENDPOINTS.USER.SKILL_ASSESSMENTS.SUBMIT(assessmentId), { answers });
  },

  getActivityFeed: async (): Promise<ActivityFeedResponse> => {
    return apiClient.get<ActivityFeedResponse>(API_CONFIG.ENDPOINTS.USER.ACTIVITY_FEED);
  },

  respondToStudyGroupInvitation: async (groupId: number, decision: 'accept' | 'decline'): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(
      API_CONFIG.ENDPOINTS.STUDY_GROUPS.RESPOND_TO_INVITATION(groupId),
      { decision }
    );
  },
};
