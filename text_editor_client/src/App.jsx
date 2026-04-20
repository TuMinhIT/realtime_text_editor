import { Navigate, Route, Routes } from "react-router-dom";
import { APP_ROUTES } from "./constants/routes";
import DashboardPage from "./pages/DashboardPage";
import EditorPage from "./pages/EditorPage";
import LoginPage from "./pages/LoginPage";
import DocumentsPage from "./pages/DocumentsPage";
import ProjectsPage from "./pages/ProjectsPage";
import { sessionService } from "./services/sessionService";

function ProtectedRoute({ children }) {
  if (!sessionService.isAuthenticated()) {
    return <Navigate to={APP_ROUTES.login} replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  if (sessionService.isAuthenticated()) {
    return <Navigate to={APP_ROUTES.dashboard} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route
        path={APP_ROUTES.home}
        element={<Navigate to={APP_ROUTES.login} replace />}
      />
      <Route
        path={APP_ROUTES.login}
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path={APP_ROUTES.dashboard}
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.documents}
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.projects}
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={APP_ROUTES.editor}
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
