import { useAuth, useModelIndex } from '@rhino-dev/rhino-react';
import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Icon } from './Icons';
import { initials } from '../lib/format';
import type { Project, Task } from '../types';

export function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const orgSlug = (typeof localStorage !== 'undefined' && localStorage.getItem('rhino_organization_slug')) || '';

  // Show counts in the sidebar — lightweight call that the lib caches.
  const projects = useModelIndex<Project>('projects', { perPage: 100 });
  const tasks    = useModelIndex<Task>('tasks',       { perPage: 100 });

  const projectsCount = projects.data?.data?.length || null;
  const tasksCount    = tasks.data?.data?.length    || null;

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div className="brand-name">TaskFlow <span>/web</span></div>
        </div>
        <nav className="nav">
          <div className="nav-section">Workspace</div>
          <Item to="/dashboard"  icon={<Icon.layout />}>Dashboard</Item>
          <Item to="/projects"   icon={<Icon.eye />}    badge={projectsCount}>Projects</Item>
          <Item to="/tasks"      icon={<Icon.task />}   badge={tasksCount}>Tasks</Item>
          <Item to="/labels"     icon={<Icon.tag />}>Labels</Item>

          <div className="nav-section" style={{ marginTop: 10 }}>Admin</div>
          <Item to="/members"    icon={<Icon.users />}>Members</Item>
          <Item to="/trash"      icon={<Icon.trash />}>Trash</Item>
        </nav>
        <div style={{ padding: 14, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--fg-faint)' }}>
          Powered by <span className="accent mono">@rhino-dev/rhino-react</span>
        </div>
      </aside>

      <header className="shell-header">
        <Breadcrumb />
        <div className="header-actions">
          {orgSlug && <span className="header-org-slug">/{orgSlug}</span>}
          <UserChip />
          <button className="btn btn-ghost btn-sm" onClick={logout} title="Sign out">
            <Icon.logout size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="shell-main">{children}</main>
    </div>
  );
}

function Item({ to, icon, badge, children }: { to: string; icon: ReactNode; badge?: number | null; children: ReactNode }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      <span className="icon">{icon}</span>
      <span>{children}</span>
      {badge != null && badge > 0 && <span className="badge">{badge}</span>}
    </NavLink>
  );
}

function Breadcrumb() {
  const loc = useLocation();
  const parts = loc.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return <span className="muted">Dashboard</span>;
  return (
    <div className="row faint">
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span style={{ margin: '0 6px' }}>/</span>}
          <span style={{ color: i === parts.length - 1 ? 'var(--fg)' : undefined, textTransform: 'capitalize' }}>{p}</span>
        </span>
      ))}
    </div>
  );
}

function UserChip() {
  // The current-user name is exposed by the LoginPage stashing it in localStorage.
  const name  = typeof localStorage !== 'undefined' ? localStorage.getItem('rhino_user_name')  ?? 'User' : 'User';
  const email = typeof localStorage !== 'undefined' ? localStorage.getItem('rhino_user_email') ?? '' : '';
  return (
    <div className="user-chip" title={email}>
      <span className="avatar">{initials(name)}</span>
      <span>{name}</span>
    </div>
  );
}
