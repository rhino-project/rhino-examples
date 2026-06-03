import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useModelIndex, useModelStore, useModelDelete } from '@rhino-dev/rhino-react';
import type { Project } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import { fmtCurrency, fmtRelative } from '../lib/format';
import { Loading, StatusPill } from './DashboardPage';

const PER_PAGE = 10;
type Sort = '-id' | 'title' | '-title' | 'status' | 'starts_at' | '-starts_at' | 'ends_at' | '-ends_at';

export function ProjectsPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [sort,    setSort]    = useState<Sort>('title');
  const [page,    setPage]    = useState(1);
  const [showNew, setShowNew] = useState(false);

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (status) f.status = status;
    return f;
  }, [status]);

  const projects = useModelIndex<Project>('projects', {
    filters,
    search: search || undefined,
    sort,
    page,
    perPage: PER_PAGE,
  });

  const store = useModelStore<Project>('projects');
  const del   = useModelDelete<Project>('projects');

  const list = projects.data?.data ?? [];
  const pag  = projects.data?.pagination;

  function onSortClick(field: Exclude<Sort, `-${string}`>) {
    setSort(s => (s === field ? (`-${field}` as Sort) : field));
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">Multi-tenant scope: <span className="mono accent">/api/{`{org}`}/projects</span></p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon.plus size={14} /> New project</button>
      </div>

      <div className="toolbar">
        <input className="input input-search" style={{ flex: 1, maxWidth: 320 }} placeholder="Search title / description…" value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} />
        <select className="input select" value={status} onChange={e => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="done">Done</option>
          <option value="archived">Archived</option>
        </select>
        <span className="faint" style={{ marginLeft: 'auto', fontSize: 12 }}>
          {projects.isFetching ? 'fetching…' : `${list.length} of ${pag?.total ?? list.length}`}
        </span>
      </div>

      <div className="card" style={{ overflow: 'visible' }}>
        {projects.isLoading ? <Loading /> : list.length === 0 ? (
          <div className="empty"><h3>No projects match</h3><p>Try a different filter, or create one.</p></div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <Th label="Title"   field="title"      sort={sort} onClick={onSortClick} />
                <Th label="Status"  field="status"     sort={sort} onClick={onSortClick} />
                <Th label="Budget"  field={null} />
                <Th label="Starts"  field="starts_at"  sort={sort} onClick={onSortClick} />
                <Th label="Ends"    field="ends_at"    sort={sort} onClick={onSortClick} />
                <Th label="Updated" field={null} />
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id} onClick={() => nav(`/projects/${p.id}`)}>
                  <td>
                    <Link to={`/projects/${p.id}`} onClick={e => e.stopPropagation()} style={{ fontWeight: 600 }}>{p.title}</Link>
                    <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{p.description?.slice(0, 90)}</div>
                  </td>
                  <td><StatusPill value={p.status} /></td>
                  <td>{p.budget != null ? fmtCurrency(p.budget) : <span className="rbac-hidden">hidden</span>}</td>
                  <td className="faint">{p.starts_at?.slice(0, 10) ?? '—'}</td>
                  <td className="faint">{p.ends_at?.slice(0, 10) ?? '—'}</td>
                  <td className="faint">{fmtRelative(p.updated_at)}</td>
                  <td>
                    <button
                      className="btn btn-ghost btn-icon"
                      title="Soft delete (move to trash)"
                      onClick={async e => {
                        e.stopPropagation();
                        if (!confirm(`Delete project "${p.title}"?`)) return;
                        try {
                          await del.mutateAsync(p.id);
                          toast(`Deleted "${p.title}"`, 'ok');
                        } catch (err) {
                          toast(`Delete failed: ${(err as Error).message}`, 'error');
                        }
                      }}
                    >
                      <Icon.trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pag && pag.lastPage > 1 && (
          <div className="pager">
            <div className="pager-info">Page {pag.currentPage} of {pag.lastPage} · {pag.total} total</div>
            <div className="pager-ctrls">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><Icon.arrowL size={12} /></button>
              <button className="btn btn-sm" disabled={page >= pag.lastPage} onClick={() => setPage(p => p + 1)}><Icon.arrowR size={12} /></button>
            </div>
          </div>
        )}
      </div>

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreate={async data => {
            try {
              const created = await store.mutateAsync(data);
              toast(`Created "${created.title}"`, 'ok');
              setShowNew(false);
            } catch (err) {
              toast(`Create failed: ${(err as Error).message}`, 'error');
            }
          }}
          busy={store.isPending}
        />
      )}
    </>
  );
}

function Th(props: { label: string; field: string | null; sort?: string; onClick?: (f: any) => void }) {
  const { label, field, sort, onClick } = props;
  if (!field || !onClick) return <th>{label}</th>;
  const active = sort === field || sort === `-${field}`;
  return (
    <th className={active ? 'sorted' : ''} onClick={() => onClick(field)}>
      {label}
      <span className="sort-arrow">{active ? (sort === field ? '↑' : '↓') : '↕'}</span>
    </th>
  );
}

function NewProjectModal({ onClose, onCreate, busy }: { onClose: () => void; onCreate: (data: Partial<Project>) => Promise<void>; busy: boolean }) {
  const [title, setTitle]   = useState('');
  const [status, setStatus] = useState<Project['status']>('draft');
  const [desc, setDesc]     = useState('');
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">New project</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon.close /></button>
        </div>
        <div className="modal-body">
          <form className="form" onSubmit={e => { e.preventDefault(); onCreate({ title, status, description: desc }); }}>
            <div className="field">
              <label>Title</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label>Status</label>
              <select className="input select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="done">Done</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="input" rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div className="modal-foot" style={{ padding: 0, border: 0 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : <Icon.check size={14} />} Create</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
