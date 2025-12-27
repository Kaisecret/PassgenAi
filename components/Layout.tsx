import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppRoutes } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate(AppRoutes.HOME);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={AppRoutes.HOME} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all">
              P
            </div>
            <span className="font-bold text-xl tracking-tight">PassGen<span className="text-brand-400">AI</span></span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
                  <span>Welcome, {user.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to={AppRoutes.LOGIN}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${isActive(AppRoutes.LOGIN) ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Log In
                </Link>
                <Link 
                  to={AppRoutes.REGISTER}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-white text-slate-900 text-sm font-bold transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 bg-slate-950">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} PassGen AI. All rights reserved.</p>
          <p className="mt-2">Deployed on Vercel</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;