import Sidebar from '../../components/ui/Sidebar';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import type { ActivityItem, ApiError } from '../../api/types';

const ActivityFeed = () => {
  const { data: activityData, isLoading, isError, error } = useActivityFeed();

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return activityDate.toLocaleDateString();
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'skill_assessment_completed':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'learning_path_created':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        );
      case 'study_group_joined':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'module_completed':
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
    }
  };

  const getActivityMessage = (activity: ActivityItem) => {
    const userName = activity.user.name;

    switch (activity.type) {
      case 'skill_assessment_completed':
        const metadata = activity.metadata;
        if (metadata && typeof metadata === 'object' && 'skillLevel' in metadata && 'topic' in metadata) {
          return `${userName} completed a ${metadata.skillLevel} level assessment in ${metadata.topic}`;
        }
        return `${userName} completed a skill assessment`;

      case 'learning_path_created':
        return `${userName} created a new learning path`;

      case 'study_group_joined':
        return `${userName} joined a study group`;

      case 'module_completed':
        return `${userName} completed a learning module`;

      default:
        return `${userName} performed an activity`;
    }
  };

  return (
    <div className="flex h-screen bg-primary overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <header className="px-8 pt-6 pb-4 border-b border-border bg-primary/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Activity Feed</h1>
              <p className="text-secondary text-sm">See what your friends and study groups are up to</p>
            </div>
          </div>
        </header>

        <div className="p-8">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-secondary">Loading activity feed...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-medium mb-1">Failed to load activity feed</p>
              <p className="text-secondary text-sm">
                {(error as ApiError)?.response?.message || error?.message || 'Please try again later'}
              </p>
            </div>
          )}

          {!isLoading && !isError && activityData?.activities && activityData.activities.length === 0 && (
            <div className="bg-secondary/50 border border-border rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-xl font-semibold text-primary mb-2">No Activity Yet</h3>
              <p className="text-secondary mb-6">Activities from your friends and study groups will appear here</p>
            </div>
          )}

          {!isLoading && !isError && activityData?.activities && activityData.activities.length > 0 && (
            <div className="space-y-4">
              {activityData.activities.map((activity: ActivityItem) => (
                <div
                  key={activity.id}
                  className="bg-secondary border border-border rounded-2xl p-6 hover:border-accent/30 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    {getActivityIcon(activity.type)}

                    <div className="flex-1 min-w-0">
                      <p className="text-primary text-sm leading-relaxed">
                        {getActivityMessage(activity)}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-2">
                          {activity.user.avatar ? (
                            <img
                              src={activity.user.avatar}
                              alt={activity.user.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                              {activity.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-secondary text-xs font-medium">
                            {activity.user.name}
                          </span>
                        </div>

                        <span className="text-secondary text-xs">
                          {formatTimeAgo(activity.createdAt)}
                        </span>
                      </div>
                    </div>
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

export default ActivityFeed;