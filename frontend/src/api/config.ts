// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      VERIFY_EMAIL: '/api/auth/verify-email',
      RESEND_OTP: '/api/auth/resend-otp',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password',
      LOGOUT: '/api/auth/logout'
    },
    LEARNING_PATHS: {
      GET_ALL: '/api/user/learning-paths',
      GET_BY_ID: (id: number) => `/api/user/learning-paths/${id}`,
      MODULE_PROGRESS: (pathId: number, moduleId: number) =>
        `/api/user/learning-paths/${pathId}/modules/${moduleId}/progress`
    },
    STUDY_GROUPS: {
      GET_BY_PATH: (pathId: number) => `/api/study-groups/learning-paths/${pathId}`,
      GET_BY_ID: (groupId: number) => `/api/study-groups/${groupId}`,
      GET_MEMBERS: (groupId: number) => `/api/study-groups/${groupId}/members`,
      GET_MY_GROUPS: '/api/study-groups/me',
      CREATE: (pathId: number) => `/api/study-groups/learning-paths/${pathId}`,
      ADD_MEMBER: (groupId: number) => `/api/study-groups/${groupId}/members`,
      MEMBER_DETAIL: (groupId: number, userId: number) => `/api/study-groups/${groupId}/members/${userId}`,
      RESPOND_TO_INVITATION: (groupId: number) => `/api/study-groups/${groupId}/members/respond`
    },
    USER: {
      GET_PROFILE: '/api/user/profile',
      SEARCH: (term: string, limit?: number, offset?: number) => {
        const params = new URLSearchParams();
        params.set('term', term);
        if (limit !== undefined) params.set('limit', String(limit));
        if (offset !== undefined) params.set('offset', String(offset));
        return `/api/user/search?${params.toString()}`;
      },
      NOTIFICATIONS: '/api/user/notifications',
      SKILL_ASSESSMENTS: {
        GET_ALL: '/api/user/skill-assessments',
        GET_BY_ID: (assessmentId: number) => `/api/user/skill-assessments/${assessmentId}`,
        SUBMIT: (assessmentId: number) => `/api/user/skill-assessments/${assessmentId}/submit`
      },
      ACTIVITY_FEED: '/api/user/activity-feed'
    },
    ROADMAPS: {
      GET_PUBLIC: '/api/roadmap/public',
      GENERATE: '/api/roadmap/generate',
      SAVE: '/api/roadmap/save'
    },
    NOTES: {
      CREATE: '/api/notes',
      DETAIL: (noteId: number | string) => `/api/notes/${noteId}`,
      UPDATE: (noteId: number | string) => `/api/notes/${noteId}`,
      UPLOAD_MEDIA: (noteId: number | string) => `/api/notes/${noteId}/media`,
    },
    FRIENDS: {
      LIST: (limit?: number, offset?: number) => {
        const params = new URLSearchParams();
        if (limit !== undefined) params.set('limit', String(limit));
        if (offset !== undefined) params.set('offset', String(offset));
        const qs = params.toString();
        return `/api/friends${qs ? `?${qs}` : ''}`;
      },
      REQUEST: '/api/friends/request',
      REQUESTS: (direction?: 'inbound' | 'outbound' | 'all', status?: 'pending' | 'accepted' | 'rejected' | 'blocked', limit?: number, offset?: number) => {
        const params = new URLSearchParams();
        if (direction) params.set('direction', direction);
        if (status) params.set('status', status);
        if (limit !== undefined) params.set('limit', String(limit));
        if (offset !== undefined) params.set('offset', String(offset));
        const qs = params.toString();
        return `/api/friends/requests${qs ? `?${qs}` : ''}`;
      },
      ACCEPT: (requestId: number) => `/api/friends/request/${requestId}/accept`,
      DECLINE: (requestId: number) => `/api/friends/request/${requestId}/decline`,
      REMOVE: (friendUserId: number) => `/api/friends/${friendUserId}`,
    }

  }
} as const;
