import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useLearningPathDetail } from '../../hooks/useLearningPath';
import type { Module, Lesson } from '../../api/types';

const LearningPathDetail = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useLearningPathDetail(Number(pathId));

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
    if (!module.lessons || module.lessons.length === 0) return 0;
    const completedLessons = module.lessons.filter(lesson => lesson.completed).length;
    return Math.round((completedLessons / module.lessons.length) * 100);
  };

  const calculateOverallProgress = () => {
    if (!data?.learningPath.modules || data.learningPath.modules.length === 0) return 0;
    const totalLessons = data.learningPath.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const completedLessons = data.learningPath.modules.reduce(
      (acc, module) => acc + module.lessons.filter(lesson => lesson.completed).length,
      0
    );
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
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

        {!isLoading && !isError && data?.learningPath && (
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
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-3">
                    {data.learningPath.query}
                  </h1>
                  <p className="text-gray-400 text-lg mb-4">
                    {data.learningPath.goal}
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium border ${getDifficultyColor(data.learningPath.difficulty)}`}>
                      {data.learningPath.difficulty}
                    </span>
                    <span className="px-4 py-2 rounded-xl text-sm font-medium bg-[#7FDBCA]/10 text-[#7FDBCA] border border-[#7FDBCA]/20">
                      {data.learningPath.moduleCount} Modules
                    </span>
                    <span className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-800 text-gray-300 border border-gray-700">
                      {data.learningPath.progress.domain}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.learningPath.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-lg border border-gray-700"
                      >
                        #{tag}
                      </span>
                    ))}
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

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Learning Roadmap</h2>
              <p className="text-gray-400">Follow the path to master {data.learningPath.query}</p>
            </div>

            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#7FDBCA] via-[#00CC99] to-transparent"></div>

              <div className="space-y-8">
                {data.learningPath.modules.map((module: Module, moduleIndex: number) => {
                  const progress = calculateModuleProgress(module);
                  const isCompleted = progress === 100;
                  const isInProgress = progress > 0 && progress < 100;

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
                                <span>{module.estimatedDuration}h</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>{module.lessons.length} lessons</span>
                              </div>
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
                            <span className="text-xs text-gray-500 font-medium">Module Progress</span>
                            <span className="text-xs text-[#7FDBCA] font-bold">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          {module.lessons.map((lesson: Lesson, lessonIndex: number) => (
                            <div
                              key={lessonIndex}
                              className={`p-4 rounded-xl border transition-all duration-200 ${
                                lesson.completed
                                  ? 'bg-[#7FDBCA]/5 border-[#7FDBCA]/20'
                                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                                  lesson.completed
                                    ? 'bg-[#7FDBCA] border-[#7FDBCA]'
                                    : 'border-gray-600'
                                }`}>
                                  {lesson.completed && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-medium mb-1 ${lesson.completed ? 'text-[#7FDBCA]' : 'text-white'}`}>
                                    {lesson.title}
                                  </h4>
                                  <p className="text-sm text-gray-400 mb-2">
                                    {lesson.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{lesson.estimatedTimeHours}h</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
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
    </div>
  );
};

export default LearningPathDetail;
