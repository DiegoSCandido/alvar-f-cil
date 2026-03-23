import TaxaFuncionamentoTable from '../components/TaxaFuncionamentoTable';
import o2conLogo from '@/assets/logo-o2con.png';

export default function TaxasPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-card border-b sticky top-0 xl:top-0 z-10 xl:mt-0 mt-14 sm:mt-16">
        <div className="container px-1 sm:px-1 lg:px-1 xl:px-8 py-3 sm:py-4 lg:py-4 xl:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 lg:gap-4 xl:gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 lg:gap-3 xl:gap-4 flex-1 min-w-0">
              <img
                src={o2conLogo}
                alt="O2con Soluções Contábeis"
                className="h-7 sm:h-8 lg:h-8 xl:h-10 object-contain flex-shrink-0"
              />
              <div className="hidden sm:block h-6 sm:h-8 w-px bg-border flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base lg:text-base xl:text-xl font-bold text-foreground truncate">
                  Taxas de Funcionamento
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Controle de taxas anuais
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container px-1 sm:px-1 lg:px-1 xl:px-8 py-4 sm:py-5 lg:py-4 xl:py-8">
        <TaxaFuncionamentoTable />
      </main>
    </div>
  );
}
