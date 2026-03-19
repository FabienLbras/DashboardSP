import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CustomerFilterProvider } from "./context/CustomerFilterContext";
import SignIn from "./pages/AuthPages/SignIn";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionRoute from "./components/auth/PermissionRoute";
import PublicRoute from "./components/auth/PublicRoute";
import Home from "./pages/Dashboard/Home";
import Transactions from "./pages/Transactions";
import UserProfiles from "./pages/UserProfiles";
import Terminals from "./pages/Terminals";
import Invoices from "./pages/Invoices";
import Support from "./pages/Support";
import MfaSettings from "./pages/MfaSettings";
import Reconciliation from "./pages/Reconciliation";
import EndOfDay from "./pages/EndOfDay";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import CustomerEdit from "./pages/CustomerEdit";
import CustomerNew from "./pages/CustomerNew";
import Reports from "./pages/Reports";
import { APP_PERMISSIONS } from "./lib/permissions";
import { LanguageProvider } from "./context/LanguageContext";

export default function App() {

  return (
    <LanguageProvider>
    <AuthProvider>
      <CustomerFilterProvider>
      <Routes>
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="profile" element={<UserProfiles />} />
          <Route path="profile/mfa" element={<MfaSettings />} />
          <Route path="transactions" element={<Transactions />} />
          <Route
            path="terminals"
            element={
              <PermissionRoute permission={APP_PERMISSIONS.VIEW_TERMINALS}>
                <Terminals />
              </PermissionRoute>
            }
          />
          <Route
            path="invoices"
            element={
              <PermissionRoute permission={APP_PERMISSIONS.ACCESS_ECOMMERCE_DATA}>
                <Invoices />
              </PermissionRoute>
            }
          />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/new" element={<CustomerNew />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="customers/:id/edit" element={<CustomerEdit />} />
          <Route path="reconciliation" element={<Reconciliation />} />
          <Route
            path="reports"
            element={
              <PermissionRoute permission={APP_PERMISSIONS.GENERATE_REPORTS}>
                <Reports />
              </PermissionRoute>
            }
          />
          <Route
            path="end-of-day"
            element={
              <PermissionRoute permission={APP_PERMISSIONS.VIEW_EOD_REPORTS}>
                <EndOfDay />
              </PermissionRoute>
            }
          />
          <Route path="support" element={<Support />} />
        </Route>
        <Route path="*" element={<Navigate to="/signin" />} />
      </Routes>
      </CustomerFilterProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}
