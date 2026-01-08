import o2conLogo from '@/assets/o2contole-logo.png';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <img 
              src={o2conLogo}
              alt="O2con Soluções Contábeis" 
              className="h-10 object-contain"
            />
            <div className="h-8 w-px bg-border" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Gestão de Alvarás</h1>
              <p className="text-xs text-muted-foreground">
                Controle de documentos e vencimentos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6 pl-72">
        {/* Página inicial limpa */}
      </main>
    </div>
  );
};

export default Index;
