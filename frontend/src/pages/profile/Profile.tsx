import Sidebar from '../../components/Sidebar';
import { useUserProfile } from '../../hooks/useUserProfile';

const Profile = () => {
  const { data, isLoading, isError, error } = useUserProfile();
  const profile = data?.profile;
  const metrics = data?.metrics;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-screen bg-[#1E1E1E] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-gray-400">Manage your personal information and track your learning journey</p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#7FDBCA] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400">Loading your profile...</p>
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
                  <p className="text-white font-semibold">Unable to load profile</p>
                  <p className="text-gray-400 text-sm">{error?.message || 'Please try again later.'}</p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 hover:bg-red-500/30 transition-all duration-200"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && profile && (
            <div className="space-y-8">
              <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
                <div className="flex items-center gap-4">
                  {profile.avatarPublicUrl ? (
                    <img
                      src={profile.avatarPublicUrl}
                      alt={profile.userName}
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#7FDBCA]/40"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7FDBCA] to-[#00CC99] flex items-center justify-center text-2xl font-semibold text-white">
                      {getInitials(profile.userName)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-semibold text-white">{profile.userName}</h2>
                      {profile.isVerified && (
                        <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide bg-green-500/20 text-green-300 border border-green-500/40 rounded-lg">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">{profile.userEmail}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      Last updated: <span className="text-gray-300">{formatDate(profile.updatedAt)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {metrics && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Learning Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                      <p className="text-gray-400 text-sm mb-2">Total Learning Paths</p>
                      <p className="text-3xl font-bold text-white">{metrics.totalLearningPaths}</p>
                      <p className="text-xs text-gray-500 mt-2">Paths you've started exploring</p>
                    </div>
                    <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                      <p className="text-gray-400 text-sm mb-2">Total Modules</p>
                      <p className="text-3xl font-bold text-white">{metrics.totalModules}</p>
                      <p className="text-xs text-gray-500 mt-2">Modules across all learning paths</p>
                    </div>
                    <div className="bg-[#242424] border border-gray-800 rounded-2xl p-6">
                      <p className="text-gray-400 text-sm mb-2">Completed Modules</p>
                      <p className="text-3xl font-bold text-white">{metrics.completedModules}</p>
                      <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7FDBCA] to-[#00CC99]"
                          style={{
                            width:
                              metrics.totalModules > 0
                                ? `${Math.round((metrics.completedModules / metrics.totalModules) * 100)}%`
                                : '0%',
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {metrics.totalModules > 0
                          ? `${Math.round((metrics.completedModules / metrics.totalModules) * 100)}% complete`
                          : 'Start exploring modules to see progress'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
