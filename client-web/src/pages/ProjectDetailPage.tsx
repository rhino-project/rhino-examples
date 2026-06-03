import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useModelShow, useModelIndex, useModelAudit, useModelUpdate, useModelDelete } from '@rhino-dev/rhino-react';
import type { Project, Task, User } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import { fmtCurrency, fmtDate, fmtRelative } from '../lib/format';
import { Loading, StatusPill, PriorityPill } from './DashboardPage';

type TaskWithAssignee = Task & { assignee?: User };

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const toast = useToast();
  const project = useModelShow<Project>('projects', id);
  // The Laravel example doesn't whitelist filter[project_id] on tasks, so we
  // fetch all and filter client-side. (In a real app you'd add it to the
  // model's $allowedFilters.)
  const tasks  = useModelIndex<TaskWithAssignee>('tasks', { includes: ['assignee'], perPage: 200 });
  const audit  = useModelAudit('projects', id ?? null);
  const update = useModelUpdate<Project>('projects');
  const del    = useModelDelete<Project>('projects');

  const [tab, setTab] = useState<'tasks' | 'audit'>('tasks');
  const [editing, setEditing] = useState(false);
  const taskList  = (tasks.data?.data ?? []).filter(t => String(t.project_id) === String(id));
  const auditList = audit.data?.data ?? [];

  if (project.isLoading) return <Loading />;
  const p = project.data;
  if (project.error || !p) return <div className="empty"><h3>Not found</h3><p>This project may have been deleted.</p></div>;
  const canSeeBudget = 'budget' in p && p.budget != null;
  const canSeeNotes  = 'internal_notes' in p && p.internal_notes != null;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="row" style={{ marginBottom: 4 }}>
            <Link to="/projects" className="btn btn-ghost btn-sm"><Icon.arrowL size={12} /> Back</Link>
            <StatusPill value={p.status} />
          </div>
          <h1 className="page-title">{p.title}</h1>
          <p className="page-sub">{p.description ?? <span className="faint">No description</span>}</p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setEditing(true)}><Icon.edit size={14} /> Edit</button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              if (!confirm(`Delete project "${p.title}"?`)) return;
              await del.mutateAsync(p.id);
              toast('Project moved to trash', 'ok');
              nav('/projects');
            }}
          ><Icon.trash size={14} /> Delete</button>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="row" style={{ marginBottom: 14, gap: 6 }}>
            <TabBtn active={tab === 'tasks'} onClick={() => setTab('tasks')}>Tasks ({taskList.length})</TabBtn>
            <TabBtn active={tab === 'audit'} onClick={() => setTab('audit')}><Icon.history size={12} /> Audit trail</TabBtn>
          </div>

          {tab === 'tasks' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Tasks in this project</div>
                <span className="faint mono" style={{ fontSize: 11 }}>?include=assignee</span>
              </div>
              {tasks.isLoading ? <Loading /> : taskList.length === 0 ? (
                <div className="card-empty">No tasks yet.</div>
              ) : (
                <table className="table">
                  <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th></tr></thead>
                  <tbody>
                    {taskList.map(t => (
                      <tr key={t.id}>
                        <td><div style={{ fontWeight: 500 }}>{t.title}</div><div className="faint" style={{ fontSize: 11 }}>{t.description?.slice(0, 80)}</div></td>
                        <td><StatusPill value={t.status} /></td>
                        <td><PriorityPill value={t.priority} /></td>
                        <td>{t.assignee?.name ?? <span className="faint">unassigned</span>}</td>
                        <td className="faint">{fmtDate(t.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'audit' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Audit history</div>
                <span className="faint mono" style={{ fontSize: 11 }}>useModelAudit('projects', id)</span>
              </div>
              <div style={{ padding: 18 }}>
                {audit.isLoading ? <Loading /> : auditList.length === 0 ? (
                  <div className="muted">No audit entries yet — try editing the project to generate one.</div>
                ) : (
                  <div className="timeline">
                    {auditList.map(entry => (
                      <div key={entry.id} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div><b>{entry.action}</b> by user #{entry.user_id}</div>
                          <div className="timeline-meta">{fmtRelative(entry.created_at)} · <span className="mono">{JSON.stringify(entry.new_values ?? entry.old_values ?? {}).slice(0, 100)}…</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <aside>
          <div className="card">
            <div className="card-header"><div className="card-title">Project details</div></div>
            <div className="card-body">
              <dl className="kv">
                <dt>ID</dt><dd className="mono">{p.id}</dd>
                <dt>Org</dt><dd className="mono">#{p.organization_id}</dd>
                <dt>Status</dt><dd><StatusPill value={p.status} /></dd>
                <dt>Budget</dt><dd>{canSeeBudget ? fmtCurrency(p.budget) : <span className="rbac-hidden">— hidden by role policy</span>}</dd>
                <dt>Starts</dt><dd className="muted">{fmtDate(p.starts_at)}</dd>
                <dt>Ends</dt><dd className="muted">{fmtDate(p.ends_at)}</dd>
                <dt>Created</dt><dd className="muted">{fmtDate(p.created_at)}</dd>
                <dt>Updated</dt><dd className="muted">{fmtRelative(p.updated_at)}</dd>
              </dl>
            </div>
          </div>
          {canSeeNotes && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-header"><div className="card-title">Internal notes</div><span className="role-chip role-admin">admin only</span></div>
              <div className="card-body" style={{ whiteSpace: 'pre-wrap' }}>{p.internal_notes}</div>
            </div>
          )}
        </aside>
      </div>

      {editing && (
        <EditProjectModal
          project={p}
          busy={update.isPending}
          onClose={() => setEditing(false)}
          onSave={async data => {
            try {
              await update.mutateAsync({ id: p.id, data });
              toast('Project updated', 'ok');
              setEditing(false);
            } catch (err) {
              toast(`Update failed: ${(err as Error).message}`, 'error');
            }
          }}
        />
      )}
    </>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={`btn ${active ? 'btn-primary' : 'btn-ghost'}`} onClick={onClick}>{children}</button>;
}

function EditProjectModal({ project, onClose, onSave, busy }: { project: Project; onClose: () => void; onSave: (data: Partial<Project>) => Promise<void>; busy: boolean }) {
  const [title,  setTitle]  = useState(project.title);
  const [status, setStatus] = useState(project.status);
  const [desc,   setDesc]   = useState(project.description ?? '');
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Edit project</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon.close /></button>
        </div>
        <div className="modal-body">
          <form className="form" onSubmit={e => { e.preventDefault(); onSave({ title, status, description: desc }); }}>
            <div className="field"><label>Title</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} required /></div>
            <div className="field"><label>Status</label>
              <select className="input select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="done">Done</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="field"><label>Description</label><textarea className="input" rows={3} value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div className="modal-foot" style={{ padding: 0, border: 0 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <Icon.check size={14} />} Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
