import { useQuery } from '@tanstack/react-query';
import Sidebar from '../../components/ui/Sidebar';
import { userApi } from '../../api/user';

const SkillAssessments = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['skillAssessments'],
    queryFn: userApi.getSkillAssessments,
  });

  const assessments = data?.assessments || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-300 border-green-500/40';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'hard': return 'bg-red-500/20 text-red-300 border-red-500/40';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  const getSkillLevelColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'bg-gray-500/20 text-gray-300';
      case 'intermediate': return 'bg-blue-500/20 text-blue-300';
      case 'advanced': return 'bg-purple-500/20 text-purple-300';
      case 'expert': return 'bg-gold-500/20 text-yellow-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="flex h-screen bg-primary overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Skill Assessments</h1>
            <p className="text-secondary">Test your knowledge and get personalized skill level assessments</p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-secondary">Loading skill assessments...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-red-500/20 border border-red-400/30 rounded-full flex items-center justify-center text-red-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-primary font-semibold">Unable to load assessments</p>
                  <p className="text-secondary text-sm">{error?.message || 'Please try again later.'}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((assessment) => (
                <div
                  key={assessment.assessmentId}
                  className="bg-secondary border border-border rounded-2xl p-6 hover:border-accent/40 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-primary mb-2">{assessment.title}</h3>
                      {assessment.description && (
                        <p className="text-secondary text-sm mb-3">{assessment.description}</p>
                      )}
                    </div>
                    {assessment.isCompleted && (
                      <div className="w-8 h-8 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center ml-3">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-secondary text-sm">Topic:</span>
                    <span className="text-primary text-sm font-medium">{assessment.topic}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide border rounded-lg ${getDifficultyColor(assessment.difficultyLevel)}`}>
                      {assessment.difficultyLevel}
                    </span>
                    {assessment.estimatedDuration && (
                      <span className="text-secondary text-sm">
                        {assessment.estimatedDuration} min
                      </span>
                    )}
                  </div>

                  {assessment.isCompleted && assessment.result ? (
                    <div className="bg-primary border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-secondary text-sm">Score:</span>
                        <span className="text-primary font-semibold">
                          {assessment.result.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-secondary text-sm">Level:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-lg ${getSkillLevelColor(assessment.result.skillLevel)}`}>
                          {assessment.result.skillLevel}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="w-full bg-gradient-to-r from-accent to-accent/80 text-primary font-semibold py-3 px-4 rounded-xl hover:from-accent/90 hover:to-accent/70 transition-all duration-200"
                      onClick={() => window.location.href = `/skill-assessments/${assessment.assessmentId}`}
                    >
                      Take Assessment
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isLoading && !isError && assessments.length === 0 && (
            <div className="bg-secondary border border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-secondary mb-2">No skill assessments available</p>
              <p className="text-secondary/60 text-sm">Check back later for new assessments</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SkillAssessments;