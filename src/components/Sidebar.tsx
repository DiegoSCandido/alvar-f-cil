import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  ScrollText,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import o2conIcon from "@/assets/o2con-icon.png";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const navItems = [
  { label: "Início", path: "/dashboard", icon: LayoutGrid },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Alvarás", path: "/alvaras", icon: ScrollText },
  { label: "Taxas de Funcionamento", path: "/taxas", icon: ShieldCheck },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === "true";
  });

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  useEffect(() => {
    const mainContent = document.querySelector("[data-main-content]");
    if (mainContent) {
      if (isCollapsed) {
        mainContent.classList.remove("lg:ml-[260px]");
        mainContent.classList.add("lg:ml-[72px]");
      } else {
        mainContent.classList.remove("lg:ml-[72px]");
        mainContent.classList.add("lg:ml-[260px]");
      }
    }
  }, [isCollapsed]);

  return (
    <>
      {/* Barra superior — mobile (estilo Hub: tipografia + bordas do tema) */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card p-3 sm:p-4 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src={o2conIcon}
            alt="O2con"
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className="font-display text-base font-semibold tracking-tight text-sidebar-foreground truncate">
            Alvarás
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isOpen ? (
            <X className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-150",
          "lg:z-50 lg:mt-0 mt-14",
          isCollapsed ? "lg:w-[72px]" : "lg:w-[260px]",
          "w-[260px]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo + título — mesmo bloco do Hub (h-16) */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border",
            isCollapsed ? "justify-center overflow-visible px-0" : "gap-3 px-5"
          )}
        >
          <img
            src={o2conIcon}
            alt="O2con"
            className="h-9 w-9 shrink-0 object-contain"
          />
          {!isCollapsed && (
            <span className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">
              Alvarás
            </span>
          )}
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex min-h-0 flex-1 flex-col">
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              const linkClass = cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-opacity duration-150",
                isCollapsed && "justify-center px-2",
                isActive
                  ? "brand-gradient text-white shadow-glow-primary hover:opacity-90"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              );

              const inner = (
                <>
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </>
              );

              const link = (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={linkClass}
                >
                  {inner}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="hidden lg:block">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </nav>

          {/* Rodapé — alinhado ao Hub (rótulo + Sair) */}
          <div className="border-t border-sidebar-border px-5 py-3">
            {!isCollapsed && (
              <p className="mb-2 truncate text-xs font-medium text-sidebar-muted">
                {user?.fullName || user?.email || "Administrador"}
              </p>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors duration-150 hover:bg-sidebar-accent",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                  {!isCollapsed && <span>Sair</span>}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="hidden lg:block">
                  <p>Sair</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
          </div>
        </TooltipProvider>

        {/* Toggle recolher — igual ao Hub (absoluto, canto da sidebar) */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors duration-150 hover:text-foreground lg:flex"
          aria-label={isCollapsed ? "Expandir menu" : "Minimizar menu"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
          ) : (
            <ChevronLeft className="h-3 w-3" strokeWidth={1.5} />
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
