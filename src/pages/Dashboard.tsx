import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 sm:p-8 md:p-10">
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

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Cards - Você pode adicionar conteúdo depois */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Seção 1
          </h2>
          <p className="text-muted-foreground text-sm">
            Conteúdo será adicionado em breve...
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Seção 2
          </h2>
          <p className="text-muted-foreground text-sm">
            Conteúdo será adicionado em breve...
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Seção 3
          </h2>
          <p className="text-muted-foreground text-sm">
            Conteúdo será adicionado em breve...
          </p>
        </div>
      </div>

      {/* Opção futura de links rapidos */}
    </div>
  );
};

export default Dashboard;
