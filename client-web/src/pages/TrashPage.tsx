import { useState } from 'react';
import { useModelTrashed, useModelRestore, useModelForceDelete } from '@rhino-dev/rhino-react';
import type { Project, Task, Label } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import { fmtRelative } from '../lib/format';
import { Loading } from './DashboardPage';

const TABS = [
  { slug: 'projects', label: 'Projects' },
  { slug: 'tasks',    label: 'Tasks' },
  { slug: 'labels',   label: 'Labels' },
] as const;

type Slug = (typeof TABS)[number]['slug'];

export function TrashPage() {
  const [active, setActive] = useState<Slug>('projects');
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Trash</h1>
          <p className="page-sub">Soft-deleted records — <span className="mono accent">useModelTrashed</span> · <span className="mono accent">useModelRestore</span> · <span className="mono accent">useModelForceDelete</span></p>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 14, gap: 6 }}>
        {TABS.map(t => (
          <button key={t.slug} className={`btn btn-sm ${active === t.slug ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActive(t.slug)}>{t.label}</button>
        ))}
      </div>
      {active === 'projects' && <TrashList<Project> slug="projects" cols={['title', 'status']} />}
      {/* Tasks and labels are addressed by their Route Key (hash_id / slug), not the numeric id */}
      {active === 'tasks'    && <TrashList<Task>    slug="tasks"    cols={['title', 'status', 'priority']} idOf={t => t.hash_id!} />}
      {active === 'labels'   && <TrashList<Label>   slug="labels"   cols={['name', 'color']} idOf={l => l.slug!} />}
    </>
  );
}

function TrashList<T extends { id: number; deleted_at?: string | null }>({ slug, cols, idOf }: { slug: Slug; cols: (keyof T)[]; idOf?: (item: T) => string | number }) {
  const identifier = idOf ?? ((item: T) => item.id);
  const toast   = useToast();
  const trashed = useModelTrashed<T>(slug);
  const restore = useModelRestore<T>(slug);
  const fdel    = useModelForceDelete<T>(slug);
  const list    = trashed.data?.data ?? [];

  if (trashed.isLoading) return <Loading />;
  if (list.length === 0) return <div className="empty"><h3>Trash is empty</h3><p>Soft-deleted {slug} will appear here for restore.</p></div>;

  return (
    <div className="card">
      <table className="table">
        <thead><tr>{cols.map(c => <th key={String(c)}>{String(c)}</th>)}<th>Deleted</th><th></th></tr></thead>
        <tbody>
          {list.map(item => (
            <tr key={item.id} className="deleted">
              {cols.map(c => <td key={String(c)}>{String((item as any)[c] ?? '—')}</td>)}
              <td className="faint">{fmtRelative(item.deleted_at)}</td>
              <td>
                <div className="row gap-2" style={{ justifyContent: 'end' }}>
                  <button className="btn btn-sm" onClick={async () => { await restore.mutateAsync(identifier(item)); toast('Restored', 'ok'); }}>
                    <Icon.restore size={12} /> Restore
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={async () => { if (confirm('Permanently delete? This cannot be undone.')) { await fdel.mutateAsync(identifier(item)); toast('Permanently deleted', 'ok'); } }}>
                    <Icon.trash size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
