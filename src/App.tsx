import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AdminRoute, ProtectedRoute } from "./routes/ProtectedRoute";
import { Layout } from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminAppsPage from "./pages/AdminAppsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import SecurityPage from "./pages/SecurityPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin/apps" element={<AdminAppsPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>
              <Route path="*" element={<DashboardPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
