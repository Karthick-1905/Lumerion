import { useQuery } from '@tanstack/react-query';
import { studyGroupsApi } from '../api/studyGroups';
import type { 
  StudyGroupsListResponse, 
  StudyGroupDetailResponse, 
  StudyGroupMembersResponse,
  UserStudyGroupsResponse,
  ApiError 
} from '../api/types';

// Query Keys
export const STUDY_GROUPS_QUERY_KEYS = {
  all: ['studyGroups'] as const,
  byPath: (pathId: number) => [...STUDY_GROUPS_QUERY_KEYS.all, 'byPath', pathId] as const,
  detail: (groupId: number) => [...STUDY_GROUPS_QUERY_KEYS.all, 'detail', groupId] as const,
  members: (groupId: number) => [...STUDY_GROUPS_QUERY_KEYS.all, 'members', groupId] as const,
  myGroups: () => [...STUDY_GROUPS_QUERY_KEYS.all, 'myGroups'] as const,
} as const;

// Get study groups by learning path
export const useStudyGroupsByPath = (pathId: number) => {
  return useQuery<StudyGroupsListResponse, ApiError>({
    queryKey: STUDY_GROUPS_QUERY_KEYS.byPath(pathId),
    queryFn: () => studyGroupsApi.getGroupsByPath(pathId),
    enabled: !!pathId,
  });
};

// Get study group detail
export const useStudyGroupDetail = (groupId: number) => {
  return useQuery<StudyGroupDetailResponse, ApiError>({
    queryKey: STUDY_GROUPS_QUERY_KEYS.detail(groupId),
    queryFn: () => studyGroupsApi.getGroupById(groupId),
    enabled: !!groupId,
  });
};

// Get study group members
export const useStudyGroupMembers = (groupId: number) => {
  return useQuery<StudyGroupMembersResponse, ApiError>({
    queryKey: STUDY_GROUPS_QUERY_KEYS.members(groupId),
    queryFn: () => studyGroupsApi.getGroupMembers(groupId),
    enabled: !!groupId,
  });
};

// Get all user's study groups
export const useMyStudyGroups = () => {
  return useQuery<UserStudyGroupsResponse, ApiError>({
    queryKey: STUDY_GROUPS_QUERY_KEYS.myGroups(),
    queryFn: studyGroupsApi.getMyGroups,
  });
};
