import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientes } from "@/hooks/useClientes";
import { useAlvaras } from "@/hooks/useAlvaras";
import { StatCard } from "@/components/StatCard";
import { useNavigate } from "react-router-dom";
import o2conLogo from '@/assets/logo-o2con.png';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientes, isLoading: isLoadingClientes, refetch: refetchClientes } = useClientes();
  const { alvaras, isLoading: isLoadingAlvaras } = useAlvaras();

  // Atualizar clientes em tempo real quando inativar/ativar (para refletir contagem de alvarás)
  useEffect(() => {
    const handler = () => refetchClientes();
    window.addEventListener('clientes-updated', handler);
    return () => window.removeEventListener('clientes-updated', handler);
  }, [refetchClientes]);

  // Ocultar alvarás de clientes inativos na contagem
  const alvarasVisiveis = (alvaras || []).filter((a) => {
    const cliente = clientes.find((c) => c.id === a.clienteId);
    return !cliente || cliente.ativo !== false;
  });

  return (
    <div className="min-h-screen">

      {/* Header (same as Clientes/Alvarás pages, no action button) */}
      <header className="sticky top-0 z-10 mt-14 border-b border-border bg-card sm:mt-16 lg:mt-0 lg:flex lg:h-16 lg:items-center xl:top-0">
        <div className="container flex w-full min-w-0 flex-col justify-center px-3 py-3 sm:px-4 sm:py-4 lg:h-full lg:min-h-0 lg:flex-row lg:items-center lg:px-6 lg:py-0 xl:px-8">
          <div className="flex w-full flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-4">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 lg:gap-3">
              <img
                src={o2conLogo}
                alt="O2con Soluções Contábeis"
                className="h-7 shrink-0 object-contain sm:h-8 lg:h-8"
              />
              <div className="hidden h-8 w-px shrink-0 bg-border sm:block" aria-hidden />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-bold text-foreground sm:text-base">Bem-vindo</h1>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{user?.fullName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container w-full min-w-0 space-y-4 px-3 py-4 sm:px-4 sm:space-y-5 sm:py-5 lg:space-y-4 lg:px-6 lg:py-4 xl:space-y-6 xl:px-8 xl:py-8">
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

          {/* Total de Alvarás (apenas de clientes ativos) */}
          <StatCard
            title="Total de Alvarás"
            value={alvarasVisiveis.length}
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
