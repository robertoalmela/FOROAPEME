import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PollsPage } from './pages/PollsPage';
import { PollDetailPage } from './pages/PollDetailPage';
import { ForumPage } from './pages/ForumPage';
import { ThreadDetailPage } from './pages/ThreadDetailPage';
import { NewThreadPage } from './pages/NewThreadPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { Bell, Vote, MessageSquare, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#EDEDE3]">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const navItems = [
    { to: '/', label: 'Inicio', icon: null },
    { to: '/polls', label: 'Votaciones', icon: <Vote className="w-4 h-4" /> },
    { to: '/forum', label: 'Foro', icon: <MessageSquare className="w-4 h-4" /> },
    { to: '/notifications', label: 'Notificaciones', icon: <Bell className="w-4 h-4" /> },
    { to: '/profile', label: 'Perfil', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#EDEDE3]">
      <header className="bg-white shadow-sm border-b border-[#e5e9dd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center">
                <img
                  src="/apeme-logo.png"
                  alt="APEME Alicante"
                  className="h-10 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.textContent = 'APEME Alicante';
                  }}
                />
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 text-[#4C4A45] hover:text-[#00738B] transition-colors font-medium"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <button
                onClick={logout}
                className="flex items-center gap-2 text-[#4C4A45] hover:text-[#ef4444] transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </nav>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#e5e9dd] bg-white">
            <nav className="px-4 py-3 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 py-2 text-[#4C4A45] hover:text-[#00738B]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 py-2 text-[#4C4A45] hover:text-[#ef4444] w-full"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/polls"
              element={
                <ProtectedRoute>
                  <PollsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/polls/:id"
              element={
                <ProtectedRoute>
                  <PollDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum"
              element={
                <ProtectedRoute>
                  <ForumPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum/thread/:id"
              element={
                <ProtectedRoute>
                  <ThreadDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum/new"
              element={
                <ProtectedRoute>
                  <NewThreadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
