import { useState, useMemo, useEffect } from 'react';
import { useClientes } from '@/hooks/useClientes';
import { useAlvaras } from '@/hooks/useAlvaras';
import { ClienteTable, TaxaPagaMap } from '@/components/ClienteTable';
import { taxaAPI } from '@/lib/api-client';
import { ClienteForm } from '@/components/ClienteForm';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, UserCheck, UserX, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import o2conLogo from '@/assets/logo-o2con.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientesFiltersModal } from '@/components/ClientesFiltersModal';
import {
  type ClientesFilterSnapshot,
  CLIENTES_COLUNA_OPTIONS,
  CLIENTES_OPCAO_OPTIONS,
  CLIENTES_NIVEL3_OPTIONS,
  buildApiPair,
  isClientSidePair,
} from '@/lib/clientes-filters';
import { clienteMatchesNivel3Refinamento } from '@/lib/clientes-nivel3';
import { Badge } from '@/components/ui/badge';

const ANO_ATUAL = new Date().getFullYear();

const DEFAULT_FILTERS_INITIAL: ClientesFilterSnapshot = {
  activeTab: 'ativos',
  searchTerm: '',
  nivel1Coluna: '',
  nivel2Opcao: '',
  nivel3Refinamento: [],
};

const ClientesPage = () => {
  const [activeTab, setActiveTab] = useState<'ativos' | 'inativos'>('ativos');
  const [nivel1Coluna, setNivel1Coluna] = useState('');
  const [nivel2Opcao, setNivel2Opcao] = useState('');
  const [nivel3Refinamento, setNivel3Refinamento] = useState<string[]>([]);
  const [taxasPaga, setTaxasPaga] = useState<TaxaPagaMap>({});

  const apiPair = useMemo(
    () => buildApiPair({ nivel1Coluna, nivel2Opcao }),
    [nivel1Coluna, nivel2Opcao]
  );

  const isFiltroTaxasPaga =
    !!apiPair &&
    (apiPair.coluna === 'funcionamento' || apiPair.coluna === 'taxas') &&
    apiPair.opcao === 'paga';
  const isFiltroRenovacao =
    !!apiPair &&
    (apiPair.coluna === 'sanitario' ||
      apiPair.coluna === 'bombeiros' ||
      apiPair.coluna === 'funcionamento') &&
    apiPair.opcao === 'renovacao';

  const useClientesOpts = useMemo(() => {
    if (!apiPair) return {};
    if (!isClientSidePair(apiPair)) {
      return { coluna: apiPair.coluna, opcao: apiPair.opcao };
    }
    return {};
  }, [apiPair]);

  const { clientes, addCliente, updateCliente, deleteCliente, refetch } = useClientes(useClientesOpts);
  const { alvaras } = useAlvaras();

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('clientes-updated', handler);
    return () => window.removeEventListener('clientes-updated', handler);
  }, [refetch]);

  useEffect(() => {
    async function loadTaxas() {
      try {
        const taxasRes = await taxaAPI.list(ANO_ATUAL);
        const map: TaxaPagaMap = {};
        if (Array.isArray(taxasRes)) {
          taxasRes.forEach((t: { clienteId: string; paga: boolean }) => {
            map[t.clienteId] = { paga: !!t.paga };
          });
        }
        setTaxasPaga(map);
      } catch {
        setTaxasPaga({});
      }
    }
    loadTaxas();
  }, []);
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filtersInitial, setFiltersInitial] = useState<ClientesFilterSnapshot>(DEFAULT_FILTERS_INITIAL);

  const inactiveClienteIds = useMemo(() => {
    const list = Array.isArray(clientes) ? clientes : [];
    return new Set(list.filter((c) => c.ativo === false).map((c) => c.id));
  }, [clientes]);

  const alvarasVisiveis = useMemo(() => {
    return (Array.isArray(alvaras) ? alvaras : []).filter((a) => !inactiveClienteIds.has(a.clienteId));
  }, [alvaras, inactiveClienteIds]);

  const rawClientes = clientes;

  const filtroAtivo =
    !!(nivel1Coluna && nivel2Opcao) || nivel3Refinamento.length > 0;

  const filtroResumoLabel = useMemo(() => {
    const parts: string[] = [];
    if (nivel1Coluna && nivel2Opcao) {
      const c = CLIENTES_COLUNA_OPTIONS.find((x) => x.value === nivel1Coluna)?.label;
      const o = CLIENTES_OPCAO_OPTIONS.find((x) => x.value === nivel2Opcao)?.label;
      parts.push(`${c ?? nivel1Coluna} → ${o ?? nivel2Opcao}`);
    }
    if (nivel3Refinamento.length > 0) {
      const labels = nivel3Refinamento
        .map((v) => CLIENTES_NIVEL3_OPTIONS.find((x) => x.value === v)?.label ?? v)
        .join(', ');
      parts.push(`Refino: ${labels}`);
    }
    return parts.join(' · ');
  }, [nivel1Coluna, nivel2Opcao, nivel3Refinamento]);

  const filterBadgeCount = useMemo(() => {
    let n = 0;
    if (searchTerm.trim()) n += 1;
    if (nivel1Coluna && nivel2Opcao) n += 1;
    if (nivel3Refinamento.length > 0) n += 1;
    return n;
  }, [searchTerm, nivel1Coluna, nivel2Opcao, nivel3Refinamento]);

  const openFiltersModal = () => {
    setFiltersInitial({
      activeTab,
      searchTerm,
      nivel1Coluna,
      nivel2Opcao,
      nivel3Refinamento: [...nivel3Refinamento],
    });
    setFilterModalOpen(true);
  };

  const applyFiltersSnapshot = (s: ClientesFilterSnapshot) => {
    setActiveTab(s.activeTab);
    setSearchTerm(s.searchTerm);
    setNivel1Coluna(s.nivel1Coluna);
    setNivel2Opcao(s.nivel2Opcao);
    setNivel3Refinamento([...s.nivel3Refinamento]);
  };

  const clientesPorTab = useMemo(() => {
    const clientesList = Array.isArray(rawClientes) ? rawClientes : [];
    const ativos = clientesList.filter((c) => c.ativo !== false);
    const inativos = clientesList.filter((c) => c.ativo === false);
    return { ativos, inativos };
  }, [rawClientes]);

  const clientesAfterCamadasSemBusca = useMemo(() => {
    const clientesList = activeTab === 'ativos' ? clientesPorTab.ativos : clientesPorTab.inativos;
    const alvarasList = alvarasVisiveis;
    let base = clientesList;

    if (isFiltroTaxasPaga) {
      base = clientesList.filter((c) => taxasPaga[c.id]?.paga);
    } else if (isFiltroRenovacao && apiPair) {
      const tiposPorColuna: Record<string, string[]> = {
        sanitario: ['Alvará Sanitário', 'Dispensa de Alvará Sanitário'],
        bombeiros: ['Alvará de Bombeiros'],
        funcionamento: ['Alvará de Funcionamento'],
      };
      const col = apiPair.coluna;
      const tipos = tiposPorColuna[col] ?? [];
      base = clientesList.filter((c) =>
        alvarasList.some(
          (a) =>
            a.clienteId === c.id &&
            tipos.includes(a.type) &&
            a.processingStatus === 'renovacao'
        )
      );
    }

    if (nivel3Refinamento.length > 0) {
      base = base.filter((c) =>
        clienteMatchesNivel3Refinamento(
          c.id,
          nivel3Refinamento,
          alvarasList,
          nivel1Coluna || undefined
        )
      );
    }

    return base;
  }, [
    activeTab,
    clientesPorTab,
    alvarasVisiveis,
    isFiltroTaxasPaga,
    isFiltroRenovacao,
    taxasPaga,
    apiPair,
    nivel3Refinamento,
    nivel1Coluna,
  ]);

  const filteredClientes = useMemo(() => {
    return clientesAfterCamadasSemBusca.filter((cliente) => {
      if (!cliente || !cliente.razaoSocial) return false;
      const searchLower = searchTerm.toLowerCase();
      const razaoSocialMatch = cliente.razaoSocial?.toLowerCase().includes(searchLower) ?? false;
      const cnpjMatch = cliente.cnpj?.includes(searchTerm) ?? false;
      const municipioMatch = cliente.municipio?.toLowerCase().includes(searchLower) ?? false;
      return razaoSocialMatch || cnpjMatch || municipioMatch;
    });
  }, [clientesAfterCamadasSemBusca, searchTerm]);

  const handleAddCliente = async (data: ClienteFormData) => {
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, data);
        toast({
          title: 'Cliente atualizado',
          description: 'As alterações foram salvas com sucesso.',
        });
        window.dispatchEvent(new CustomEvent('clientes-updated'));
      } else {
        await addCliente(data);
        toast({
          title: 'Cliente cadastrado',
          description: 'O novo cliente foi adicionado ao sistema.',
        });
      }
      setIsFormOpen(false);
      setEditingCliente(null);
      if (editingCliente && data.ativo === false) {
        setActiveTab('inativos');
      } else if (editingCliente && data.ativo !== false) {
        setActiveTab('ativos');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar cliente',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const cliente = (Array.isArray(clientes) ? clientes : []).find((c) => c.id === id);
    if (cliente) setClienteParaExcluir(cliente);
  };

  const handleConfirmDelete = async () => {
    if (!clienteParaExcluir) return;
    try {
      await deleteCliente(clienteParaExcluir.id);
      toast({
        title: 'Cliente removido',
        description: 'O cliente foi excluído do sistema.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao deletar cliente',
        variant: 'destructive',
      });
    } finally {
      setClienteParaExcluir(null);
    }
  };

  const handleOpenForm = () => {
    setEditingCliente(null);
    setIsFormOpen(true);
  };

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
                <h1 className="truncate text-sm font-bold text-foreground sm:text-base">Cadastro de Clientes</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">Gerencie os clientes cadastrados</p>
              </div>
            </div>
            <Button onClick={handleOpenForm} className="gap-2 w-full sm:w-auto text-xs sm:text-sm lg:text-base px-3 sm:px-4 shrink-0">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Novo Cliente</span>
              <span className="md:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container w-full min-w-0 space-y-4 px-3 py-4 sm:px-4 sm:space-y-5 sm:py-5 lg:space-y-4 lg:px-6 lg:py-4 xl:space-y-6 xl:px-8 xl:py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ativos' | 'inativos')}>
          <TabsList className="grid w-full max-w-md sm:max-w-lg grid-cols-2 text-xs sm:text-sm lg:text-base">
            <TabsTrigger value="ativos" className="gap-1 sm:gap-2">
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
              Ativos
              {clientesPorTab.ativos.length > 0 && (
                <span className="ml-0.5 sm:ml-1 rounded-full bg-primary/10 px-1.5 sm:px-2 py-0.5 text-xs">
                  {clientesPorTab.ativos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="inativos" className="gap-1 sm:gap-2">
              <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
              Inativos
              {clientesPorTab.inativos.length > 0 && (
                <span className="ml-0.5 sm:ml-1 rounded-full bg-muted px-1.5 sm:px-2 py-0.5 text-xs">
                  {clientesPorTab.inativos.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome do cliente, CNPJ ou município..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-full border-border/80 bg-background"
                onClick={openFiltersModal}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {filterBadgeCount > 0 && (
                  <Badge variant="secondary" className="rounded-full px-2">
                    {filterBadgeCount}
                  </Badge>
                )}
              </Button>
              {filterBadgeCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    setSearchTerm('');
                    setNivel1Coluna('');
                    setNivel2Opcao('');
                    setNivel3Refinamento([]);
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

        <div className="flex overflow-x-auto gap-3 sm:gap-4 lg:gap-5 pb-2">
          <div className="bg-card rounded-lg border p-3 sm:p-4 lg:p-5 flex items-center gap-3 flex-shrink-0 min-w-[200px] sm:min-w-0 sm:flex-1">
            <Users className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                {filtroAtivo ? `Clientes (${filtroResumoLabel})` : 'Total de Clientes'}
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {isFiltroTaxasPaga
                  ? (activeTab === 'ativos' ? clientesPorTab.ativos : clientesPorTab.inativos).filter((c) => taxasPaga[c.id]?.paga).length
                  : isFiltroRenovacao
                    ? (activeTab === 'ativos' ? clientesPorTab.ativos : clientesPorTab.inativos).filter((c) => {
                        const tiposPorColuna: Record<string, string[]> = {
                          sanitario: ['Alvará Sanitário', 'Dispensa de Alvará Sanitário'],
                          bombeiros: ['Alvará de Bombeiros'],
                          funcionamento: ['Alvará de Funcionamento'],
                        };
                        const col = apiPair?.coluna;
                        const tipos = col ? tiposPorColuna[col] ?? [] : [];
                        return (Array.isArray(alvaras) ? alvaras : []).some(
                          (a) =>
                            a.clienteId === c.id &&
                            tipos.includes(a.type) &&
                            a.processingStatus === 'renovacao'
                        );
                      }).length
                    : (activeTab === 'ativos' ? clientesPorTab.ativos : clientesPorTab.inativos).length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
          <p>
            {filteredClientes.length} de {clientesAfterCamadasSemBusca.length} clientes
            {filtroAtivo && ` (${filtroResumoLabel})`}
          </p>
        </div>

        <ClienteTable
          clientes={filteredClientes}
          alvaras={alvarasVisiveis}
          taxasPaga={taxasPaga}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
        </Tabs>
      </main>

      <ClienteForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddCliente}
        editingCliente={editingCliente}
      />
      <Dialog open={!!clienteParaExcluir} onOpenChange={(open) => { if (!open) setClienteParaExcluir(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Tem certeza que deseja excluir o cliente <b>{clienteParaExcluir?.razaoSocial}</b>?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClienteParaExcluir(null)}>Não</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Sim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientesFiltersModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        initial={filtersInitial}
        onApply={applyFiltersSnapshot}
      />
    </div>
  );
};

export default ClientesPage;
