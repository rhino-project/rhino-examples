import { useEffect } from 'react';
import { useAuth } from '@rhino-dev/rhino-react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/AppShell';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { TasksPage } from './pages/TasksPage';
import { LabelsPage } from './pages/LabelsPage';
import { TrashPage } from './pages/TrashPage';
import { DashboardPage } from './pages/DashboardPage';

// Single-tenant flow: same full UI as the base client-web (sidebar menu,
// Dashboard, Projects, Project detail, Tasks, Labels, Trash) — but there are no
// orgs/invitations, so the Members feature is removed. Routes are plain
// (`/dashboard`, `/projects`, …), NOT org-prefixed.
export function App() {
  const { isAuthenticated, logout } = useAuth();

  // A 401 from any request fires `rhino:unauthorized` (see main.tsx). The token
  // is already gone from storage; calling logout() flips isAuthenticated so we
  // drop back to the login screen without a full-page reload loop.
  useEffect(() => {
    const onUnauth = () => void logout();
    window.addEventListener('rhino:unauthorized', onUnauth);
    return () => window.removeEventListener('rhino:unauthorized', onUnauth);
  }, [logout]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/labels" element={<LabelsPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}
