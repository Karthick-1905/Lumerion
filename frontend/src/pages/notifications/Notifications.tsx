import { toast } from 'react-toastify';
import Sidebar from '../../components/ui/Sidebar';
import { useNotifications } from '../../hooks/useNotifications';
import { useAcceptFriendRequest, useDeclineFriendRequest } from '../../hooks/useFriends';
import { useRespondToStudyGroupInvitation } from '../../hooks/useStudyGroups';
import type { NotificationItem } from '../../api/types';

const Notifications = () => {
  const { data, isLoading, isError, error } = useNotifications();
  const { mutate: acceptFriendRequest } = useAcceptFriendRequest();
  const { mutate: declineFriendRequest } = useDeclineFriendRequest();

  const notifications = data?.notifications ?? [];
  const counts = data?.counts ?? { total: 0, friendRequests: 0, studyGroupInvitations: 0 };

  const handleAcceptFriendRequest = (requestId: number) => {
    acceptFriendRequest(requestId, {
      onSuccess: () => {
        toast.success('Friend request accepted!');
      },
      onError: (error: any) => {
        const message = error?.response?.message || error?.message || 'Failed to accept friend request';
        toast.error(message);
      },
    });
  };

  const handleDeclineFriendRequest = (requestId: number) => {
    declineFriendRequest(requestId, {
      onSuccess: () => {
        toast.success('Friend request declined');
      },
      onError: (error: any) => {
        const message = error?.response?.message || error?.message || 'Failed to decline friend request';
        toast.error(message);
      },
    });
  };

  const handleAcceptStudyGroupInvitation = (groupId: number) => {
    // Use the hook for responding to study group invitations
    const { mutate: respondToInvitation } = useRespondToStudyGroupInvitation(groupId);
    
    respondToInvitation('accept', {
      onSuccess: () => {
        toast.success('Study group invitation accepted!');
      },
      onError: (error: any) => {
        const message = error?.response?.message || error?.message || 'Failed to accept study group invitation';
        toast.error(message);
      },
    });
  };

  const handleDeclineStudyGroupInvitation = (groupId: number) => {
    // Use the hook for responding to study group invitations
    const { mutate: respondToInvitation } = useRespondToStudyGroupInvitation(groupId);
    
    respondToInvitation('decline', {
      onSuccess: () => {
        toast.success('Study group invitation declined');
      },
      onError: (error: any) => {
        const message = error?.response?.message || error?.message || 'Failed to decline study group invitation';
        toast.error(message);
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderNotification = (notification: NotificationItem) => {
    const isFriendRequest = notification.type === 'friend_request';

    return (
      <div
        key={`${notification.type}-${notification.requestId || notification.invitationId}`}
        className="bg-secondary border border-border rounded-2xl p-6 hover:border-accent/40 transition-all duration-200"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
            {isFriendRequest ? (
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  {isFriendRequest ? 'Friend Request' : 'Study Group Invitation'}
                </h3>
                <p className="text-secondary text-sm">
                  from <span className="text-accent font-medium">{notification.sender.userName}</span>
                </p>
              </div>
              <span className="text-secondary text-xs flex-shrink-0">
                {formatDate(notification.createdAt)}
              </span>
            </div>

            {notification.message && (
              <p className="text-primary text-sm mb-4 leading-relaxed">
                {notification.message}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() =>
                  isFriendRequest
                    ? handleAcceptFriendRequest(notification.requestId!)
                    : handleAcceptStudyGroupInvitation((notification as any).group?.groupId)
                }
                className="px-4 py-2 bg-accent text-primary text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-accent/20 transition-all duration-200"
              >
                Accept
              </button>
              <button
                onClick={() =>
                  isFriendRequest
                    ? handleDeclineFriendRequest(notification.requestId!)
                    : handleDeclineStudyGroupInvitation((notification as any).group?.groupId)
                }
                className="px-4 py-2 bg-secondary text-primary text-sm font-medium rounded-xl hover:bg-secondary/80 transition-all duration-200"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-primary overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Notifications</h1>
            <p className="text-secondary">Stay updated with friend requests and study group invitations</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-secondary border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-secondary text-sm">Friend Requests</p>
                  <p className="text-2xl font-bold text-primary">{counts.friendRequests}</p>
                </div>
              </div>
            </div>

            <div className="bg-secondary border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-secondary text-sm">Study Group Invites</p>
                  <p className="text-2xl font-bold text-primary">{counts.studyGroupInvitations}</p>
                </div>
              </div>
            </div>

            <div className="bg-secondary border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.977M13 21a2 2 0 01-4 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-secondary text-sm">Total Notifications</p>
                  <p className="text-2xl font-bold text-primary">{counts.total}</p>
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-secondary">Loading notifications...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 font-medium mb-1">Failed to load notifications</p>
              <p className="text-secondary text-sm">
                {error?.message || 'Please try again later'}
              </p>
            </div>
          )}

          {!isLoading && !isError && notifications.length === 0 && (
            <div className="bg-secondary/50 border border-border rounded-xl p-12 text-center">
              <svg className="w-16 h-16 text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.977M13 21a2 2 0 01-4 0" />
              </svg>
              <h3 className="text-xl font-semibold text-primary mb-2">No notifications yet</h3>
              <p className="text-secondary mb-6">When you receive friend requests or study group invitations, they'll appear here.</p>
            </div>
          )}

          {!isLoading && !isError && notifications.length > 0 && (
            <div className="space-y-4">
              {notifications.map(renderNotification)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;