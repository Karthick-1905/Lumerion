import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useStudyGroupsByPath } from '../../hooks/useStudyGroups';
import type { StudyGroupSummary } from '../../api/types';

const StudyGroupsList = () => {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useStudyGroupsByPath(Number(pathId));

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'private':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'restricted':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
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

  const handleGroupClick = (groupId: number) => {
    navigate(`/study-groups/${groupId}`);
  };

  return (
    <div className="flex h-screen bg-[#1E1E1E] overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Study Groups
            </h1>
            <p className="text-gray-400">
              Join or create study groups for this learning path
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#7FDBCA] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400">Loading study groups...</p>
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
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Study Groups Yet</h3>
              <p className="text-gray-400 mb-6">Be the first to create a study group for this learning path</p>
              <button className="px-6 py-3 bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#7FDBCA]/20 transition-all duration-200">
                Create Study Group
              </button>
            </div>
          )}

          {!isLoading && !isError && data?.data && data.data.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="text-gray-400">
                  <span className="font-medium text-white">{data.pagination.total}</span> study group{data.pagination.total !== 1 ? 's' : ''} found
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-[#7FDBCA]/20 transition-all duration-200 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Study Group
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.data.map((group: StudyGroupSummary) => (
                  <div
                    key={group.groupId}
                    onClick={() => handleGroupClick(group.groupId)}
                    className="bg-[#242424] border border-gray-800 rounded-2xl p-6 hover:border-[#7FDBCA] hover:shadow-xl hover:shadow-[#7FDBCA]/10 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7FDBCA] to-[#00CC99] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getVisibilityBadge(group.visibility)}`}>
                        {group.visibility}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#7FDBCA] transition-colors duration-200">
                      {group.groupName}
                    </h3>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {formatDate(group.createdAt)}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center text-[#7FDBCA] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-sm font-medium">View Details</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudyGroupsList;
