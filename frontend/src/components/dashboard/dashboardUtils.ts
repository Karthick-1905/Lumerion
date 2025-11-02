export const getDifficultyClasses = (difficulty: string | null | undefined) => {
  const baseClass = 'bg-white/5 text-white/80 border-white/10';
  const normalized = String(difficulty ?? '').toLowerCase();
  switch (normalized) {
    case 'easy':
    case 'medium':
    case 'hard':
    default:
      return baseClass;
  }
};

export const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const getInitials = (name?: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};