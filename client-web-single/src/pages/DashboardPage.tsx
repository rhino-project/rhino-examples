import { useModelIndex, useModelTrashed } from '@rhino-dev/rhino-react';
import { Link } from 'react-router-dom';
import type { Project, Task, Label, User } from '../types';
import { Icon } from '../components/Icons';
import { fmtRelative } from '../lib/format';

export function DashboardPage() {
  const projects  = useModelIndex<Project>('projects',                 { perPage: 100 });
  const tasks     = useModelIndex<Task & { assignee?: User }>('tasks', { perPage: 100, includes: ['assignee'] });
  const labels    = useModelIndex<Label>('labels',                     { perPage: 100 });
  const trashProj = useModelTrashed<Project>('projects');

  const projectList = projects.data?.data ?? [];
  const taskList    = tasks.data?.data    ?? [];
  const labelList   = labels.data?.data   ?? [];
  const trashCount  = trashProj.data?.data?.length ?? 0;

  const activeProjects = projectList.filter(p => p.status === 'active').length;
  const inProgressTasks = taskList.filter(t => t.status === 'in_progress').length;
  const overdueTasks    = taskList.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Overview of your workspace activity</p>
        </div>
      </div>

      <div className="stats">
        <Stat label="Active projects" value={activeProjects} hint={`${projectList.length} total`} />
        <Stat label="In progress"     value={inProgressTasks} hint={`${taskList.length} tasks total`} />
        <Stat label="Overdue"         value={overdueTasks} hint="past due date" />
        <Stat label="Labels"          value={labelList.length} hint="across resources" />
        <Stat label="In trash"        value={trashCount} hint="restorable" />
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent projects</div>
            <Link className="btn btn-ghost btn-sm" to="/projects">View all <Icon.arrowR size={12} /></Link>
          </div>
          {projects.isLoading ? <Loading /> : (
            <table className="table">
              <thead><tr><th>Project</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>
                {projectList.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: 600 }}>{p.title}</Link>
                      <div className="faint" style={{ fontSize: 12 }}>{p.description?.slice(0, 80)}</div>
                    </td>
                    <td><StatusPill value={p.status} /></td>
                    <td className="faint">{fmtRelative(p.updated_at)}</td>
                  </tr>
                ))}
                {projectList.length === 0 && <tr><td colSpan={3} className="card-empty">No projects yet.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Hot tasks</div>
            <Link className="btn btn-ghost btn-sm" to="/tasks">View all <Icon.arrowR size={12} /></Link>
          </div>
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.isLoading ? <Loading /> :
              taskList.filter(t => t.priority === 'critical' || t.priority === 'high').slice(0, 6).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <PriorityPill value={t.priority} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{t.title}</div>
                    <div className="faint" style={{ fontSize: 11 }}>
                      {t.assignee?.name ?? 'unassigned'} · due {fmtRelative(t.due_date)}
                    </div>
                  </div>
                  <StatusPill value={t.status} />
                </div>
              ))}
            {taskList.length === 0 && <div className="card-empty">No tasks.</div>}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  return <span className={`pill pill-${value}`}><span className="pill-dot" />{value.replace('_', ' ')}</span>;
}

export function PriorityPill({ value }: { value: string }) {
  return <span className={`pill pill-${value}`}>{value}</span>;
}

export function Loading() {
  return <div className="loading"><span className="spinner" /> Loading…</div>;
}
