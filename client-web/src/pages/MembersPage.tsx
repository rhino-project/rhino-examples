import { useState } from 'react';
import { useModelIndex, useInvitations, useInviteUser, useCancelInvitation, useResendInvitation } from '@rhino-dev/rhino-react';
import type { User } from '../types';
import { Icon } from '../components/Icons';
import { useToast } from '../components/Toaster';
import { fmtRelative, initials } from '../lib/format';
import { Loading } from './DashboardPage';

export function MembersPage() {
  const toast = useToast();
  const users       = useModelIndex<User>('users', { perPage: 200 });
  const invitations = useInvitations();
  const invite      = useInviteUser();
  const resend      = useResendInvitation();
  const cancel      = useCancelInvitation();

  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState<'admin' | 'manager' | 'member' | 'viewer'>('member');

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Members & Invitations</h1>
          <p className="page-sub">
            <span className="mono accent">useInvitations</span> / <span className="mono accent">useInviteUser</span> / <span className="mono accent">useCancelInvitation</span>
          </p>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card">
          <div className="card-header"><div className="card-title">Active members</div></div>
          {users.isLoading ? <Loading /> : (
            <table className="table">
              <thead><tr><th>User</th><th>Email</th><th>Joined</th></tr></thead>
              <tbody>
                {(users.data?.data ?? []).map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="row">
                        <span className="avatar">{initials(u.name)}</span>
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="muted mono" style={{ fontSize: 12 }}>{u.email}</td>
                    <td className="faint">{fmtRelative(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-header"><div className="card-title">Invite a user</div></div>
            <div className="card-body">
              <form className="form" onSubmit={async e => {
                e.preventDefault();
                try {
                  await invite.mutateAsync({ email, role });
                  toast(`Invitation sent to ${email}`, 'ok');
                  setEmail('');
                } catch (err) { toast(`Failed: ${(err as Error).message}`, 'error'); }
              }}>
                <div className="field"><label>Email</label><input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="newcomer@example.com" /></div>
                <div className="field">
                  <label>Role</label>
                  <select className="input select" value={role} onChange={e => setRole(e.target.value as any)}>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={invite.isPending}>
                  {invite.isPending ? <span className="spinner" /> : <Icon.plus size={14} />} Send invite
                </button>
              </form>
            </div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-header"><div className="card-title">Pending invitations</div></div>
            {invitations.isLoading ? <Loading /> : (invitations.data?.length ?? 0) === 0 ? (
              <div className="card-empty">No pending invitations.</div>
            ) : (
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(invitations.data ?? []).map((inv: any) => (
                  <div key={inv.id} className="row" style={{ padding: '8px 10px', background: 'var(--bg-2)', borderRadius: 6, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{inv.email}</div>
                      <div className="faint" style={{ fontSize: 11 }}>{inv.role ?? '—'} · sent {fmtRelative(inv.created_at)}</div>
                    </div>
                    <div className="row gap-2">
                      <button className="btn btn-sm btn-ghost" onClick={async () => { await resend.mutateAsync(inv.id); toast('Invitation resent', 'ok'); }}>Resend</button>
                      <button className="btn btn-sm btn-danger" onClick={async () => { await cancel.mutateAsync(inv.id); toast('Invitation cancelled', 'ok'); }}>Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
