import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studyGroupsApi } from '../api/studyGroups';
import type {
  StudyGroupsListResponse,
  StudyGroupDetailResponse,
  StudyGroupMembersResponse,
  UserStudyGroupsResponse,
  ApiError,
  CreateStudyGroupPayload,
  StudyGroupResponse,
  AddMemberPayload,
  UpdateMemberPayload,
  SuccessResponse,
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

export const useCreateStudyGroup = (pathId?: number) => {
  const queryClient = useQueryClient();

  return useMutation<StudyGroupResponse, ApiError, CreateStudyGroupPayload>({
    mutationFn: payload => {
      if (!pathId || Number.isNaN(pathId)) {
        const error = new Error('Invalid learning path identifier') as ApiError;
        error.status = 400;
        throw error;
      }
      return studyGroupsApi.createGroup(pathId, payload);
    },
    onSuccess: () => {
      if (!pathId || Number.isNaN(pathId)) return;
      queryClient.invalidateQueries({ queryKey: STUDY_GROUPS_QUERY_KEYS.byPath(pathId) });
      queryClient.invalidateQueries({ queryKey: STUDY_GROUPS_QUERY_KEYS.myGroups() });
    },
  });
};

export const useAddStudyGroupMember = (groupId?: number) => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, ApiError, AddMemberPayload>({
    mutationFn: payload => {
      if (!groupId || Number.isNaN(groupId)) {
        const error = new Error('Invalid study group identifier') as ApiError;
        error.status = 400;
        throw error;
      }
      return studyGroupsApi.addMember(groupId, payload);
    },
    onSuccess: () => {
      if (!groupId || Number.isNaN(groupId)) return;
      queryClient.invalidateQueries({ queryKey: STUDY_GROUPS_QUERY_KEYS.members(groupId) });
      queryClient.invalidateQueries({ queryKey: STUDY_GROUPS_QUERY_KEYS.detail(groupId) });
    },
  });
};

export const useUpdateStudyGroupMember = (groupId?: number) => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, ApiError, { userId: number; payload: UpdateMemberPayload }>({
    mutationFn: ({ userId, payload }) => {
      if (!groupId || Number.isNaN(groupId) || !userId || Number.isNaN(userId)) {
        const error = new Error('Invalid study group member identifier') as ApiError;
        error.status = 400;
        throw error;
      }
      return studyGroupsApi.updateMember(groupId, userId, payload);
    },
    onSuccess: () => {
      if (!groupId || Number.isNaN(groupId)) return;
      queryClient.invalidateQueries({ queryKey: STUDY_GROUPS_QUERY_KEYS.members(groupId) });
      queryClient.invalidateQueries({ queryKey: STUDY_GROUPS_QUERY_KEYS.detail(groupId) });
    },
  });
};

export const useRemoveStudyGroupMember = (groupId?: number) => {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, ApiError, number>({
    mutationFn: userId => {
      if (!groupId || Number.isNaN(groupId) || !userId || Number.isNaN(userId)) {
        const error = new Error('Invalid study group member identifier') as ApiError;
        error.status = 400;
        throw error;
      }
      return studyGroupsApi.removeMember(groupId, userId);
    },
    onSuccess: () => {
      if (!groupId || Number.isNaN(groupId)) return;
      queryClient.invalidateQueries({ queryKey: STUDY_GROUPS_QUERY_KEYS.members(groupId) });
      queryClient.invalidateQueries({ queryKey: STUDY_GROUPS_QUERY_KEYS.detail(groupId) });
    },
  });
};
