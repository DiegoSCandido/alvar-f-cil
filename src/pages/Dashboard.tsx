import { useAuth } from "@/contexts/AuthContext";
import { useClientes } from "@/hooks/useClientes";
import { useAlvaras } from "@/hooks/useAlvaras";
import { StatCard } from "@/components/StatCard";
import { useNavigate } from "react-router-dom";
import o2conLogo from '@/assets/o2contole-logo.png';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientes, isLoading: isLoadingClientes } = useClientes();
  const { alvaras, isLoading: isLoadingAlvaras } = useAlvaras();

  return (
    <div className="min-h-screen bg-background">

      {/* Header (same as Clientes/Alvarás pages, no action button) */}
      <header className="bg-card border-b sticky top-0 xl:top-0 z-10 xl:mt-0 mt-14 sm:mt-16">
        <div className="container px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-5 xl:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 lg:gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
              <img
                src={o2conLogo}
                alt="O2con Soluções Contábeis"
                className="h-7 sm:h-8 lg:h-9 xl:h-10 object-contain flex-shrink-0"
              />
              <div className="hidden sm:block h-6 sm:h-8 w-px bg-border flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-foreground truncate">Bem-vindo</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate">{user?.fullName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-5 lg:py-6 xl:py-8 space-y-4 sm:space-y-5 lg:space-y-6 w-full">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 xl:gap-8">
          {/* Total de Clientes */}
          <StatCard
            title="Total de Clientes"
            value={clientes.length}
            isLoading={isLoadingClientes}
            description="Clientes cadastrados no sistema"
            variant="default"
            onClick={() => navigate('/clientes')}
          />

          {/* Total de Alvarás */}
          <StatCard
            title="Total de Alvarás"
            value={alvaras.length}
            isLoading={isLoadingAlvaras}
            description="Alvarás em registro"
            variant="default"
            onClick={() => navigate('/alvaras')}
          />

          {/* Total de Certificados (Futura implementação) */}
          <StatCard
            title="Total de Certificados"
            value={0}
            isLoading={false}
            description="Será implementado em breve"
            variant="default"
            onClick={() => navigate('/certificados')}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
