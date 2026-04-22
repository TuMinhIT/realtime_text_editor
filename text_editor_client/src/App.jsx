import { Navigate, Route, Routes } from "react-router-dom";
import { APP_ROUTES } from "./constants/routes";
import EditorPage from "./pages/EditorPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { sessionService } from "./services/sessionService";

function ProtectedRoute({ children }) {
  if (!sessionService.isAuthenticated()) {
    return <Navigate to={"/login"} replace />;
  }
  return children;
}

function GuestRoute({ children }) {
  if (sessionService.isAuthenticated()) {
    return <Navigate to={"/"} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route
        path={APP_ROUTES.login}
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      <Route
        path={APP_ROUTES.home}
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path={`${APP_ROUTES.editor}/:documentId`}
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={"*"}
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
