import TaxaFuncionamentoTable from '../components/TaxaFuncionamentoTable';
import o2conLogo from '@/assets/logo-o2con.png';

export default function TaxasPage() {
  return (
    <div className="min-h-screen">
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
                <h1 className="truncate text-sm font-bold text-foreground sm:text-base">Taxas de Funcionamento</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">Controle de taxas anuais</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container w-full min-w-0 px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-4 xl:px-8 xl:py-8">
        <TaxaFuncionamentoTable />
      </main>
    </div>
  );
}
