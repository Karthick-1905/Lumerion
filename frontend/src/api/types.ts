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
  lastUpdatedAt?: string;
  threadId?: string;
  visibility?: 'public' | 'private' | 'restricted';
}

export interface LearningPathsResponse extends SuccessResponse {
  learningPaths: LearningPath[];
}

// Lesson Types
export interface Lesson {
  title: string;
  description: string;
  masteryCheck?: string;
  estimatedTimeHours: number | null;
  recommendedResources?: string[];
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
  prerequisites: number[];
  dependencyType: string | null;
  isOptionalDependency: boolean;
}

// Bootstrap Summary
export interface BootstrapSummary {
  knowledgeGaps: string[];
  learnerPersona: string;
  topicStatement: string;
  successCriteria: string[];
  experienceSummary: string;
  learningObjectives: string[];
  learningConstraints: string[];
  learningPreferences: string[];
}

// Graph Context
export interface GraphContext {
  graphNotes: string;
  focusConcept: string | null;
  relatedResources: any[];
  supportingConcepts: any[];
  directPrerequisites: any[];
}

// Prerequisite Plan Step
export interface PrerequisiteStep {
  sequence: number;
  conceptName: string;
  masteryCheck: string;
  justification: string;
  categorisation: string;
  recommendedResources: string[];
}

// Prerequisite Plan
export interface PrerequisitePlan {
  steps: PrerequisiteStep[];
  summary: string;
  refresherAdvice: string[];
  missingFoundations: string[];
  integrationGuidance: string[];
}

// Progress Module (nested in progress)
export interface ProgressModule {
  title: string;
  lessons: Lesson[];
  moduleId: number;
  position: number;
}

// Dependency
export interface Dependency {
  moduleId: number;
  isOptional: boolean;
  dependencyType: string;
  prerequisiteModuleIds: number[];
}

// Progress Types
export interface Progress {
  threadId: string;
  topic: string;
  domain: string;
  requiresPrereqs: boolean;
  bootstrapSummary: BootstrapSummary;
  graphContext: GraphContext;
  prerequisitePlan: PrerequisitePlan;
  modules: ProgressModule[];
  dependencies: Dependency[];
  updatedAt: string;
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

export type StudyGroupVisibility = 'public' | 'private' | 'restricted';

export interface CreateStudyGroupPayload {
  groupName: string;
  description: string;
  visibility: StudyGroupVisibility;
  settings: GroupSettings;
  initialMembers?: number[];
}

export interface StudyGroupResponse extends SuccessResponse {
  group: {
    groupId: number;
    groupName: string;
    pathId: number;
    description: string;
    visibility: StudyGroupVisibility;
    settings: GroupSettings;
    createdAt: string;
    memberCount: number;
  };
}

export interface GroupMember {
  userId: number;
  userName: string;
  avatarUrl: string | null;
  role: StudyGroupRole;
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

export type StudyGroupRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface AddMemberPayload {
  userId: number;
  role: StudyGroupRole;
  invite: boolean;
}

export interface UpdateMemberPayload {
  role: StudyGroupRole;
}

export interface UserSearchResult {
  userId: number;
  userName: string;
}

export interface UserSearchResponse extends SuccessResponse {
  results: UserSearchResult[];
  pagination: Pagination;
}

export type NotificationType = 'friend_request' | 'study_group_invitation' | 'system';

export interface NotificationSender {
  userId: number;
  userName: string;
  avatarUrl: string | null;
}

export interface NotificationItem {
  type: NotificationType;
  requestId?: number;
  invitationId?: number;
  message: string | null;
  createdAt: string;
  sender: NotificationSender;
}

export interface NotificationsCounts {
  total: number;
  friendRequests: number;
  studyGroupInvitations: number;
}

export interface NotificationsResponse extends SuccessResponse {
  notifications: NotificationItem[];
  counts: NotificationsCounts;
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

// Roadmap Generation Types
export interface GenerateRoadmapRequest {
  topic: string;
}

export interface GeneratedModuleLesson {
  title: string;
  description: string;
  estimatedTimeHours: number | null;
  recommendedResources?: string[];
  masteryCheck?: string;
}

export interface GeneratedModule {
  title: string;
  description: string;
  lessons: GeneratedModuleLesson[];
}

export interface GenerateRoadmapResponse extends SuccessResponse {
  threadId: string;
  topic: string;
  domain: string;
  requiresPrereqs: boolean;
  prerequisitePlan: PrerequisitePlan;
  modules: GeneratedModule[];
}

export interface SaveRoadmapRequest {
  threadId: string;
  topic: string;
  goal: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SaveRoadmapResponse extends GenerateRoadmapResponse {
  pathId: number;
  progress: Progress;
  dependencies?: Dependency[];
  bootstrapSummary?: BootstrapSummary;
  graphContext?: GraphContext;
  savedModules?: {
    moduleId: number;
    position: number;
    title: string;
  }[];
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

// User Profile Types
export interface UserProfile {
  userId: number;
  userEmail: string;
  userName: string;
  avatarPublicUrl: string | null;
  isVerified: boolean;
  updatedAt: string;
}

export interface UserMetrics {
  totalLearningPaths: number;
  totalModules: number;
  completedModules: number;
}

export interface UserProfileResponse extends SuccessResponse {
  profile: UserProfile;
  metrics: UserMetrics;
}

// Module Progress Types
export type ModuleProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface UpdateModuleProgressPayload {
  completionPercent: number;
  status: ModuleProgressStatus;
  markCompleted: boolean;
}

export interface ModuleProgressState {
  pathId: number;
  moduleId: number;
  status: ModuleProgressStatus;
  completionPercent: number;
  lastAccessed: string;
}

export interface PathProgressState {
  totalModules: number;
  completedModules: number;
  completionPercent: number;
  updatedAt: string;
}

export interface ModuleProgressResponse extends SuccessResponse {
  moduleProgress: ModuleProgressState;
  pathProgress: PathProgressState;
  roadmapState: Progress;
}
