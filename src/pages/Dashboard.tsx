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
      <header className="bg-card border-b sticky top-0 lg:top-0 z-10 lg:mt-0 mt-16">
        <div className="container px-4 py-3 sm:py-4 lg:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 flex-1">
              <img
                src={o2conLogo}
                alt="O2con Soluções Contábeis"
                className="h-8 sm:h-10 object-contain"
              />
              <div className="hidden sm:block h-8 w-px bg-border" />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-foreground">Bem-vindo</h1>
                <p className="text-xs text-muted-foreground">{user?.fullName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 w-full">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
