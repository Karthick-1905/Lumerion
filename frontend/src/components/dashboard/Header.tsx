import { useEffect, useRef, useState } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import { getInitials } from './dashboardUtils';
import { userApi } from '../../api/user';

type QuickLink = { label: string; path: string };

type DashboardHeaderProps = {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateLearningPath: () => void;
  quickLinks: QuickLink[];
  onQuickLink: (path: string) => void;
};

export default function DashboardHeader({
  userName,
  userEmail,
  avatarUrl,
  searchTerm,
  onSearchChange,
  onCreateLearningPath,
  quickLinks,
  onQuickLink,
}: DashboardHeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const [notificationItems, setNotificationItems] = useState<any[]>([]);
  const [notificationCounts, setNotificationCounts] = useState<{ total: number; friendRequests: number; studyGroupInvitations: number } | null>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [respondingGroups, setRespondingGroups] = useState<number[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileMenuOpen && profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (isNotificationsOpen && notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen, isNotificationsOpen]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoadingNotifications(true);
        setNotificationsError(null);
        const res: any = await userApi.getNotifications();
        setNotificationItems(res?.notifications ?? []);
        setNotificationCounts(res?.counts ?? null);
      } catch (e: any) {
        setNotificationsError('Failed to load notifications');
      } finally {
        setIsLoadingNotifications(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleRespondToStudyGroup = async (groupId: number, decision: 'accept' | 'decline', index: number) => {
    try {
      setRespondingGroups(prev => [...prev, groupId]);
      await userApi.respondToStudyGroupInvitation(groupId, decision);
      setNotificationItems(prev => prev.filter((_, i) => i !== index));
      setNotificationCounts(prev => {
        if (!prev) return prev;
        const next = { ...prev };
        next.total = Math.max(0, next.total - 1);
        next.studyGroupInvitations = Math.max(0, next.studyGroupInvitations - 1);
        return next;
      });
    } catch (e) {
      // Silently fail for now; could add toast if desired
    } finally {
      setRespondingGroups(prev => prev.filter(id => id !== groupId));
    }
  };

  return (
    <header className="px-8 pt-6 pb-4 border-b border-primary bg-primary/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}.
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search roadmaps and learning paths..."
              value={searchTerm}
              onChange={event => onSearchChange(event.target.value)}
              className="input-field w-64 pl-10 text-secondary placeholder-muted"
            />
            <svg className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            type="button"
            onClick={onCreateLearningPath}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-[#4CAF50] to-[#2E7D32] text-sm font-semibold text-white shadow-lg shadow-[#4CAF50]/25 hover:shadow-xl hover:shadow-[#4CAF50]/35 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Learning Path
          </button>

          <ThemeToggle />

          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(prev => !prev)}
              className="w-11 h-11 rounded-full border border-primary bg-secondary flex items-center justify-center text-tertiary hover:text-[#4CAF50] hover:border-[#4CAF50] transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M10 20a2 2 0 104 0h-4z" />
                <path d="M18 8a6 6 0 10-12 0c0 5.5-2.4 7.5-2.4 7.5-.3.3-.1.8.3.8H20.1c.4 0 .6-.5.3-.8C20.4 15.5 18 13.5 18 8z" />
              </svg>
              {notificationCounts?.total ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#4CAF50] text-[10px] font-bold text-white flex items-center justify-center">
                  {notificationCounts.total}
                </span>
              ) : null}
            </button>

            {isNotificationsOpen && (
              <div className="dropdown-menu absolute right-0 mt-3 w-72 bg-secondary border border-primary rounded-2xl shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary">Notifications</h3>
                  {notificationCounts ? (
                    <span className="text-xs text-muted">Total: {notificationCounts.total}</span>
                  ) : null}
                </div>
                {isLoadingNotifications ? (
                  <p className="text-tertiary text-sm">Loading...</p>
                ) : notificationsError ? (
                  <p className="text-red-400 text-sm">{notificationsError}</p>
                ) : notificationItems.length === 0 ? (
                  <p className="text-tertiary text-sm">No notifications.</p>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-y-auto">
                    {notificationItems.map((n, idx) => (
                      <li key={idx} className="p-2 rounded-xl hover:bg-hover">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-xs text-primary">
                            {(n?.type ?? 'sys').toString().slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-primary truncate">
                              {n?.type === 'study_group_invitation'
                                ? `${n?.inviter?.userName ?? 'Someone'} invited you to join ${n?.group?.groupName ?? 'a group'}`
                                : n?.message ?? 'Notification'}
                            </p>
                            <p className="text-xs text-muted truncate">
                              {n?.createdAt}
                            </p>
                            {n?.type === 'study_group_invitation' && n?.group?.groupId ? (
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  className="px-3 py-1 text-xs rounded-lg bg-[#2E7D32] text-white disabled:opacity-60"
                                  disabled={respondingGroups.includes(n.group.groupId)}
                                  onClick={() => handleRespondToStudyGroup(Number(n.group.groupId), 'accept', idx)}
                                >
                                  {respondingGroups.includes(n.group.groupId) ? 'Accepting...' : 'Accept'}
                                </button>
                                <button
                                  className="px-3 py-1 text-xs rounded-lg border border-primary text-tertiary hover:text-primary disabled:opacity-60"
                                  disabled={respondingGroups.includes(n.group.groupId)}
                                  onClick={() => handleRespondToStudyGroup(Number(n.group.groupId), 'decline', idx)}
                                >
                                  {respondingGroups.includes(n.group.groupId) ? 'Declining...' : 'Decline'}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-2 py-1 rounded-2xl border border-primary bg-secondary hover:border-[#4CAF50] transition-all duration-200"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#1B5E20] to-[#2E7D32] flex items-center justify-center text-sm font-semibold text-[#E8F5E9]">
                  {getInitials(userName)}
                </div>
              )}
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold text-primary leading-tight">
                  {userName ?? 'Your Name'}
                </span>
                <span className="text-xs text-muted">View shortcuts</span>
              </div>
              <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isProfileMenuOpen && (
              <div className="dropdown-menu absolute right-0 mt-3 w-72 bg-secondary border border-primary rounded-2xl shadow-xl overflow-hidden">
                <div className="px-5 py-4 bg-tertiary border-b border-primary">
                  <p className="text-sm font-semibold text-primary">{userName ?? 'Your Name'}</p>
                  <p className="text-xs text-tertiary truncate">{userEmail ?? 'your.email@example.com'}</p>
                </div>
                <div className="p-3 space-y-2">
                  <span className="text-xs uppercase text-muted font-semibold">Quick Access</span>
                  <div className="space-y-1">
                    {quickLinks.map(link => (
                      <button
                        key={link.path}
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onQuickLink(link.path);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 rounded-xl text-tertiary hover:bg-hover hover:text-primary transition-colors"
                      >
                        <span>{link.label}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
  );
}