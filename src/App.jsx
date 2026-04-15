import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import AdminLayout from "./layout/AdminLayout";
import TableEntryPage from "./pages/TableEntryPage";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import ProfilePage from "./pages/ProfilePage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminRegisterPage from "./pages/admin/AdminRegisterPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminMenuPage from "./pages/admin/AdminMenuPage";
import AdminMenuManagementPage from "./pages/admin/AdminMenuManagementPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProfitPage from "./pages/admin/AdminProfitPage";
import AdminTablesPage from "./pages/admin/AdminTablesPage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { useAuth } from "./context/AuthContext";
import { Toaster } from 'react-hot-toast';
import "./App.css";

function App() {
  const { isAdmin, isLoggedIn } = useAuth();

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2200,
          style: { borderRadius: "12px", padding: "12px 14px", fontWeight: 600 },
        }}
      />
      <Routes>
        {/* Customer Routes */}
        <Route path="/auth" element={isLoggedIn && !isAdmin ? <Navigate to="/" /> : <AuthPage />} />
        <Route path="/forgot-password" element={isLoggedIn ? <Navigate to="/" /> : <ForgotPasswordPage />} />
        <Route path="/reset-password" element={isLoggedIn ? <Navigate to="/" /> : <ResetPasswordPage />} />
        <Route path="/" element={isLoggedIn && !isAdmin ? <MainLayout /> : <Navigate to="/auth" />}>
          <Route index element={<TableEntryPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

      {/* Admin Auth Routes */}
      <Route path="/admin/login" element={isAdmin ? <Navigate to="/admin" /> : <AdminLoginPage />} />
      <Route path="/admin/register" element={isAdmin ? <Navigate to="/admin" /> : <AdminRegisterPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={isAdmin ? <AdminLayout /> : <Navigate to="/admin/login" />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="menu" element={<AdminMenuPage />} />
        <Route path="menu-management" element={<AdminMenuManagementPage />} />
        <Route path="profit" element={<AdminProfitPage />} />
        <Route path="tables" element={<AdminTablesPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="users" element={<AdminUsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
