// Minimal hand-rolled icon set (16x16) — no external dependency.
type Props = { className?: string; size?: number };
const wrap = (path: React.ReactNode, { className, size = 16 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{path}</svg>
);

export const Icon = {
  layout:   (p: Props = {}) => wrap(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>, p),
  task:     (p: Props = {}) => wrap(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>, p),
  tag:      (p: Props = {}) => wrap(<><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>, p),
  trash:    (p: Props = {}) => wrap(<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>, p),
  users:    (p: Props = {}) => wrap(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>, p),
  history:  (p: Props = {}) => wrap(<><path d="M1 4v6h6M3.51 15A9 9 0 1 0 6 5.3L1 10" /><path d="M12 7v5l4 2" /></>, p),
  plus:     (p: Props = {}) => wrap(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, p),
  close:    (p: Props = {}) => wrap(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, p),
  arrowL:   (p: Props = {}) => wrap(<><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>, p),
  arrowR:   (p: Props = {}) => wrap(<><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>, p),
  restore:  (p: Props = {}) => wrap(<><polyline points="1 4 1 10 7 10" /><path d="M3.51 15A9 9 0 1 0 6 5.3L1 10" /></>, p),
  logout:   (p: Props = {}) => wrap(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>, p),
  lock:     (p: Props = {}) => wrap(<><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, p),
  eye:      (p: Props = {}) => wrap(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>, p),
  edit:     (p: Props = {}) => wrap(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>, p),
  check:    (p: Props = {}) => wrap(<polyline points="20 6 9 17 4 12" />, p),
};
