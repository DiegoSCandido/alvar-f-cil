import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Menu, X, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      label: 'Início',
      path: '/dashboard',
      icon: Home,
    },
    {
      label: 'Clientes',
      path: '/clientes',
      icon: Users,
    },
      {
        label: 'Alvarás',
        path: '/alvaras',
        icon: FileText,
      },
      // 'Certificados' removed from nav until page is implemented
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-900">O2controle</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 shadow-lg z-40',
        'transition-transform duration-300 transform lg:transform-none',
        'flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'lg:mt-0 mt-16'
      )}>
        {/* Logo/Header - Desktop only (Menu centered) - match pages header height */}
        <div className="bg-card border-b border-slate-200 hidden lg:flex flex-shrink-0 items-center justify-center px-4 py-3 sm:py-4 lg:py-4 min-h-[72px]">
          <h1 className="text-base sm:text-lg font-bold text-foreground">Menu</h1>
        </div>

        {/* (Menu only header kept centered for desktop) */}

        {/* Navigation Items - com scroll independente */}
        <nav className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 flex-shrink-0',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout - fixo na base */}
        <div className="border-t border-slate-200 p-6 space-y-4 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

