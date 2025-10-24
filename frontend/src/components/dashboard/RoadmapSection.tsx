import type { PublicRoadmap } from '../../api/types';
import RoadmapCard from './RoadmapCard';

type RoadmapSectionProps = {
  title: string;
  roadmaps: PublicRoadmap[];
  filteredRoadmaps: PublicRoadmap[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  searchTerm: string;
  onCardClick: (id: number) => void;
};

export default function RoadmapSection({
  title,
  roadmaps,
  filteredRoadmaps,
  isLoading,
  isError,
  errorMessage,
  searchTerm,
  onCardClick,
}: RoadmapSectionProps) {
  return (
    <section>
      <h2 className="text-3xl font-bold text-primary mb-4">{title}</h2>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-tertiary text-sm">Loading roadmaps...</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-red-400 text-sm">{errorMessage ?? 'Failed to load public roadmaps'}</p>
        </div>
      )}

      {!isLoading && !isError && roadmaps.length === 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 text-sm">No public roadmaps available</p>
        </div>
      )}

      {!isLoading && !isError && roadmaps.length > 0 && filteredRoadmaps.length === 0 && searchTerm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-400 text-sm">No roadmaps match your search</p>
          <p className="text-gray-500 text-xs mt-1">Try different keywords or clear the search</p>
        </div>
      )}

      {!isLoading && !isError && filteredRoadmaps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoadmaps.map(roadmap => (
            <RoadmapCard key={roadmap.pathId} roadmap={roadmap} onClick={onCardClick} />
          ))}
        </div>
      )}
    </section>
  );
}