import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import { useMyStudyGroups } from '../../hooks/useStudyGroups';
import type { UserStudyGroup } from '../../api/types';

const MyStudyGroups = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useMyStudyGroups();

  const getVisibilityBadge = (_visibility: string) => 'bg-white/5 text-white/70 border-white/10';

  const getRoleBadge = (_role: string) => 'bg-white/5 text-white/70 border-white/10';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleGroupClick = (groupId: number) => {
    navigate(`/study-groups/${groupId}`);
  };

  // Group study groups by learning path
  const groupedByPath = data?.data.reduce((acc, group) => {
    const pathId = group.pathId;
    if (!acc[pathId]) {
      acc[pathId] = {
        pathTitle: group.pathTitle,
        groups: []
      };
    }
    acc[pathId].groups.push(group);
    return acc;
  }, {} as Record<number, { pathTitle: string; groups: UserStudyGroup[] }>);

  return (
    <div className="flex h-screen bg-[#1E1E1E] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              My Study Groups
            </h1>
            <p className="text-gray-400">
              Collaborate and learn together with your peers
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/15 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400">Loading your study groups...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-medium mb-1">Failed to load study groups</p>
              <p className="text-gray-400 text-sm">
                {error?.response?.message || error?.message || 'Please try again later'}
              </p>
            </div>
          )}

          {!isLoading && !isError && data?.data.length === 0 && (
            <div className="bg-[#242424] border border-gray-800 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Study Groups Yet</h3>
              <p className="text-gray-400 mb-6">Join or create a study group to start collaborating</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white/80 font-medium transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:text-white"
              >
                Explore Learning Paths
              </button>
            </div>
          )}

          {!isLoading && !isError && groupedByPath && Object.keys(groupedByPath).length > 0 && (
            <div className="space-y-8">
              {Object.entries(groupedByPath).map(([pathId, pathData]) => (
                <div key={pathId} className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg border border-white/15 bg-white/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{pathData.pathTitle}</h2>
                      <p className="text-gray-400 text-sm">{pathData.groups.length} group{pathData.groups.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pathData.groups.map((group: UserStudyGroup) => (
                      <div
                        key={group.groupId}
                        onClick={() => handleGroupClick(group.groupId)}
                        className="bg-[#242424] border border-gray-800 rounded-xl p-5 transition-all duration-300 cursor-pointer group hover:border-white/20 hover:shadow-lg hover:shadow-black/20"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg border border-white/15 bg-white/10 flex items-center justify-center text-white/80 transition-transform duration-200 group-hover:scale-110">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRoleBadge(group.role)}`}>
                              {group.role}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getVisibilityBadge(group.visibility)}`}>
                            {group.visibility}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 transition-colors duration-200 group-hover:text-white/90">
                          {group.groupName}
                        </h3>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="text-gray-500 text-xs">
                            Joined {formatDate(group.joinedAt)}
                          </div>
                        </div>

                        {group.status === 'active' && (
                          <div className="mt-3 flex items-center gap-2 text-white/70 text-xs">
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                            <span>Active</span>
                          </div>
                        )}

                        <div className="mt-3 flex items-center text-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 group-hover:text-white">
                          <span className="text-sm font-medium">View Group</span>
                          <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
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

export default MyStudyGroups;
