import type { LearningPath } from '../../api/types';
import LearningPathCard from './LearningPathCard';

type LearningPathsSectionProps = {
  learningPaths: LearningPath[];
  filteredLearningPaths: LearningPath[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  searchTerm: string;
  onCardClick: (id: number) => void;
  onCreateLearningPath: () => void;
};

export default function LearningPathsSection({
  learningPaths,
  filteredLearningPaths,
  isLoading,
  isError,
  errorMessage,
  searchTerm,
  onCardClick,
  onCreateLearningPath,
}: LearningPathsSectionProps) {
  return (
    <section id="my-learning-paths" className="pt-8 border-t border-primary">
      <h2 className="text-4xl font-bold text-primary mb-2">My Learning Paths</h2>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-tertiary">Loading your learning paths...</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 font-medium mb-1">Failed to load learning paths</p>
          <p className="text-gray-400 text-sm">{errorMessage ?? 'Please try again later'}</p>
        </div>
      )}

      {!isLoading && !isError && learningPaths.length === 0 && (
        <div className="bg-tertiary/50 border border-secondary rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-primary mb-2">No Learning Paths Yet</h3>
          <p className="text-tertiary mb-6">Start your learning journey by creating your first path</p>
          <button
            onClick={onCreateLearningPath}
            className="px-6 py-3 bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-accent/20 transition-all duration-200"
          >
            Create Learning Path
          </button>
        </div>
      )}

      {!isLoading && !isError && learningPaths.length > 0 && filteredLearningPaths.length === 0 && searchTerm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-400 text-sm">No learning paths match your search</p>
          <p className="text-gray-500 text-xs mt-1">Try different keywords or clear the search</p>
        </div>
      )}

      {!isLoading && !isError && filteredLearningPaths.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLearningPaths.map(path => (
            <LearningPathCard key={path.pathId} path={path} onClick={onCardClick} />
          ))}
        </div>
      )}
    </section>
  );
}