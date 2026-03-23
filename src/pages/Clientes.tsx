import { useState, useMemo, useEffect } from 'react';
import { useClientes } from '@/hooks/useClientes';
import { useAlvaras } from '@/hooks/useAlvaras';
import { ClienteTable, TaxaPagaMap } from '@/components/ClienteTable';
import { taxaAPI } from '@/lib/api-client';
import { ClienteForm } from '@/components/ClienteForm';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, Filter, UserCheck, UserX } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import o2conLogo from '@/assets/logo-o2con.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const COLUNA_OPTIONS = [
  { value: 'sanitario', label: 'Sanitário' },
  { value: 'bombeiros', label: 'Bombeiros' },
  { value: 'funcionamento', label: 'Funcionamento' },
  { value: 'taxas', label: 'Taxas' },
] as const;

const OPCAO_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'vencendo', label: 'Vencendo' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'renovacao', label: 'Em Renovação' },
  { value: 'spf', label: 'SPF' },
  { value: 'isento', label: 'Isento' },
  { value: 'sem_status', label: 'Sem alvará' },
  { value: 'paga', label: 'Paga' },
] as const;

const ANO_ATUAL = new Date().getFullYear();

const ClientesPage = () => {
  const [activeTab, setActiveTab] = useState<'ativos' | 'inativos'>('ativos');
  const [filtroColuna, setFiltroColuna] = useState<string>('');
  const [filtroOpcao, setFiltroOpcao] = useState<string>('');
  const [taxasPaga, setTaxasPaga] = useState<TaxaPagaMap>({});

  const isFiltroTaxasPaga = (filtroColuna === 'funcionamento' || filtroColuna === 'taxas') && filtroOpcao === 'paga';
  const isFiltroRenovacao =
    (filtroColuna === 'sanitario' || filtroColuna === 'bombeiros' || filtroColuna === 'funcionamento') &&
    filtroOpcao === 'renovacao';
  const isFiltroClientSide = isFiltroTaxasPaga || isFiltroRenovacao;
  const { clientes, addCliente, updateCliente, deleteCliente, refetch } = useClientes({
    coluna: isFiltroClientSide ? undefined : (filtroColuna || undefined),
    opcao: isFiltroClientSide ? undefined : (filtroOpcao || undefined),
  });
  const { alvaras } = useAlvaras();
  // Atualiza a lista quando o modal global salva (ex.: inativar cliente)
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

  const filtroAtivo = !!(filtroColuna && filtroOpcao);

  const clientesPorTab = useMemo(() => {
    const clientesList = Array.isArray(clientes) ? clientes : [];
    const ativos = clientesList.filter((c) => c.ativo !== false);
    const inativos = clientesList.filter((c) => c.ativo === false);
    return { ativos, inativos };
  }, [clientes]);

  // Ocultar alvarás de clientes inativos
  const alvarasVisiveis = useMemo(() => {
    const inactiveIds = new Set(clientesPorTab.inativos.map((c) => c.id));
    return (Array.isArray(alvaras) ? alvaras : []).filter((a) => !inactiveIds.has(a.clienteId));
  }, [alvaras, clientesPorTab.inativos]);

  const filteredClientes = useMemo(() => {
    const clientesList = activeTab === 'ativos' ? clientesPorTab.ativos : clientesPorTab.inativos;
    const alvarasList = alvarasVisiveis;
    let base = clientesList;
    if (isFiltroTaxasPaga) {
      base = clientesList.filter((c) => taxasPaga[c.id]?.paga);
    } else if (isFiltroRenovacao) {
      const tiposPorColuna: Record<string, string[]> = {
        sanitario: ['Alvará Sanitário', 'Dispensa de Alvará Sanitário'],
        bombeiros: ['Alvará de Bombeiros'],
        funcionamento: ['Alvará de Funcionamento'],
      };
      const tipos = filtroColuna ? tiposPorColuna[filtroColuna] ?? [] : [];
      base = clientesList.filter((c) =>
        alvarasList.some(
          (a) =>
            a.clienteId === c.id &&
            tipos.includes(a.type) &&
            a.processingStatus === 'renovacao'
        )
      );
    }
    return base.filter((cliente) => {
      if (!cliente || !cliente.razaoSocial) return false;
      const searchLower = searchTerm.toLowerCase();
      const razaoSocialMatch = cliente.razaoSocial?.toLowerCase().includes(searchLower) ?? false;
      const cnpjMatch = cliente.cnpj?.includes(searchTerm) ?? false;
      const municipioMatch = cliente.municipio?.toLowerCase().includes(searchLower) ?? false;
      return razaoSocialMatch || cnpjMatch || municipioMatch;
    });
  }, [activeTab, clientesPorTab, alvarasVisiveis, searchTerm, isFiltroTaxasPaga, isFiltroRenovacao, taxasPaga, filtroColuna]);

  const handleAddCliente = async (data: ClienteFormData) => {
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, data);
        toast({
          title: 'Cliente atualizado',
          description: 'As alterações foram salvas com sucesso.',
        });
        // Dispara evento para atualizar listas em outras páginas (ex.: Alvaras, Dashboard)
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
      {/* Header */}
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
                <h1 className="text-sm sm:text-base lg:text-base xl:text-xl font-bold text-foreground truncate">Cadastro de Clientes</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gerencie os clientes cadastrados
                </p>
              </div>
            </div>
            <Button onClick={handleOpenForm} className="gap-2 w-full sm:w-auto text-xs sm:text-sm lg:text-base px-3 sm:px-4">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Novo Cliente</span>
              <span className="md:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-1 sm:px-1 lg:px-1 xl:px-8 py-4 sm:py-5 lg:py-4 xl:py-8 space-y-4 sm:space-y-5 lg:space-y-4 xl:space-y-6 w-full">
        {/* Tabs */}
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

        {/* Stats */}
        <div className="flex overflow-x-auto gap-3 sm:gap-4 lg:gap-5 pb-2">
          <div className="bg-card rounded-lg border p-3 sm:p-4 lg:p-5 flex items-center gap-3 flex-shrink-0 min-w-[200px] sm:min-w-0 sm:flex-1">
            <Users className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                {filtroAtivo ? `Clientes (${COLUNA_OPTIONS.find((c) => c.value === filtroColuna)?.label} - ${OPCAO_OPTIONS.find((o) => o.value === filtroOpcao)?.label})` : 'Total de Clientes'}
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
                        const tipos = filtroColuna ? tiposPorColuna[filtroColuna] ?? [] : [];
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

        {/* Search e Filtros */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={filtroColuna || 'todos'} onValueChange={(v) => setFiltroColuna(v === 'todos' ? '' : v)}>
                <SelectTrigger className="w-[140px] sm:w-[150px]">
                  <SelectValue placeholder="Coluna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {COLUNA_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroOpcao || 'todos'} onValueChange={(v) => setFiltroOpcao(v === 'todos' ? '' : v)}>
                <SelectTrigger className="w-[140px] sm:w-[150px]">
                  <SelectValue placeholder="Opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {OPCAO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(filtroColuna || filtroOpcao) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFiltroColuna('');
                    setFiltroOpcao('');
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
          <p>
            {filteredClientes.length} de{' '}
            {isFiltroTaxasPaga
              ? (activeTab === 'ativos' ? clientesPorTab.ativos : clientesPorTab.inativos).filter((c) => taxasPaga[c.id]?.paga).length
              : isFiltroRenovacao
                ? (activeTab === 'ativos' ? clientesPorTab.ativos : clientesPorTab.inativos).filter((c) => {
                    const tiposPorColuna: Record<string, string[]> = {
                      sanitario: ['Alvará Sanitário', 'Dispensa de Alvará Sanitário'],
                      bombeiros: ['Alvará de Bombeiros'],
                      funcionamento: ['Alvará de Funcionamento'],
                    };
                    const tipos = filtroColuna ? tiposPorColuna[filtroColuna] ?? [] : [];
                    return (Array.isArray(alvaras) ? alvaras : []).some(
                      (a) =>
                        a.clienteId === c.id &&
                        tipos.includes(a.type) &&
                        a.processingStatus === 'renovacao'
                    );
                  }).length
                : (activeTab === 'ativos' ? clientesPorTab.ativos : clientesPorTab.inativos).length}{' '}
            clientes
            {filtroAtivo && ` (${COLUNA_OPTIONS.find((c) => c.value === filtroColuna)?.label} - ${OPCAO_OPTIONS.find((o) => o.value === filtroOpcao)?.label})`}
          </p>
        </div>

        {/* Table */}
        <ClienteTable
          clientes={filteredClientes}
          alvaras={alvarasVisiveis}
          taxasPaga={taxasPaga}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
        </Tabs>
      </main>

      {/* Form Dialog */}
      <ClienteForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddCliente}
        editingCliente={editingCliente}
      />
      {/* Dialog de Confirmação de Exclusão de Cliente */}
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
    </div>
  );
};

export default ClientesPage;
