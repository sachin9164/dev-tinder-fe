import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/app-shell';
import { LoadingState } from './components/common/loading-state';
import { useAuth } from './hooks/use-auth';
import { AuthPage } from './pages/auth-page';
import { DiscoverPage } from './pages/discover-page';
import { MatchesPage } from './pages/matches-page';
import { ProfilePage } from './pages/profile-page';
import { RequestsPage } from './pages/requests-page';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState text="Checking session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          element={
            <PrivateRoute>
              <AppShell />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
