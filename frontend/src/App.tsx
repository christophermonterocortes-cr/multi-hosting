import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProjectModal } from './components/ProjectModal';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { PortManager } from './pages/PortManager';
import { DatabaseManager } from './pages/DatabaseManager';
import { PhpMyAdmin } from './pages/PhpMyAdmin';
import { UserManager } from './pages/UserManager';
import { AuditLogs } from './pages/AuditLogs';
import { SystemHealth } from './pages/SystemHealth';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
          <span>Loading Multi Hosting...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased overflow-x-hidden">
      <Navbar 
        onNewProject={() => setModalOpen(true)} 
        onToggleMobile={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Docked Sidebar */}
        <div className="hidden lg:flex flex-shrink-0">
          <Sidebar onNewProject={() => setModalOpen(true)} />
        </div>

        {/* Mobile Slide-over Drawer & Backdrop */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Sliding Drawer */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-925 shadow-2xl z-50 animate-fade-in">
              <Sidebar 
                onNewProject={() => setModalOpen(true)} 
                onCloseMobile={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

import { LanguageProvider } from './context/LanguageContext';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/ports" element={<PortManager />} />
                <Route path="/databases" element={<DatabaseManager />} />
                <Route path="/phpmyadmin" element={<PhpMyAdmin />} />
                <Route path="/health" element={<SystemHealth />} />
                <Route path="/users" element={<AdminRoute><UserManager /></AdminRoute>} />
                <Route path="/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
                <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
