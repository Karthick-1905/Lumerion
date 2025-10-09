import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from '../../components/Sidebar';
import { useLearningPathDetail, useUpdateModuleProgress } from '../../hooks/useLearningPath';
import { useStudyGroupsByPath } from '../../hooks/useStudyGroups';
import CreateStudyGroupDialog from '../../components/studyGroups/CreateStudyGroupDialog';
import type {
  Module,
  Lesson,
  ModuleProgressStatus,
  UpdateModuleProgressPayload,
  ApiError,
} from '../../api/types';

const LearningPathDetail = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const pathIdNumber = Number(pathId);
  const { data, isLoading, isError, error } = useLearningPathDetail(pathIdNumber);
  const updateModuleProgress = useUpdateModuleProgress(pathIdNumber);
  const { data: studyGroupsData, isLoading: studyGroupsLoading } = useStudyGroupsByPath(pathIdNumber);
  const learningPath = data?.learningPath;
  const progress = learningPath?.progress;
  const prereqPlan = progress?.prerequisitePlan;
  const dependencies = progress?.dependencies ?? [];

  const [lessonCompletionState, setLessonCompletionState] = useState<Record<number, boolean[]>>({});
  const [isCreateStudyGroupOpen, setIsCreateStudyGroupOpen] = useState(false);

  useEffect(() => {
    if (!learningPath?.modules) {
      setLessonCompletionState({});
      return;
    }

    setLessonCompletionState(prev => {
      const nextState: Record<number, boolean[]> = {};

      learningPath.modules.forEach(module => {
        const existing = prev[module.moduleId];
        if (existing && existing.length === module.lessons.length) {
          nextState[module.moduleId] = existing;
        } else {
          nextState[module.moduleId] = module.lessons.map(lesson => !!lesson.completed);
        }
      });

      return nextState;
    });
  }, [learningPath?.modules]);

  const getLessonCompletion = (module: Module, lessonIndex: number) => {
    const state = lessonCompletionState[module.moduleId];
    if (state && state.length === module.lessons.length) {
      return state[lessonIndex] ?? false;
    }
    return module.lessons[lessonIndex]?.completed ?? false;
  };

  const handleLessonToggle = async (module: Module, lessonIndex: number) => {
    if (!module.lessons || module.lessons.length === 0) {
      return;
    }

    if (updateModuleProgress.isPending && updateModuleProgress.variables?.moduleId === module.moduleId) {
      toast.info('Please wait for the current update to finish.');
      return;
    }

    const existingState = lessonCompletionState[module.moduleId];
    const previousState = existingState && existingState.length === module.lessons.length
      ? [...existingState]
      : module.lessons.map(lesson => !!lesson.completed);

    const updatedState = [...previousState];
    updatedState[lessonIndex] = !updatedState[lessonIndex];

    setLessonCompletionState(prev => ({
      ...prev,
      [module.moduleId]: updatedState,
    }));

    const completedCount = updatedState.filter(Boolean).length;
    const totalLessons = updatedState.length;
    const completionPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
    const status: ModuleProgressStatus =
      completionPercent >= 100 ? 'completed' : completedCount > 0 ? 'in_progress' : 'not_started';

    const payload: UpdateModuleProgressPayload = {
      completionPercent,
      status,
      markCompleted: status === 'completed',
    };

    try {
      const response = await updateModuleProgress.mutateAsync({ moduleId: module.moduleId, payload });
      const lessonTitle = module.lessons[lessonIndex]?.title ?? 'Lesson';
      toast.success(
        updatedState[lessonIndex]
          ? `Marked "${lessonTitle}" as completed.`
          : `Marked "${lessonTitle}" as not completed.`
      );
      if (response.pathProgress) {
        toast.info(`Roadmap completion is now ${response.pathProgress.completionPercent}%`);
      }
    } catch (err) {
      setLessonCompletionState(prev => ({
        ...prev,
        [module.moduleId]: previousState,
      }));
      const apiError = err as ApiError;
      const message = apiError?.response?.message || apiError?.message || 'Failed to update module progress.';
      toast.error(message);
    }
  };

  const moduleTitleMap = new Map(
    learningPath?.modules?.map(module => [module.moduleId, module.title]) ?? []
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const calculateModuleProgress = (module: Module) => {
    const state = lessonCompletionState[module.moduleId];
    if (state && state.length === module.lessons.length) {
      const completedLessons = state.filter(Boolean).length;
      const totalLessons = state.length;
      return totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
    }

    if (!module.lessons || module.lessons.length === 0) return 0;
    const completedLessons = module.lessons.filter(lesson => lesson.completed).length;
    return Math.round((completedLessons / module.lessons.length) * 100);
  };

  const calculateOverallProgress = () => {
    if (!learningPath?.modules || learningPath.modules.length === 0) return 0;
    let totalLessons = 0;
    let completedLessons = 0;

    learningPath.modules.forEach(module => {
      const state = lessonCompletionState[module.moduleId];
      if (state && state.length === module.lessons.length) {
        totalLessons += state.length;
        completedLessons += state.filter(Boolean).length;
      } else {
        totalLessons += module.lessons.length;
        completedLessons += module.lessons.filter(lesson => lesson.completed).length;
      }
    });

    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const formatHours = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined) {
      return 'N/A';
    }
    return `${hours}h`;
  };

  const renderStringList = (items?: string[], emptyLabel?: string) => {
    if (!items || items.length === 0) {
      return (
        <span className="text-gray-500 text-sm">
          {emptyLabel ?? 'No information provided'}
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="px-3 py-1 bg-gray-800/80 text-gray-200 text-xs rounded-lg border border-gray-700"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#1E1E1E] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#7FDBCA] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading learning path...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="p-8">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-medium mb-1">Failed to load learning path</p>
              <p className="text-gray-400 text-sm">
                {error?.response?.message || error?.message || 'Please try again later'}
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && learningPath && (
          <div className="p-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Dashboard</span>
            </button>

            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-3">
                    {learningPath.query}
                  </h1>
                  <p className="text-gray-400 text-lg mb-4">
                    {learningPath.goal}
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium border ${getDifficultyColor(learningPath.difficulty)}`}>
                      {learningPath.difficulty}
                    </span>
                    <span className="px-4 py-2 rounded-xl text-sm font-medium bg-[#7FDBCA]/10 text-[#7FDBCA] border border-[#7FDBCA]/20">
                      {learningPath.moduleCount} Modules
                    </span>
                    {progress?.domain && (
                      <span className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-800 text-gray-300 border border-gray-700">
                        {progress.domain}
                      </span>
                    )}
                    {learningPath.visibility && (
                      <span className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-700 text-gray-300 bg-gray-800/80">
                        Visibility: {learningPath.visibility}
                      </span>
                    )}
                    
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {learningPath.tags && learningPath.tags.length > 0 ? (
                      learningPath.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-lg border border-gray-700"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 bg-gray-800 text-gray-400 text-sm rounded-lg border border-gray-700">
                        No tags provided
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateStudyGroupOpen(true)}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] text-[#0B1F1A] text-sm font-semibold shadow-lg shadow-[#7FDBCA]/20 hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Study Group
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/study-groups/learning-paths/${learningPath.pathId}`)}
                    className="text-sm text-[#7FDBCA] hover:text-white transition-colors"
                  >
                    View all study groups
                  </button>
                  <div className="text-xs text-gray-500">
                    {studyGroupsLoading
                      ? 'Checking existing study groups...'
                      : `${studyGroupsData?.pagination.total ?? 0} group${(studyGroupsData?.pagination.total ?? 0) === 1 ? '' : 's'} available`}
                  </div>
                </div>
              </div>

              <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-medium">Overall Progress</span>
                  <span className="text-[#7FDBCA] font-bold text-lg">{calculateOverallProgress()}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] rounded-full transition-all duration-500"
                    style={{ width: `${calculateOverallProgress()}%` }}
                  />
                </div>
              </div>
            </div>

            
            {prereqPlan && (
              <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Prerequisite Plan</h2>
                    <p className="text-gray-400 text-sm max-w-2xl">
                      {prereqPlan.summary}
                    </p>
                  </div>
                  <div className="bg-[#242424] border border-gray-800 rounded-xl p-4 text-sm text-gray-300 max-w-md">
                    <h3 className="text-white font-semibold mb-2">Refresher Advice</h3>
                    {prereqPlan.refresherAdvice && prereqPlan.refresherAdvice.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-gray-400">
                        {prereqPlan.refresherAdvice.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">No refresher advice provided.</p>
                    )}
                  </div>
                </div>

                {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#242424] border border-gray-800 rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-2">Missing Foundations</h3>
                    {renderStringList(prereqPlan.missingFoundations, 'No missing foundations recorded')}
                  </div>
                  <div className="bg-[#242424] border border-gray-800 rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-2">Integration Guidance</h3>
                    {renderStringList(prereqPlan.integrationGuidance, 'No integration guidance provided')}
                  </div>
                </div> */}

                {prereqPlan.steps && prereqPlan.steps.length > 0 && (
                  <div className="space-y-4">
                    {prereqPlan.steps.map(step => (
                      <div
                        key={step.sequence}
                        className="bg-[#242424] border border-gray-800 rounded-2xl p-5 hover:border-[#7FDBCA]/40 transition-all duration-200"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-[#7FDBCA] mb-1">Step {step.sequence}</div>
                            <h3 className="text-lg font-semibold text-white">{step.conceptName}</h3>
                          </div>
                          <span className="px-3 py-1 text-xs font-medium border border-[#7FDBCA]/30 text-[#7FDBCA] rounded-full">
                            {step.categorisation}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-3 leading-relaxed">{step.justification}</p>
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-gray-400 mb-1">Mastery Check</h4>
                          <p className="text-gray-300 text-sm">{step.masteryCheck}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-400 mb-1">Recommended Resources</h4>
                          {renderStringList(step.recommendedResources, 'No resources provided')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Learning Roadmap</h2>
              <p className="text-gray-400">Follow the path to master {learningPath.query}</p>
            </div>

            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#7FDBCA] via-[#00CC99] to-transparent"></div>

              <div className="space-y-8">
                {learningPath.modules.map((module: Module, moduleIndex: number) => {
                  const moduleCompletionPercent = calculateModuleProgress(module);
                  const isCompleted = moduleCompletionPercent === 100;
                  const isInProgress = moduleCompletionPercent > 0 && moduleCompletionPercent < 100;
                  const moduleDependencies = dependencies.filter(dep => dep.moduleId === module.moduleId);
                  const lessonStates = lessonCompletionState[module.moduleId] ?? module.lessons.map(lesson => !!lesson.completed);
                  const completedLessons = lessonStates.filter(Boolean).length;
                  const moduleStatus = moduleCompletionPercent >= 100 ? 'Completed' : completedLessons > 0 ? 'In Progress' : 'Not Started';

                  return (
                    <div key={module.moduleId} className="relative pl-20">
                      <div className={`absolute left-0 w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-lg border-4 border-[#1E1E1E] transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-[#7FDBCA] to-[#00CC99] text-white shadow-lg shadow-[#7FDBCA]/30'
                          : isInProgress
                          ? 'bg-[#242424] text-[#7FDBCA] border-[#7FDBCA]'
                          : 'bg-[#242424] text-gray-500 border-gray-700'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{moduleIndex + 1}</span>
                        )}
                      </div>

                      <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6 hover:border-[#7FDBCA]/50 transition-all duration-300 group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#7FDBCA] transition-colors">
                              {module.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-3">
                              {module.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{formatHours(module.estimatedDuration)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>{module.lessons.length} lessons</span>
                              </div>
                              {module.prerequisites && module.prerequisites.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6h6v6m-8 4h10a2 2 0 002-2v-6a2 2 0 00-2-2h-3l-2-2-2 2H7a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                  </svg>
                                  <span>
                                    {module.prerequisites
                                      .map(prereqId => moduleTitleMap.get(prereqId) ?? `Module ${prereqId}`)
                                      .join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {module.isLocked && (
                            <div className="ml-4">
                              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-xs text-gray-500 font-medium block">Module Progress</span>
                              <span className="text-sm text-gray-300">{moduleStatus}</span>
                            </div>
                            <span className="text-xs text-[#7FDBCA] font-bold">{moduleCompletionPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] rounded-full transition-all duration-500"
                              style={{ width: `${moduleCompletionPercent}%` }}
                            />
                          </div>
                        </div>

                        {moduleDependencies.length > 0 && (
                          <div className="mb-4 bg-[#1E1E1E] border border-gray-800 rounded-xl p-4">
                            <div className="text-xs font-semibold text-gray-300 mb-2">Dependencies</div>
                            <div className="space-y-2">
                              {moduleDependencies.map(dependency => {
                                const prerequisiteTitles = dependency.prerequisiteModuleIds.map(id => moduleTitleMap.get(id) ?? `Module ${id}`);

                                return (
                                  <div key={`${module.moduleId}-dependency-${dependency.moduleId}-${dependency.dependencyType}`} className="text-xs text-gray-400 space-y-1">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="font-medium text-gray-200 capitalize">{dependency.dependencyType ?? 'Dependency'}</div>
                                      <span className={`px-2 py-0.5 rounded-full border text-[10px] ${dependency.isOptional ? 'border-gray-700 text-gray-300' : 'border-[#7FDBCA]/40 text-[#7FDBCA]'}`}>
                                        {dependency.isOptional ? 'Optional' : 'Required'}
                                      </span>
                                    </div>
                                    {prerequisiteTitles.length > 0 ? (
                                      <div className="flex flex-wrap gap-2">
                                        {prerequisiteTitles.map(title => (
                                          <span
                                            key={`${module.moduleId}-${dependency.moduleId}-${title}`}
                                            className="px-3 py-1 bg-gray-800/70 text-gray-200 rounded-lg border border-gray-700"
                                          >
                                            {title}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">No prerequisites</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          {module.lessons.map((lesson: Lesson, lessonIndex: number) => {
                            const lessonIsCompleted = getLessonCompletion(module, lessonIndex);
                            return (
                              <div
                                key={lessonIndex}
                                className={`p-4 rounded-xl border transition-all duration-200 ${
                                  lessonIsCompleted
                                    ? 'bg-[#7FDBCA]/5 border-[#7FDBCA]/20'
                                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                }`}
                              >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleLessonToggle(module, lessonIndex)}
                                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7FDBCA] ${
                                    lessonIsCompleted
                                      ? 'bg-[#7FDBCA] border-[#7FDBCA] text-white shadow-lg shadow-[#7FDBCA]/30'
                                      : 'border-gray-600 text-gray-400 hover:border-[#7FDBCA] hover:text-[#7FDBCA]'
                                  }`}
                                >
                                  {lessonIsCompleted ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : (
                                    <span className="text-xs font-semibold">{lessonIndex + 1}</span>
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-medium mb-1 ${lessonIsCompleted ? 'text-[#7FDBCA]' : 'text-white'}`}>
                                    {lesson.title}
                                  </h4>
                                  <p className="text-sm text-gray-400 mb-2">
                                    {lesson.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{formatHours(lesson.estimatedTimeHours)}</span>
                                  </div>
                                  {lesson.masteryCheck && (
                                    <div className="mt-2 text-xs text-gray-400">
                                      <span className="font-semibold text-gray-300">Mastery Check:</span> {lesson.masteryCheck}
                                    </div>
                                  )}
                                  {lesson.recommendedResources && lesson.recommendedResources.length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-xs font-semibold text-gray-400 mb-1">Recommended Resources</div>
                                      <div className="flex flex-wrap gap-2">
                                        {lesson.recommendedResources.map((resource, resourceIndex) => (
                                          <span
                                            key={`${lessonIndex}-resource-${resourceIndex}`}
                                            className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-700"
                                          >
                                            {resource}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            )
                        })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <CreateStudyGroupDialog
        isOpen={isCreateStudyGroupOpen}
        onClose={() => setIsCreateStudyGroupOpen(false)}
        pathId={pathIdNumber}
        onCreated={(groupId: number) => {
          toast.success('Study group created successfully!');
          setIsCreateStudyGroupOpen(false);
          navigate(`/study-groups/${groupId}`);
        }}
      />
    </div>
  )
};

export default LearningPathDetail;
