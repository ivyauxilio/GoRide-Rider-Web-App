import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DeliveryOffersPage from "./pages/DeliveryOffersPage";
import RiderEarningsPage from "./pages/RiderEarningsPage";
import RiderDeliveryHistoryPage from "./pages/RiderDeliveryHistoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="/offers" element={<DeliveryOffersPage />} />
              <Route path="/earnings" element={<RiderEarningsPage />} />

              <Route
                path="/delivery-history"
                element={<RiderDeliveryHistoryPage />}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
