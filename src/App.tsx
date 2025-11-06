import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import SignIn from "./pages/AuthPages/SignIn";
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import Home from "./pages/Dashboard/Home";
import Transactions from "./pages/Transactions";
import UserProfiles from "./pages/UserProfiles";
import Terminals from "./pages/Terminals";
import Invoices from "./pages/Invoices";
import Support from "./pages/Support";

export default function App() {

  return (
    <AuthProvider>
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
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="profile" element={<UserProfiles />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="terminals" element={<Terminals />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="support" element={<Support />} />
        </Route>
        <Route path="*" element={<Navigate to="/signin" />} />
      </Routes>
    </AuthProvider>
  );
}