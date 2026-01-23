import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ClientesPage from "./pages/Clientes";
import AlvarasPage from "./pages/Alvaras";
// Certificados page temporarily removed from imports to avoid production build errors
// import CertificadosPage from "./pages/Certificados";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/Sidebar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

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

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar - mobile: top, desktop: left - hidden on login page */}
      {!isPublicPage && <Sidebar />}
      {/* Main content - aplica margin-left no desktop somente quando não for página pública (login) */}
      <div className={`flex-1 w-full ${!isPublicPage ? "lg:ml-64" : ""}`}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/alvaras" element={<AlvarasPage />} />
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
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
