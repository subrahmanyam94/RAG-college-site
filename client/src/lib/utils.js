/**
 * Returns stylish Tailwind color classes based on institutional category (Desert Yellow & Orange theme)
 */
export const getCategoryBadgeStyle = (category) => {
  switch (category) {
    case 'Admissions':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'Fees':
      return 'bg-orange-50 text-orange-800 border-orange-300';
    case 'Exams':
      return 'bg-yellow-50 text-yellow-800 border-yellow-300';
    case 'Academic Calendar':
      return 'bg-amber-100/60 text-amber-900 border-amber-300';
    case 'Hostel':
      return 'bg-orange-100/70 text-orange-900 border-orange-300';
    case 'Library':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'Clubs':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Placements':
      return 'bg-amber-100 text-amber-900 border-amber-400 font-semibold';
    case 'Scholarships':
      return 'bg-yellow-50 text-yellow-900 border-yellow-400';
    case 'Policies':
      return 'bg-rose-50 text-rose-800 border-rose-300';
    case 'Events':
      return 'bg-orange-100/50 text-orange-800 border-orange-300';
    case 'Courses':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-300';
  }
};

/**
 * Returns formatted match percentage
 */
export const formatSimilarity = (score) => {
  if (typeof score !== 'number') return 'Verified Source';
  const pct = Math.round(score * 100);
  return `${pct}% Match`;
};

/**
 * Format date string
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format relative time (e.g. 5m ago, 2h ago)
 */
export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};
