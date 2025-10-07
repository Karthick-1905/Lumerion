// API Response Types
export interface SuccessResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: any;
}

// Auth Types
export interface RegisterRequest {
  user_name: string;
  user_email: string;
  user_password: string;
  confirmPassword: string;
}

export interface RegisterResponse extends SuccessResponse {
  message: string; // "Registered Successfully. Please check your email for verification code."
}

export interface LoginRequest {
  user_email: string;
  password: string;
}

export interface LoginResponse extends SuccessResponse {}

export interface VerifyEmailRequest {
  user_email: string;
  otp_code: string;
}

export interface ResendOTPRequest {
  user_email: string;
}

export interface ForgotPasswordRequest {
  user_email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// API Error Type
export interface ApiError extends Error {
  status?: number;
  response?: ErrorResponse;
}

// Learning Path Types
export interface LearningPath {
  pathId: number;
  query: string;
  goal: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  moduleCount: number;
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string;
}

export interface LearningPathsResponse extends SuccessResponse {
  learningPaths: LearningPath[];
}

// Lesson Types
export interface Lesson {
  title: string;
  description: string;
  estimatedTimeHours: number;
  completed: boolean;
}

// Module Types
export interface Module {
  pathModuleId: number;
  moduleId: number;
  title: string;
  description: string;
  position: number;
  estimatedDuration: number;
  difficulty: string | null;
  isOptional: boolean;
  isLocked: boolean;
  lessons: Lesson[];
  progress: number | null;
  createdAt: string;
  updatedAt: string;
}

// Progress Module (nested in progress)
export interface ProgressModule {
  title: string;
  lessons: Lesson[];
  moduleId: number;
  position: number;
}

// Progress Types
export interface Progress {
  domain: string;
  modules: ProgressModule[];
  threadId: string;
  requiresPrereqs: boolean;
}

// Learning Path Detail Types
export interface LearningPathDetail extends LearningPath {
  progress: Progress;
  modules: Module[];
}

export interface LearningPathDetailResponse extends SuccessResponse {
  learningPath: LearningPathDetail;
}

// Study Group Types
export interface StudyGroupSummary {
  groupId: number;
  groupName: string;
  visibility: 'public' | 'private' | 'restricted';
  memberCount: number;
  createdAt: string;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface StudyGroupsListResponse extends SuccessResponse {
  data: StudyGroupSummary[];
  pagination: Pagination;
}

export interface GroupMember {
  userId: number;
  userName: string;
  avatarUrl: string | null;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'inactive';
  joinedAt: string;
  lastActiveAt: string;
}

export interface GroupSettings {
  meetingDay: string;
  meetingTime: string;
  allowRecording: boolean;
}

export interface GroupCreator {
  userId: number;
  userName: string;
  avatarUrl: string | null;
}

export interface StudyGroupDetail {
  groupId: number;
  groupName: string;
  pathId: number;
  description: string;
  visibility: 'public' | 'private' | 'restricted';
  settings: GroupSettings;
  createdAt: string;
  createdBy: GroupCreator;
  members: GroupMember[];
}

export interface StudyGroupDetailResponse extends SuccessResponse {
  group: StudyGroupDetail;
}

export interface StudyGroupMembersResponse extends SuccessResponse {
  members: GroupMember[];
}

// Public Roadmap Types
export interface RoadmapOwner {
  userId: number;
  userName: string;
}

export interface PublicRoadmap {
  pathId: number;
  title: string;
  topic: string;
  visibility: 'public' | 'private' | 'restricted';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  moduleCount: number;
  studyGroupCount: number;
  createdAt: string;
  updatedAt: string;
  owner: RoadmapOwner;
}

export interface PublicRoadmapsResponse extends SuccessResponse {
  data: PublicRoadmap[];
  pagination: Pagination;
}

// User Study Group Types
export interface UserStudyGroup {
  groupId: number;
  groupName: string;
  pathId: number;
  pathTitle: string;
  visibility: 'public' | 'private' | 'restricted';
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'inactive';
  joinedAt: string;
  memberCount: number;
  createdAt: string;
}

export interface UserStudyGroupsResponse extends SuccessResponse {
  data: UserStudyGroup[];
  pagination: Pagination;
}
