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
import { ClienteModalProvider } from "./contexts/ClienteModalContext";
import { ClienteModalGlobal } from "./components/ClienteModalGlobal";
import ErrorBoundary from "./components/ErrorBoundary";

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAuth();
  const isLoginPage = location.pathname === "/";
  const isPublicPage = isLoginPage;

  // Enquanto está inicializando, não redireciona
  if (isInitializing) {
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
  if (!isAuthenticated && !isPublicPage) {
    return <Navigate to="/" replace />;
  }

  // Sincroniza o estado inicial da sidebar colapsada
  useEffect(() => {
    if (!isPublicPage) {
      const isCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
      const mainContent = document.querySelector('[data-main-content]');
      if (mainContent) {
        // Remove ambas as classes primeiro
        mainContent.classList.remove('lg:ml-56', 'lg:ml-16');
        // Adiciona a classe correta
        if (isCollapsed) {
          mainContent.classList.add('lg:ml-16');
        } else {
          mainContent.classList.add('lg:ml-56');
        }
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
          mainContent.classList.remove('lg:ml-56', 'lg:ml-16');
          if (isCollapsed) {
            mainContent.classList.add('lg:ml-16');
          } else {
            mainContent.classList.add('lg:ml-56');
          }
        }
      };

      // Escuta mudanças no localStorage (de outras abas)
      window.addEventListener('storage', handleStorageChange);
      
      // Escuta eventos customizados (da mesma aba)
      window.addEventListener('sidebar-toggle', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('sidebar-toggle', handleStorageChange);
      };
    }
  }, [isPublicPage]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar - mobile: top, desktop: left - hidden on login page */}
      {!isPublicPage && <Sidebar />}
      {/* Main content - aplica margin-left no desktop/tablet somente quando não for página pública (login) */}
      <div className={`flex-1 w-full ${!isPublicPage ? "lg:ml-56" : ""}`} data-main-content>
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
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <ClienteModalProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
            <ClienteModalGlobal />
          </ClienteModalProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
