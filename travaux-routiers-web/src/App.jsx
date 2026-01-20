// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import Login from "pages/auth/Login";
import MapPage from "pages/map/MapPage";
import ManageReports from "pages/manager/ManageReports";
import ProtectedRoute from "components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager"
        element={
          <ProtectedRoute>
            <ManageReports />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
