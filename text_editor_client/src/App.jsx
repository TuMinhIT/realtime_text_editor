import { Route, Routes } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import LoginPage from "./pages/LoginPage";
import DocumentsPage from "./pages/DocumentsPage";

function App() {
  return (
    <>
      <Routes>
        {/* Collaborative Editor Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<DocumentsPage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </>
  );
}

export default App;
