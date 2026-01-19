import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ClientesPage from "./pages/Clientes";
import AlvarasPage from "./pages/Alvaras";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/Sidebar";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isLoginPage = location.pathname === "/";

  // Redireciona para login se não autenticado em páginas protegidas
  if (!isAuthenticated && !isLoginPage) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar - mobile: top, desktop: left - hidden on login page */}
      {!isLoginPage && <Sidebar />}
      {/* Main content */}
      <div className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/alvaras" element={<AlvarasPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => (
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
);

export default App;
