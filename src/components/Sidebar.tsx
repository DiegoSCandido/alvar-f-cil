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
    {
      label: 'Taxas de Funcionamento',
      path: '/taxas',
      icon: Shield,
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
      {/* Mobile/Tablet Menu Button */}
      <div className="xl:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 p-3 sm:p-4 flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">O2controle</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
        </button>
      </div>

      {/* Mobile/Tablet Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed xl:fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 shadow-lg z-40',
        'transition-transform duration-300 transform xl:transform-none',
        'flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0',
        'xl:mt-0 mt-14 sm:mt-16'
      )}>
        {/* Logo/Header - Desktop only */}
        <div className="p-4 xl:p-6 border-b border-slate-200 hidden xl:block flex-shrink-0">
          <h1 className="text-xl 2xl:text-2xl font-bold text-slate-900">Menu</h1>
        </div>
        {/* Navigation Items - com scroll independente */}
        <nav className="flex-1 flex flex-col gap-2 p-4 xl:p-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-lg transition-all duration-200 flex-shrink-0 text-sm xl:text-base',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                <Icon size={18} className="xl:w-5 xl:h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout - fixo na base */}
        <div className="border-t border-slate-200 p-4 xl:p-6 space-y-3 xl:space-y-4 flex-shrink-0">
          {user && (
            <div className="text-xs xl:text-sm text-slate-500 px-1">
              <p className="font-medium text-slate-700 truncate">{user.fullName || user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2.5 xl:py-3 text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 text-sm xl:text-base"
          >
            <LogOut size={18} className="xl:w-5 xl:h-5 flex-shrink-0" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

