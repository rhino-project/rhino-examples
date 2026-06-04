import { useAuth } from '@rhino-dev/rhino-react';

import { LoginPage } from './pages/LoginPage';
import { WorkspacePage } from './pages/WorkspacePage';

// Single-page group-aware auth demo: when signed out show the group-aware login,
// when signed in show the one focused workspace view for the detected group.
export function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <WorkspacePage /> : <LoginPage />;
}
