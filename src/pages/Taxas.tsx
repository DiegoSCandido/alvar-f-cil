import TaxaFuncionamentoTable from '../components/TaxaFuncionamentoTable';

export default function TaxasPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 xl:top-0 z-10 xl:mt-0 mt-14 sm:mt-16">
        <div className="container px-2 sm:px-2 lg:px-2 xl:px-8 py-3 sm:py-4 lg:py-4 xl:py-6">
          <h1 className="text-sm sm:text-base lg:text-base xl:text-xl font-bold text-foreground">Taxas de Funcionamento</h1>
        </div>
      </header>
      <main className="container px-2 sm:px-2 lg:px-2 xl:px-8 py-4 sm:py-5 lg:py-4 xl:py-8">
        <TaxaFuncionamentoTable />
      </main>
    </div>
  );
}
