import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Menu, X, LogOut, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

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

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
    // Dispara evento customizado para sincronizar com App.tsx
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

  // Ajusta o margin do conteúdo principal quando colapsado
  useEffect(() => {
    const mainContent = document.querySelector('[data-main-content]');
    if (mainContent) {
      if (isCollapsed) {
        mainContent.classList.remove('lg:ml-56');
        mainContent.classList.add('lg:ml-16');
      } else {
        mainContent.classList.remove('lg:ml-16');
        mainContent.classList.add('lg:ml-56');
      }
    }
  }, [isCollapsed]);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 p-3 sm:p-4 flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">O2controle</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={20} className="sm:w-6 sm:h-6" /> : <Menu size={20} className="sm:w-6 sm:h-6" />}
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
        'fixed lg:fixed left-0 top-0 h-screen bg-white border-r border-slate-200 shadow-lg z-40',
        'transition-all duration-300 transform lg:transform-none',
        'flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'lg:mt-0 mt-14 sm:mt-16',
        isCollapsed ? 'lg:w-16 w-56' : 'lg:w-56 w-56'
      )}>
        {/* Logo/Header - Desktop/Tablet only */}
        <div className={cn(
          'p-4 lg:p-6 border-b border-slate-200 hidden lg:flex flex-shrink-0 items-center justify-between',
          isCollapsed && 'lg:justify-center lg:px-2'
        )}>
          {!isCollapsed && (
            <h1 className="text-xl 2xl:text-2xl font-bold text-slate-900">Menu</h1>
          )}
          {/* Botão Circular para Toggle - Desktop/Tablet only */}
          <button
            onClick={toggleCollapse}
            className={cn(
              'hidden lg:flex items-center justify-center',
              'w-9 h-9 rounded-full',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'shadow-md hover:shadow-lg',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isCollapsed && 'lg:mx-auto'
            )}
            aria-label={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
        {/* Navigation Items - com scroll independente */}
        <nav className="flex-1 flex flex-col gap-2 p-4 lg:p-6 overflow-y-auto">
          <TooltipProvider delayDuration={300}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              const linkContent = (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200 flex-shrink-0 text-sm lg:text-base',
                    'lg:justify-start',
                    isCollapsed && 'lg:justify-center lg:px-2',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <Icon size={18} className="lg:w-5 lg:h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="lg:block hidden">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </TooltipProvider>
        </nav>

        {/* User Info & Logout - fixo na base */}
        <div className="border-t border-slate-200 p-4 lg:p-6 space-y-3 lg:space-y-4 flex-shrink-0">
          {user && !isCollapsed && (
            <div className="text-xs lg:text-sm text-slate-500 px-1 hidden lg:block">
              <p className="font-medium text-slate-700 truncate">{user.fullName || user.email}</p>
            </div>
          )}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className={cn(
                    'w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 text-sm lg:text-base',
                    'lg:justify-start',
                    isCollapsed && 'lg:justify-center lg:px-2'
                  )}
                >
                  <LogOut size={18} className="lg:w-5 lg:h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">Sair</span>
                  )}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="lg:block hidden">
                  <p>Sair</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

