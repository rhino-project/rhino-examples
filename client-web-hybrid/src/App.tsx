import { useAuth } from '@rhino-dev/rhino-react';

import { useGroup } from './groups/GroupContext';
import { GroupSelect } from './pages/GroupSelect';
import { LoginPage } from './pages/LoginPage';
import { WorkspacePage } from './pages/WorkspacePage';

// Multi-face flow:
//   1. No active group        -> GroupSelect entry screen (pick a face + org).
//   2. Active group, signed out -> generic group-aware Login.
//   3. Active group, signed in  -> generic Workspace for that face.
export function App() {
  const { active } = useGroup();
  const { isAuthenticated } = useAuth();

  if (!active) return <GroupSelect />;
  return isAuthenticated ? <WorkspacePage /> : <LoginPage />;
}
