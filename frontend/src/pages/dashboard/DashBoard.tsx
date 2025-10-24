import { useMemo, useState } from "react";
import Sidebar from "../../components/ui/Sidebar";
import { useLearningPaths } from "../../hooks/useLearningPath";
import { usePublicRoadmaps } from "../../hooks/useRoadmaps";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardHeader from "../../components/dashboard/Header";
import RoadmapSection from "../../components/dashboard/RoadmapSection";
import LearningPathsSection from "../../components/dashboard/LearningPathSection";
import type { LearningPath, PublicRoadmap } from "../../api/types";

const Dashboard = () => {
  const { data, isLoading, isError, error } = useLearningPaths();
  const {
    data: publicRoadmapsData,
    isLoading: publicLoading,
    isError: publicError,
    error: publicErrorDetail,
  } = usePublicRoadmaps();
  const { data: userData } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState("");
  const profile = userData?.profile;

  const quickAccessLinks = useMemo(
    () => [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Learning Paths", path: "/dashboard#my-learning-paths" },
      { label: "Study Groups", path: "/study-groups" },
      { label: "Profile", path: "/profile" },
    ],
    []
  );

  const handleQuickLink = (path: string) => {
    if (path.includes("#")) {
      const [basePath, hash] = path.split("#");
      if (location.pathname !== basePath) {
        navigate(basePath);
        setTimeout(() => {
          if (hash) {
            document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else if (hash) {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }
    navigate(path);
  };

  const handleCreateLearningPath = () => navigate("/learning-paths/create");
  const handleRoadmapClick = (pathId: number) => navigate(`/learning-path/${pathId}`);

  const allRoadmaps = publicRoadmapsData?.data ?? [];
  const allLearningPaths = data?.learningPaths ?? [];

  const filteredPublicRoadmaps = useMemo(
    () =>
      allRoadmaps.filter(
        (roadmap: PublicRoadmap) =>
          searchTerm === "" ||
          roadmap.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          roadmap.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [allRoadmaps, searchTerm]
  );

  const filteredLearningPaths = useMemo(
    () =>
      allLearningPaths.filter(
        (path: LearningPath) =>
          searchTerm === "" ||
          path.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
          path.goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
          path.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [allLearningPaths, searchTerm]
  );

  return (
    <div className="flex h-screen bg-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <DashboardHeader
          userName={profile?.userName}
          userEmail={profile?.userEmail}
          avatarUrl={profile?.avatarPublicUrl ?? undefined}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateLearningPath={handleCreateLearningPath}
          quickLinks={quickAccessLinks}
          onQuickLink={handleQuickLink}
        />

        <div className="p-8 space-y-12">
          <div className="md:hidden">
            <button
              type="button"
              onClick={handleCreateLearningPath}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] text-sm font-semibold text-[#0B1F1A] shadow-lg shadow-[#7FDBCA]/20 hover:shadow-xl transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Learning Path
            </button>
          </div>

          <RoadmapSection
            title="Explore Public Roadmaps"
            roadmaps={allRoadmaps}
            filteredRoadmaps={filteredPublicRoadmaps}
            isLoading={publicLoading}
            isError={publicError}
            errorMessage={
              publicErrorDetail?.response?.message ||
              publicErrorDetail?.message ||
              undefined
            }
            searchTerm={searchTerm}
            onCardClick={handleRoadmapClick}
          />

          <LearningPathsSection
            learningPaths={allLearningPaths}
            filteredLearningPaths={filteredLearningPaths}
            isLoading={isLoading}
            isError={isError}
            errorMessage={error?.response?.message || error?.message || undefined}
            searchTerm={searchTerm}
            onCardClick={handleRoadmapClick}
            onCreateLearningPath={handleCreateLearningPath}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;