import { Navigate, Route, Routes } from "react-router-dom";
import { APP_ROUTES } from "./constants/routes";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { sessionService } from "./services/sessionService";
import DocumentEditor from "./components/DocumentEditor";

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
        path={"/login"}
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      <Route
        path={"/"}
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path={`document/:documentId`}
        element={
          <ProtectedRoute>
            <DocumentEditor />
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
