import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ClientesPage from "./pages/Clientes";
import AlvarasPage from "./pages/Alvaras";
import TaxasPage from "./pages/Taxas";
// Certificados page temporarily removed from imports to avoid production build errors
// import CertificadosPage from "./pages/Certificados";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/Sidebar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { ClienteModalProvider } from "./contexts/ClienteModalContext";
import { ClienteModalGlobal } from "./components/ClienteModalGlobal";
import ErrorBoundary from "./components/ErrorBoundary";
import bgGradient from "./assets/bg-gradient.png";

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated, isInitializing, mustChangePassword, clearMustChangePassword } = useAuth();
  const isLoginPage = location.pathname === "/";
  const isPublicPage = isLoginPage;

  // Hooks DEVEM ser chamados antes de qualquer return condicional (Rules of Hooks)
  // Sincroniza o estado inicial da sidebar colapsada
  useEffect(() => {
    if (!isPublicPage) {
      const isCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
      const mainContent = document.querySelector('[data-main-content]');
      if (mainContent) {
        mainContent.classList.remove("lg:ml-[260px]", "lg:ml-[72px]");
        mainContent.classList.add(isCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]");
      }
    }
  }, [isPublicPage]);

  // Listener para mudanças no localStorage (quando sidebar é colapsada/expandida)
  useEffect(() => {
    if (!isPublicPage) {
      const handleStorageChange = () => {
        const isCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
        const mainContent = document.querySelector('[data-main-content]');
        if (mainContent) {
          mainContent.classList.remove("lg:ml-[260px]", "lg:ml-[72px]");
          mainContent.classList.add(isCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]");
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('sidebar-toggle', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('sidebar-toggle', handleStorageChange);
      };
    }
  }, [isPublicPage]);

  // Enquanto está inicializando, mostra loading apenas se não estiver na página de login
  if (isInitializing && !isPublicPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redireciona para login se não autenticado em páginas protegidas
  if (!isInitializing && !isAuthenticated && !isPublicPage) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden lg:flex-row">
      {/* Modal obrigatório de redefinição de senha no primeiro login */}
      {!isPublicPage && isAuthenticated && mustChangePassword && (
        <ChangePasswordModal
          open={true}
          onOpenChange={() => {}}
          onSuccess={clearMustChangePassword}
          required={true}
        />
      )}
      {/* Sidebar - mobile: top, desktop: left - hidden on login page */}
      {!isPublicPage && <Sidebar />}
      {/* Main content - aplica margin-left no desktop/tablet somente quando não for página pública (login) */}
      <div
        className={`relative min-h-screen w-full min-w-0 flex-1 bg-background ${!isPublicPage ? "lg:ml-[260px]" : ""}`}
        data-main-content
      >
        {/* Fundo em tela cheia, fixo (não rola com o conteúdo) - apenas em páginas autenticadas */}
        {!isPublicPage && (
          <div
            className="fixed inset-0 opacity-10 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
            style={{ backgroundImage: `url(${bgGradient})` }}
            aria-hidden
          />
        )}
        <div className="relative z-[1]">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/alvaras" element={<AlvarasPage />} />
          <Route path="/taxas" element={<TaxasPage />} />
          {/* /certificados route removed temporarily until page is ready */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ClienteModalProvider>
              <AppContent />
              <ClienteModalGlobal />
            </ClienteModalProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
