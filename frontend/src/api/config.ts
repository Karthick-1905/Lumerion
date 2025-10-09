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
      RESET_PASSWORD: '/api/auth/reset-password'
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
      MEMBER_DETAIL: (groupId: number, userId: number) => `/api/study-groups/${groupId}/members/${userId}`
    },
    USER: {
      GET_PROFILE: '/api/user/profile',
      SEARCH: (term: string) => `/api/user/search?term=${encodeURIComponent(term)}`,
      NOTIFICATIONS: '/api/user/notifications'
    },
    ROADMAPS: {
      GET_PUBLIC: '/api/roadmap/public',
      GENERATE: '/api/roadmap/generate',
      SAVE: '/api/roadmap/save'
    }
  }
} as const;
