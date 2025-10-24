import Sidebar from '../../components/ui/Sidebar';
import { useAcceptFriendRequest, useDeclineFriendRequest, useFriendsList, useFriendRequests, useRemoveFriend, useSendFriendRequest, useUserSearch } from '../../hooks/useFriends';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-primary">{title}</h2>
    {subtitle && <p className="text-secondary text-sm mt-1">{subtitle}</p>}
  </div>
);

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'requests' | 'friends'>('search');
  const [term, setTerm] = useState('');
  const [message, setMessage] = useState('');

  const { data: searchData, isLoading: searching } = useUserSearch(term);
  const { data: friendsData, isLoading: loadingFriends } = useFriendsList();
  const { data: inboundReq } = useFriendRequests('inbound', 'pending');
  const { data: outboundReq } = useFriendRequests('outbound', 'pending');

  // Cache of users we just sent requests to (instant UX feedback)
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());

  const sendReq = useSendFriendRequest();
  const acceptReq = useAcceptFriendRequest();
  const declineReq = useDeclineFriendRequest();
  const removeFriend = useRemoveFriend();

  const outboundSet = useMemo(() => new Set((outboundReq?.data ?? []).map(r => r.user.userId)), [outboundReq]);
  const friendsSet = useMemo(() => new Set((friendsData?.data ?? []).map(f => f.friend.userId)), [friendsData]);

  return (
    <div className="flex h-screen bg-primary overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-primary">Friends</h1>
            <p className="text-secondary text-sm">Search users, manage requests, and your friends list</p>
          </div>

          <div className="flex gap-2 mb-6">
            {(['search','requests','friends'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm border transition-all ${activeTab===tab ? 'bg-accent/20 border-accent/40 text-primary' : 'border-border text-secondary hover:border-accent/50'}`}
              >
                {tab === 'search' ? 'Search' : tab === 'requests' ? 'Requests' : 'Friends'}
              </button>
            ))}
          </div>

          {activeTab === 'search' && (
            <div>
              <SectionTitle title="Find Users" subtitle="Search by name" />
              <div className="flex gap-3 mb-6">
                <input
                  className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent/60"
                  placeholder="Search by name..."
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                />
                <input
                  className="w-72 bg-secondary border border-border rounded-xl px-4 py-3 text-primary focus:outline-none focus:border-accent/60"
                  placeholder="Add a message (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {searching && <p className="text-secondary">Searching...</p>}
              {!searching && searchData?.results && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchData.results.map((u) => {
                    const isFriend = friendsSet.has(u.userId);
                    const isRequested = outboundSet.has(u.userId) || requestedIds.has(u.userId);
                    const disabled = isFriend || isRequested || sendReq.isPending;
                    const label = isFriend ? 'Friends' : isRequested ? 'Request Sent' : (sendReq.isPending ? 'Sending...' : 'Add Friend');
                    return (
                    <div key={u.userId} className="bg-secondary border border-border rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent font-bold">
                          {u.userName?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div>
                          <p className="text-primary text-sm font-medium">{u.userName ?? 'Unknown'}</p>
                          <p className="text-secondary text-xs">ID: {u.userId}</p>
                        </div>
                      </div>
                      <button
                        disabled={disabled}
                        onClick={() => sendReq.mutate(
                          { targetUserId: u.userId, message: message || null },
                          {
                            onSuccess: () => setRequestedIds(prev => new Set(prev).add(u.userId)),
                            onError: (err: any) => toast.error(err?.response?.message || err?.message || 'Failed to send request'),
                          }
                        )}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${disabled ? 'bg-secondary text-secondary border-border cursor-not-allowed' : 'bg-accent/20 text-accent border-accent/40 hover:bg-accent/30'}`}
                      >
                        {label}
                      </button>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <SectionTitle title="Requests Received" />
                <div className="space-y-3">
                  {inboundReq?.data?.map(r => (
                    <div key={r.requestId} className="bg-secondary border border-border rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent font-bold">
                          {r.user.userName?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div>
                          <p className="text-primary text-sm font-medium">{r.user.userName ?? 'Unknown'}</p>
                          <p className="text-secondary text-xs">Message: {r.message ?? '-'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => acceptReq.mutate(r.requestId)} className="px-3 py-2 text-sm rounded-lg bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30">Accept</button>
                        <button onClick={() => declineReq.mutate(r.requestId)} className="px-3 py-2 text-sm rounded-lg bg-red-500/20 text-red-300 border border-red-500/40">Decline</button>
                      </div>
                    </div>
                  ))}
                  {(!inboundReq?.data || inboundReq.data.length===0) && (
                    <p className="text-secondary text-sm">No pending requests.</p>
                  )}
                </div>
              </div>

              <div>
                <SectionTitle title="Requests Sent" />
                <div className="space-y-3">
                  {outboundReq?.data?.map(r => (
                    <div key={r.requestId} className="bg-secondary border border-border rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent font-bold">
                          {r.user.userName?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{r.user.userName ?? 'Unknown'}</p>
                          <p className="text-gray-500 text-xs">Status: {r.status}</p>
                        </div>
                      </div>
                      <span className="text-secondary text-xs">Pending</span>
                    </div>
                  ))}
                  {(!outboundReq?.data || outboundReq.data.length===0) && (
                    <p className="text-secondary text-sm">No sent requests.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div>
              <SectionTitle title="Your Friends" />
              {loadingFriends && <p className="text-secondary">Loading...</p>}
              {!loadingFriends && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendsData?.data?.map(f => (
                    <div key={f.friendshipId} className="bg-secondary border border-border rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent font-bold">
                          {f.friend.userName?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div>
                          <p className="text-primary text-sm font-medium">{f.friend.userName ?? 'Unknown'}</p>
                          <p className="text-secondary text-xs">Connected: {f.connectedAt ? new Date(f.connectedAt).toLocaleDateString() : '-'}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFriend.mutate(f.friend.userId)} className="px-3 py-2 text-sm rounded-lg bg-red-500/20 text-red-300 border border-red-500/40">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FriendsPage;
