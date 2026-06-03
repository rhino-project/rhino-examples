import { useMemo, useState } from 'react';
import { useModelIndex, useModelUpdate, useModelDelete } from '@rhino-dev/rhino-react';
import type { Task, User, Project } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import { fmtDate } from '../lib/format';
import { Loading, PriorityPill, StatusPill } from './DashboardPage';

type TaskWithAssignee = Task & { assignee?: User };
const STATUSES: Task['status'][] = ['todo', 'in_progress', 'blocked', 'done'];

export function TasksPage() {
  const toast = useToast();
  const [status, setStatus]     = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch]     = useState('');
  const [view, setView]         = useState<'list' | 'board'>('board');

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (status)   f.status   = status;
    if (priority) f.priority = priority;
    return f;
  }, [status, priority]);

  // Note: Laravel example only whitelists sort by title/status/priority/due_date.
  const tasks    = useModelIndex<TaskWithAssignee>('tasks', { filters, search: search || undefined, includes: ['assignee'], perPage: 200, sort: 'priority' });
  const projects = useModelIndex<Project>('projects', { perPage: 100 });
  const projectById = new Map((projects.data?.data ?? []).map(p => [p.id, p]));

  const update = useModelUpdate<Task>('tasks');
  const del    = useModelDelete<Task>('tasks');

  const list = tasks.data?.data ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-sub">Filter, sort, include relations — <span className="mono accent">useModelIndex('tasks', {`{ filters, includes: ['assignee'] }`})</span></p>
        </div>
        <div className="row">
          <button className={`btn btn-sm ${view === 'board' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('board')}>Board</button>
          <button className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('list')}>List</button>
        </div>
      </div>

      <div className="toolbar">
        <input className="input input-search" style={{ flex: 1, maxWidth: 320 }} placeholder="Search title / description…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input select" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span className="faint" style={{ marginLeft: 'auto', fontSize: 12 }}>{list.length} tasks</span>
      </div>

      {tasks.isLoading ? <Loading /> : view === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`, gap: 14 }}>
          {STATUSES.map(col => {
            const cards = list.filter(t => t.status === col);
            return (
              <div key={col} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <StatusPill value={col} />
                  <span className="faint" style={{ fontSize: 11 }}>{cards.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cards.map(t => (
                    <div key={t.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</div>
                        <PriorityPill value={t.priority} />
                      </div>
                      <div className="faint" style={{ fontSize: 11, marginTop: 6 }}>
                        {projectById.get(t.project_id ?? -1)?.title ?? `project #${t.project_id}`}
                      </div>
                      <div className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                        <span className="faint" style={{ fontSize: 11 }}>{t.assignee?.name ?? '—'}</span>
                        <div className="row gap-2">
                          {col !== 'done' && (
                            <button className="btn btn-ghost btn-icon" title="Mark done" onClick={async () => { await update.mutateAsync({ id: t.id, data: { status: 'done' } }); toast(`Marked "${t.title}" done`, 'ok'); }}>
                              <Icon.check size={12} />
                            </button>
                          )}
                          <button className="btn btn-ghost btn-icon" title="Delete" onClick={async () => { if (confirm(`Delete "${t.title}"?`)) { await del.mutateAsync(t.id); toast('Task moved to trash', 'ok'); } }}>
                            <Icon.trash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && <div className="muted" style={{ fontSize: 12, padding: '10px 4px' }}>Nothing here.</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th><th></th></tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id}>
                  <td><div style={{ fontWeight: 500 }}>{t.title}</div></td>
                  <td className="muted">{projectById.get(t.project_id ?? -1)?.title ?? <span className="faint">#{t.project_id}</span>}</td>
                  <td><StatusPill value={t.status} /></td>
                  <td><PriorityPill value={t.priority} /></td>
                  <td>{t.assignee?.name ?? <span className="faint">—</span>}</td>
                  <td className="faint">{fmtDate(t.due_date)}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon" onClick={async () => { if (confirm(`Delete "${t.title}"?`)) { await del.mutateAsync(t.id); toast('Deleted', 'ok'); } }}>
                      <Icon.trash size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
