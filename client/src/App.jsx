import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Budgets = lazy(() => import('./pages/Budgets'));
const AIChat = lazy(() => import('./pages/AIChat'));
const Insights = lazy(() => import('./pages/Insights'));
const Login = lazy(() => import('./pages/Login'));

const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const TwoFAVerify = lazy(() => import('./pages/TwoFAVerify'));
const TwoFASetup = lazy(() => import('./pages/TwoFASetup'));
const Trash = lazy(() => import('./pages/Trash'));
const Admin = lazy(() => import('./pages/Admin'));

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminRegister = lazy(() => import('./pages/AdminRegister'));

const ProtectedRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth);
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const { token } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex overflow-hidden">
      {token && (
        <>
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        </>
      )}
      <div className="flex-1 flex flex-col w-full min-w-0">
        {token && <Navbar onMenuClick={() => setIsSidebarOpen(true)} />}
        <main className={`flex-1 overflow-y-auto ${token ? 'p-4 md:p-6 lg:p-8' : ''}`}>
          <Suspense fallback={<div className="flex items-center justify-center h-full">Loading FinAI...</div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/register" element={<AdminRegister />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-2fa" element={<TwoFAVerify />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
              <Route path="/ai-chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />


              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/settings/security" element={<ProtectedRoute><TwoFASetup /></ProtectedRoute>} />
              <Route path="/trash" element={<ProtectedRoute><Trash /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;