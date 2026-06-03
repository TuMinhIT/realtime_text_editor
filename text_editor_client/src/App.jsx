import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import { sessionService } from "./services/sessionService";
import DocumentEditor from "./components/DocumentEditor";
import SectionAuthority from "./pages/SectionAuthority";
import SectionUserEdit from "./pages/SectionUserEdit";

//test realtime:
import { useEffect } from "react";
import DocOverview from "./pages/DocOverview";

function ProtectedRoute({ children }) {
  if (!sessionService.isAuthenticated()) {
    return <Navigate to={"/login"} replace />;
  }
  return children;
}

// Route bảo vệ cho Admin
function AdminRoute({ children }) {
  if (!sessionService.isAuthenticated()) {
    return <Navigate to={"/login"} replace />;
  }

  if (!sessionService.isAdmin()) {
    return <Navigate to={"/"} replace />;
  }

  return children;
}

// Route bảo vệ cho User bình thường
function UserRoute({ children }) {
  if (!sessionService.isAuthenticated()) {
    return <Navigate to={"/login"} replace />;
  }

  if (sessionService.isAdmin()) {
    return <Navigate to={"/admin"} replace />;
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
      {/* Guest Routes - dành cho chưa login */}
      <Route
        path={"/login"}
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      {/* User Routes - dành cho user bình thường */}
      <Route
        path={"/"}
        element={
          <UserRoute>
            <HomePage />
          </UserRoute>
        }
      />

      <Route
        path={"/overview/:documentId"}
        element={
          <UserRoute>
            <DocOverview />
          </UserRoute>
        }
      />

      <Route
        path={`document/:title/:documentId`}
        element={
          <UserRoute>
            <SectionUserEdit />
          </UserRoute>
        }
      />

      {/* Admin document routes (prefix with /admin) */}
      <Route
        path={`admin/document/:documentId`}
        element={
          <AdminRoute>
            <DocumentEditor />
          </AdminRoute>
        }
      />
      <Route
        path={`admin/sections/:documentId`}
        element={
          <AdminRoute>
            <SectionAuthority />
          </AdminRoute>
        }
      />

      <Route
        path={`admin`}
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Catch-all route */}
      <Route
        path={"/*"}
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
