import { useState } from 'react';
import { useModelIndex, useModelStore, useModelDelete, useModelUpdate } from '@rhino-dev/rhino-react';
import type { Label } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import { Loading } from './DashboardPage';

const PRESETS = ['#00d9c0', '#60a5fa', '#ffb547', '#ff6b6b', '#b07cff', '#4ade80'];

export function LabelsPage() {
  const toast = useToast();
  const labels = useModelIndex<Label>('labels', { perPage: 200 });
  const store  = useModelStore<Label>('labels');
  const update = useModelUpdate<Label>('labels');
  const del    = useModelDelete<Label>('labels');
  const [name, setName]   = useState('');
  const [color, setColor] = useState(PRESETS[0]);
  const list = labels.data?.data ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Labels</h1>
          <p className="page-sub">Org-scoped tagging — <span className="mono accent">useModelStore('labels')</span> for create, inline edit/delete for mutations</p>
        </div>
      </div>

      <div className="detail-grid" style={{ gridTemplateColumns: '320px 1fr' }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Create label</div></div>
          <div className="card-body">
            <form className="form" onSubmit={async e => {
              e.preventDefault();
              if (!name.trim()) return;
              try {
                await store.mutateAsync({ name, color });
                toast(`Created "${name}"`, 'ok');
                setName('');
              } catch (err) { toast(`Failed: ${(err as Error).message}`, 'error'); }
            }}>
              <div className="field"><label>Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. urgent" required /></div>
              <div className="field">
                <label>Color</label>
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  {PRESETS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)} title={c}
                      style={{ width: 24, height: 24, borderRadius: 6, border: color === c ? '2px solid var(--fg)' : '2px solid var(--border)', background: c, cursor: 'pointer', padding: 0 }} />
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={store.isPending}>{store.isPending ? <span className="spinner" /> : <Icon.plus size={14} />} Create</button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">{list.length} labels</div></div>
          {labels.isLoading ? <Loading /> : list.length === 0 ? (
            <div className="card-empty">No labels yet.</div>
          ) : (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {list.map(l => (
                <LabelRow
                  key={l.id} label={l}
                  onRename={async name => { await update.mutateAsync({ id: l.id, data: { name } }); toast('Renamed', 'ok'); }}
                  onDelete={async () => { if (confirm(`Delete "${l.name}"?`)) { await del.mutateAsync(l.id); toast('Deleted', 'ok'); } }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LabelRow({ label, onRename, onDelete }: { label: Label; onRename: (name: string) => Promise<void>; onDelete: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(label.name);
  return (
    <div className="row" style={{ padding: '8px 10px', background: 'var(--bg-2)', borderRadius: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 3, background: label.color ?? '#888' }} />
      {editing ? (
        <input className="input" style={{ flex: 1, padding: '4px 8px' }} value={value} onChange={e => setValue(e.target.value)} autoFocus
          onKeyDown={async e => { if (e.key === 'Enter') { await onRename(value); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
          onBlur={() => setEditing(false)} />
      ) : (
        <span style={{ flex: 1, fontWeight: 500 }}>{label.name}</span>
      )}
      <span className="faint mono" style={{ fontSize: 11 }}>{label.color}</span>
      <button className="btn btn-ghost btn-icon" onClick={() => setEditing(e => !e)}><Icon.edit size={12} /></button>
      <button className="btn btn-ghost btn-icon" onClick={onDelete}><Icon.trash size={12} /></button>
    </div>
  );
}
