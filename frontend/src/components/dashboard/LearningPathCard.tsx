import type { LearningPath } from '../../api/types';
import { formatDisplayDate, getDifficultyClasses } from './dashboardUtils';

type LearningPathCardProps = {
  path: LearningPath;
  onClick: (id: number) => void;
};

export default function LearningPathCard({ path, onClick }: LearningPathCardProps) {
  return (
    <div
      onClick={() => onClick(path.pathId)}
      className="card p-6 hover:border-accent hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#7FDBCA] to-[#00CC99] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyClasses(path.difficulty)}`}>
          {path.difficulty}
        </span>
      </div>

      <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors duration-200">
        {path.query}
      </h3>
      <p className="text-tertiary text-sm mb-4 line-clamp-2">{path.goal}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {path.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="px-3 py-1 bg-tertiary text-secondary text-xs rounded-lg border border-secondary">
            {tag}
          </span>
        ))}
        {path.tags.length > 3 && (
          <span className="px-3 py-1 bg-tertiary text-muted text-xs rounded-lg border border-secondary">
            +{path.tags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-primary">
        <div className="flex items-center gap-2 text-tertiary text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{path.moduleCount} modules</span>
        </div>
        <div className="text-muted text-xs">{formatDisplayDate(path.createdAt)}</div>
      </div>

      <div className="mt-4 flex items-center text-[#7FDBCA] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-sm font-medium">View Details</span>
        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}