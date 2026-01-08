import { Link, useLocation } from 'react-router-dom';
import { Home, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    {
      label: 'Início',
      path: '/',
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
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 shadow-lg">
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Menu</h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-2 p-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
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
    </aside>
  );
};

export default Sidebar;

