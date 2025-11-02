import { useEffect, useRef, useState } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import { getInitials } from './dashboardUtils';

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
              className="w-11 h-11 rounded-xl border border-primary bg-secondary flex items-center justify-center text-tertiary hover:text-[#4CAF50] hover:border-[#4CAF50] transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-4.977M13 21a2 2 0 01-4 0" />
              </svg>
            </button>
            {isNotificationsOpen && (
              <div className="dropdown-menu absolute right-0 mt-3 w-72 bg-secondary border border-primary rounded-2xl shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary">Notifications</h3>
                  <span className="text-xs text-muted">Coming soon</span>
                </div>
                <p className="text-tertiary text-sm">
                  You'll see roadmap updates, study group invites, and more here once notifications are enabled.
                </p>
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