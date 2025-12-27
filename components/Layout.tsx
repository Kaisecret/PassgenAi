import React, { useState } from 'react';
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
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate(AppRoutes.HOME);
  };

  const isActive = (path: string) => location.pathname === path;
  const isLandingPage = location.pathname === AppRoutes.HOME;

  // Safety check: ensure user object has properties before accessing
  const userName = user?.name || 'User';

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

          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-4">
                  <span className="text-sm text-slate-400">Hello, {userName}</span>
                  <Link 
                    to={AppRoutes.SETTINGS}
                    className={`text-sm font-medium transition-colors ${isActive(AppRoutes.SETTINGS) ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Settings
                  </Link>
                </div>
                {/* Mobile Settings Icon */}
                <Link to={AppRoutes.SETTINGS} className="md:hidden p-2 text-slate-400 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </Link>

                <button 
                  onClick={handleLogoutClick}
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to={AppRoutes.LOGIN}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${isActive(AppRoutes.LOGIN) ? 'text-white' : 'text-slate-400 hover:text-white'}`}
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

      {/* Footer - Only show on Landing Page */}
      {isLandingPage && (
        <footer className="border-t border-white/10 py-8 bg-slate-950">
          <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} PassGen AI. All rights reserved.</p>
            <p className="mt-2 opacity-50">Deployed on Vercel</p>
          </div>
        </footer>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsLogoutModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-3">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Log Out?</h3>
              <p className="text-slate-400 text-sm">
                Are you sure you want to sign out? You will need to log in again to access your account.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;