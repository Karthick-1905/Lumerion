import Sidebar from '../../components/ui/Sidebar';
import { useUserProfile } from '../../hooks/useUserProfile';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    <div className="flex h-screen bg-primary overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">My Profile</h1>
            <p className="text-secondary">Manage your personal information and track your learning journey</p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-secondary">Loading your profile...</p>
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
                  <p className="text-primary font-semibold">Unable to load profile</p>
                  <p className="text-secondary text-sm">{error?.message || 'Please try again later.'}</p>
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
              <div className="bg-secondary border border-border rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
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
                      <h2 className="text-2xl font-semibold text-primary">{profile.userName}</h2>
                      {profile.isVerified && (
                        <span className="px-2 py-1 text-xs font-semibold uppercase tracking-wide bg-green-500/20 text-green-300 border border-green-500/40 rounded-lg">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-secondary text-sm">{profile.userEmail}</p>
                    <p className="text-secondary text-xs mt-2">
                      Last updated: <span className="text-primary">{formatDate(profile.updatedAt)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {metrics && (
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-4">Learning Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-secondary border border-border rounded-2xl p-6">
                      <p className="text-secondary text-sm mb-2">Total Learning Paths</p>
                      <p className="text-3xl font-bold text-primary">{metrics.totalLearningPaths}</p>
                      <p className="text-xs text-secondary mt-2">Paths you've started exploring</p>
                    </div>
                    <div className="bg-secondary border border-border rounded-2xl p-6">
                      <p className="text-secondary text-sm mb-2">Total Modules</p>
                      <p className="text-3xl font-bold text-primary">{metrics.totalModules}</p>
                      <p className="text-xs text-secondary mt-2">Modules across all learning paths</p>
                    </div>
                    <div className="bg-secondary border border-border rounded-2xl p-6">
                      <p className="text-secondary text-sm mb-2">Completed Modules</p>
                      <p className="text-3xl font-bold text-primary">{metrics.completedModules}</p>
                      <div className="mt-3 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-accent/80"
                          style={{
                            width:
                              metrics.totalModules > 0
                                ? `${Math.round((metrics.completedModules / metrics.totalModules) * 100)}%`
                                : '0%',
                          }}
                        />
                      </div>
                      <p className="text-xs text-secondary mt-2">
                        {metrics.totalModules > 0
                          ? `${Math.round((metrics.completedModules / metrics.totalModules) * 100)}% complete`
                          : 'Start exploring modules to see progress'}
                      </p>
                    </div>
                  </div>

                  {/* Learning Streaks Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-secondary border border-border rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-secondary text-sm">Current Streak</p>
                          <p className="text-2xl font-bold text-primary">{metrics.currentStreak}</p>
                        </div>
                      </div>
                      <p className="text-xs text-secondary">
                        {metrics.currentStreak === 0
                          ? 'Start learning today to begin your streak!'
                          : metrics.currentStreak === 1
                          ? 'day of consecutive learning'
                          : 'days of consecutive learning'}
                      </p>
                      {metrics.currentStreak > 0 && (
                        <div className="mt-3 flex gap-1">
                          {Array.from({ length: Math.min(metrics.currentStreak, 7) }, (_, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 bg-gradient-to-br from-[#7FDBCA] to-[#00CC99] rounded-full"
                            />
                          ))}
                          {metrics.currentStreak > 7 && (
                            <span className="text-xs text-[#7FDBCA] ml-2">+{metrics.currentStreak - 7} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-secondary border border-border rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-secondary text-sm">Longest Streak</p>
                          <p className="text-2xl font-bold text-primary">{metrics.longestStreak}</p>
                        </div>
                      </div>
                      <p className="text-xs text-secondary">
                        {metrics.longestStreak === 0
                          ? 'Your best learning streak so far'
                          : metrics.longestStreak === 1
                          ? 'day - keep it up!'
                          : 'days - your personal best!'}
                      </p>
                      {metrics.longestStreak > 0 && (
                        <div className="mt-3 flex gap-1">
                          {Array.from({ length: Math.min(metrics.longestStreak, 7) }, (_, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full"
                            />
                          ))}
                          {metrics.longestStreak > 7 && (
                            <span className="text-xs text-[#FFD700] ml-2">+{metrics.longestStreak - 7} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Achievement Badges Section */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-primary mb-4">Achievement Badges</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {metrics.achievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`relative bg-secondary border rounded-2xl p-4 transition-all duration-200 ${
                            achievement.unlocked
                              ? 'border-accent/40 hover:border-accent/60'
                              : 'border-border opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                achievement.unlocked
                                  ? 'bg-gradient-to-br from-accent to-accent/80 text-primary'
                                  : 'bg-secondary text-secondary'
                              }`}
                            >
                              {achievement.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold ${achievement.unlocked ? 'text-primary' : 'text-secondary'}`}>
                                {achievement.name}
                              </h4>
                              <p className={`text-xs ${achievement.unlocked ? 'text-secondary' : 'text-secondary/60'}`}>
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                          {achievement.unlocked && (
                            <div className="absolute top-3 right-3">
                              <div className="w-6 h-6 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {metrics.achievements.length === 0 && (
                      <div className="bg-secondary border border-border rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        </div>
                        <p className="text-secondary mb-2">No achievements yet</p>
                        <p className="text-secondary/60 text-sm">Start learning to unlock your first badge!</p>
                      </div>
                    )}
                  </div>

                  {/* Progress Visualization Section */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-primary mb-4">Learning Progress Over Time</h3>
                    <div className="bg-secondary border border-border rounded-2xl p-6">
                      {metrics.progressData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={metrics.progressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                              dataKey="date"
                              stroke="#9CA3AF"
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#F9FAFB'
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                              formatter={(value: number) => [value, 'Modules Completed']}
                            />
                            <Line
                              type="monotone"
                              dataKey="completedModules"
                              stroke="#7FDBCA"
                              strokeWidth={3}
                              dot={{ fill: '#7FDBCA', strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: '#7FDBCA', strokeWidth: 2, fill: '#1E1E1E' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <p className="text-secondary mb-2">No progress data available</p>
                          <p className="text-secondary/60 text-sm text-center">Complete some modules to see your learning progress over time</p>
                        </div>
                      )}
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
