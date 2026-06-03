// Design tokens — mirror the client-web palette so both apps share an identity.
export const colors = {
  bg0:        '#0a0e14',
  bg1:        '#0f141c',
  bg2:        '#161d28',
  bg3:        '#1d2532',
  border:     '#1f2a3a',
  borderStrong: '#2c3a4e',
  fg:         '#e8edf5',
  fgMuted:    '#93a0b5',
  fgFaint:    '#5d6b82',
  accent:     '#00d9c0',
  accentDim:  '#00a895',
  accentGlow: 'rgba(0, 217, 192, 0.18)',
  warn:       '#ffb547',
  danger:     '#ff6b6b',
  ok:         '#4ade80',
  info:       '#60a5fa',
} as const;

export const radii = { sm: 6, md: 10, lg: 16 } as const;
export const spacing = { 0.5: 4, 1: 8, 1.5: 12, 2: 16, 3: 24, 4: 32, 6: 48 } as const;

// Status / priority pills use a small lookup so the same colour scheme as the
// web app applies to the mobile UI.
export const statusColor: Record<string, { fg: string; bg: string }> = {
  active:      { fg: colors.ok,   bg: 'rgba(74, 222, 128, 0.12)' },
  done:        { fg: colors.info, bg: 'rgba(96, 165, 250, 0.12)' },
  draft:       { fg: colors.fgMuted, bg: colors.bg3 },
  archived:    { fg: colors.fgFaint, bg: colors.bg3 },
  todo:        { fg: colors.fgMuted, bg: colors.bg3 },
  in_progress: { fg: colors.warn, bg: 'rgba(255, 181, 71, 0.12)' },
  blocked:     { fg: colors.danger, bg: 'rgba(255, 107, 107, 0.12)' },
};

export const priorityColor: Record<string, { fg: string; bg: string }> = {
  critical: { fg: colors.danger, bg: 'rgba(255, 107, 107, 0.12)' },
  high:     { fg: colors.warn,   bg: 'rgba(255, 181, 71, 0.15)' },
  medium:   { fg: colors.info,   bg: 'rgba(96, 165, 250, 0.12)' },
  low:      { fg: colors.fgMuted, bg: colors.bg3 },
};
