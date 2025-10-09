import { useEffect, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { useLearningPaths } from "../../hooks/useLearningPath";
import { usePublicRoadmaps } from "../../hooks/useRoadmaps";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useLocation, useNavigate } from "react-router-dom";
import type { LearningPath, PublicRoadmap } from "../../api/types";

const Dashboard = () => {
  const { data, isLoading, isError, error } = useLearningPaths();
  const { data: publicRoadmapsData, isLoading: publicLoading, isError: publicError } = usePublicRoadmaps();
  const { data: userData } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        isNotificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, isNotificationsOpen]);

  const handleCardClick = (pathId: number) => {
    navigate(`/learning-path/${pathId}`);
  };

  const handlePublicRoadmapClick = (pathId: number) => {
    navigate(`/learning-path/${pathId}`);
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const profile = userData?.profile;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  const quickAccessLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Learning Paths', path: '/dashboard#my-learning-paths' },
    { label: 'Study Groups', path: '/study-groups' },
    { label: 'Profile', path: '/profile' },
  ];

  const handleQuickLink = (path: string) => {
    setIsProfileMenuOpen(false);
    if (path.includes('#')) {
      const [basePath, hash] = path.split('#');
      if (location.pathname !== basePath) {
        navigate(basePath);
        setTimeout(() => {
          if (hash) {
            const el = document.getElementById(hash);
            el?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else if (hash) {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    navigate(path);
  };

  const handleCreateLearningPath = () => {
    navigate('/learning-paths/create');
  };

  return (
    <div className="flex h-screen bg-[#1E1E1E] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <header className="px-8 pt-6 pb-4 border-b border-gray-800 bg-[#1E1E1E]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Welcome back{profile?.userName ? `, ${profile.userName.split(' ')[0]}` : ''}.</h1>
              <p className="text-gray-400 text-sm">Track your progress, explore new paths, and keep learning.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCreateLearningPath}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] text-sm font-semibold text-[#0B1F1A] shadow-lg shadow-[#7FDBCA]/20 hover:shadow-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Learning Path
              </button>

              <div ref={notificationsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(prev => !prev)}
                  className="w-11 h-11 rounded-xl border border-gray-800 bg-[#242424] flex items-center justify-center text-gray-300 hover:text-white hover:border-[#7FDBCA]/40 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.977M13 21a2 2 0 01-4 0" />
                  </svg>
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-[#242424] border border-gray-800 rounded-2xl shadow-xl shadow-black/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                      <span className="text-xs text-gray-500">Coming soon</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      You'll see roadmap updates, study group invites, and more here once notifications are enabled.
                    </p>
                  </div>
                )}
              </div>

              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 px-2 py-1 rounded-2xl border border-gray-800 bg-[#242424] hover:border-[#7FDBCA]/40 transition-all duration-200"
                >
                  {profile?.avatarPublicUrl ? (
                    <img
                      src={profile.avatarPublicUrl}
                      alt={profile.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7FDBCA] to-[#00CC99] flex items-center justify-center text-sm font-semibold text-[#0B1F1A]">
                      {getInitials(profile?.userName)}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-white leading-tight">
                      {profile?.userName ?? 'Your Name'}
                    </span>
                    <span className="text-xs text-gray-500">View shortcuts</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-[#242424] border border-gray-800 rounded-2xl shadow-xl shadow-black/40 overflow-hidden">
                    <div className="px-5 py-4 bg-[#2C2C2C] border-b border-gray-800">
                      <p className="text-sm font-semibold text-white">
                        {profile?.userName ?? 'Your Name'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{profile?.userEmail ?? 'your.email@example.com'}</p>
                    </div>
                    <div className="p-3 space-y-2">
                      <span className="text-xs uppercase text-gray-500 font-semibold">Quick Access</span>
                      <div className="space-y-1">
                        {quickAccessLinks.map(link => (
                          <button
                            key={link.path}
                            type="button"
                            onClick={() => handleQuickLink(link.path)}
                            className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-[#7FDBCA]/10 hover:text-white transition-colors"
                          >
                            <span>{link.label}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="md:hidden mb-6">
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
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">
              Explore Public Roadmaps
            </h2>
            <p className="text-gray-400 mb-6">
              Discover and join community-created learning paths
            </p>

            {publicLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-[#7FDBCA] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 text-sm">Loading roadmaps...</p>
                </div>
              </div>
            )}

            {publicError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm">Failed to load public roadmaps</p>
              </div>
            )}

            {!publicLoading && !publicError && publicRoadmapsData?.data && publicRoadmapsData.data.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicRoadmapsData.data.map((roadmap: PublicRoadmap) => (
                  <div
                    key={roadmap.pathId}
                    onClick={() => handlePublicRoadmapClick(roadmap.pathId)}
                    className="bg-[#242424] border border-gray-800 rounded-2xl p-6 hover:border-[#7FDBCA] hover:shadow-xl hover:shadow-[#7FDBCA]/10 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#7FDBCA]/10 to-transparent rounded-bl-full"></div>
                    
                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7FDBCA] to-[#00CC99] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(roadmap.difficulty)}`}>
                        {roadmap.difficulty}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#7FDBCA] transition-colors duration-200">
                      {roadmap.topic}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {roadmap.title}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {roadmap.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {roadmap.tags.length > 2 && (
                        <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg border border-gray-700">
                          +{roadmap.tags.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex items-center gap-3 text-gray-400 text-xs">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{roadmap.moduleCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{roadmap.studyGroupCount}</span>
                        </div>
                      </div>
                      <div className="text-gray-500 text-xs">
                        by {roadmap.owner.userName}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center text-[#7FDBCA] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-sm font-medium">Explore Roadmap</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!publicLoading && !publicError && publicRoadmapsData?.data && publicRoadmapsData.data.length === 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 text-center">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400 text-sm">No public roadmaps available</p>
              </div>
            )}
          </div>

          <div id="my-learning-paths" className="mb-8 pt-8 border-t border-gray-800">
            <h1 className="text-4xl font-bold text-white mb-2">
              My Learning Paths
            </h1>
            <p className="text-gray-400">
              Continue your learning journey
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#7FDBCA] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400">Loading your learning paths...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-medium mb-1">Failed to load learning paths</p>
              <p className="text-gray-400 text-sm">
                {error?.response?.message || error?.message || 'Please try again later'}
              </p>
            </div>
          )}

          {!isLoading && !isError && data?.learningPaths.length === 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Learning Paths Yet</h3>
              <p className="text-gray-400 mb-6">Start your learning journey by creating your first path</p>
              <button
                onClick={handleCreateLearningPath}
                className="px-6 py-3 bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#7FDBCA]/20 transition-all duration-200"
              >
                Create Learning Path
              </button>
            </div>
          )}

          {!isLoading && !isError && data?.learningPaths && data.learningPaths.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.learningPaths.map((path: LearningPath) => (
                <div
                  key={path.pathId}
                  onClick={() => handleCardClick(path.pathId)}
                  className="bg-[#242424] border border-gray-800 rounded-2xl p-6 hover:border-[#7FDBCA] hover:shadow-xl hover:shadow-[#7FDBCA]/10 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#7FDBCA] to-[#00CC99] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(path.difficulty)}`}>
                      {path.difficulty}
                    </span>
                  </div>

                  {/* Card Content */}
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#7FDBCA] transition-colors duration-200">
                    {path.query}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {path.goal}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {path.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {path.tags.length > 3 && (
                      <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg border border-gray-700">
                        +{path.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{path.moduleCount} modules</span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {formatDate(path.createdAt)}
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="mt-4 flex items-center text-[#7FDBCA] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-sm font-medium">View Details</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;