import type { PublicRoadmap } from '../../api/types';
import { getDifficultyClasses } from './dashboardUtils';

type RoadmapCardProps = {
  roadmap: PublicRoadmap;
  onClick: (id: number) => void;
};

export default function RoadmapCard({ roadmap, onClick }: RoadmapCardProps) {
  return (
    <div
      onClick={() => onClick(roadmap.pathId)}
      className="card p-6 hover:border-accent hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#7FDBCA]/10 to-transparent rounded-bl-full" />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="w-12 h-12 bg-gradient-to-br from-[#7FDBCA] to-[#00CC99] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyClasses(roadmap.difficulty)}`}>
          {roadmap.difficulty}
        </span>
      </div>

      <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors duration-200">{roadmap.topic}</h3>
      <p className="text-tertiary text-sm mb-4 line-clamp-2">{roadmap.title}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {roadmap.tags.slice(0, 2).map((tag, index) => (
          <span key={index} className="px-3 py-1 bg-tertiary text-secondary text-xs rounded-lg border border-secondary">
            {tag}
          </span>
        ))}
        {roadmap.tags.length > 2 && (
          <span className="px-3 py-1 bg-tertiary text-muted text-xs rounded-lg border border-secondary">
            +{roadmap.tags.length - 2}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-primary">
        <div className="flex items-center gap-3 text-tertiary text-xs">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{roadmap.moduleCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{roadmap.studyGroupCount}</span>
          </div>
        </div>
        <div className="text-muted text-xs">by {roadmap.owner.userName}</div>
      </div>

      <div className="mt-4 flex items-center text-[#7FDBCA] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-sm font-medium">Explore Roadmap</span>
        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}