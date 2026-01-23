import { useAuth } from "@/contexts/AuthContext";
import { useClientes } from "@/hooks/useClientes";
import { useAlvaras } from "@/hooks/useAlvaras";
import { StatCard } from "@/components/StatCard";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientes, isLoading: isLoadingClientes } = useClientes();
  const { alvaras, isLoading: isLoadingAlvaras } = useAlvaras();

  return (
    <div className="min-h-screen w-full bg-background px-4">
      <div className="mx-auto max-w-5xl py-8 md:py-12">
        {/* Top spacing for mobile */}
        <div className="mt-20 lg:mt-0" />

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Bem-vindo
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {user?.fullName}
          </p>
        </div>

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
      </div>
    </div>
  );
};

export default Dashboard;
