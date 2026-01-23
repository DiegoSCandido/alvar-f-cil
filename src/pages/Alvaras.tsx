import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAlvaras } from '@/hooks/useAlvaras';
import { useClientes } from '@/hooks/useClientes';
import { AlvaraTable } from '@/components/AlvaraTable';
import { AlvaraForm } from '@/components/AlvaraForm';
import { StatCard } from '@/components/StatCard';
import { Alvara, AlvaraFormData, AlvaraStatus } from '@/types/alvara';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import o2conLogo from '@/assets/o2contole-logo.png';


const AlvarasPage = () => {
  const { alvaras, stats, addAlvara, updateAlvara, deleteAlvara } = useAlvaras();
  const { clientes, getClienteById } = useClientes();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlvara, setEditingAlvara] = useState<Alvara | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AlvaraStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'novos' | 'funcionamento'>('funcionamento');
  const [finalizandoAlvara, setFinalizandoAlvara] = useState<Alvara | null>(null);
  const [finalizacaoDate, setFinalizacaoDate] = useState('');
  const [alvaraParaExcluir, setAlvaraParaExcluir] = useState<Alvara | null>(null);

  // Separar alvarás em duas categorias
  const { novosAlvaras, alvarasEmFuncionamento } = useMemo(() => {
    const novos = alvaras.filter((a) => !a.issueDate);
    const emFuncionamento = alvaras.filter((a) => a.issueDate);
    return { novosAlvaras: novos, alvarasEmFuncionamento: emFuncionamento };
  }, [alvaras]);

  // Estatísticas para novos alvarás
  const statsNovos = useMemo(() => {
    return {
      total: novosAlvaras.length,
      pending: novosAlvaras.filter((a) => a.status === 'pending').length,
    };
  }, [novosAlvaras]);

  // Estatísticas para alvarás em funcionamento
  const statsFuncionamento = useMemo(() => {
    return {
      total: alvarasEmFuncionamento.length,
      valid: alvarasEmFuncionamento.filter((a) => a.status === 'valid').length,
      expiring: alvarasEmFuncionamento.filter((a) => a.status === 'expiring').length,
      expired: alvarasEmFuncionamento.filter((a) => a.status === 'expired').length,
    };
  }, [alvarasEmFuncionamento]);

  // Filtrar alvarás baseado na aba ativa
  const filteredAlvaras = useMemo(() => {
    const alvarasToFilter = activeTab === 'novos' ? novosAlvaras : alvarasEmFuncionamento;
    
    return alvarasToFilter.filter((alvara) => {
      // Validar que alvara e suas propriedades existem
      if (!alvara || !alvara.clientName || !alvara.type) return false;

      const matchesSearch =
        alvara.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alvara.clientCnpj.includes(searchTerm) ||
        alvara.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || alvara.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeTab, novosAlvaras, alvarasEmFuncionamento, searchTerm, statusFilter]);

  const handleAddAlvara = async (data: AlvaraFormData) => {
    try {
      if (!data.clienteId) {
        toast({
          title: 'Cliente obrigatório',
          description: 'Selecione um cliente para continuar.',
          variant: 'destructive',
        });
        return;
      }

      if (!data.type) {
        toast({
          title: 'Tipo obrigatório',
          description: 'Selecione um tipo de alvará para continuar.',
          variant: 'destructive',
        });
        return;
      }

      if (editingAlvara) {
        const wasEmAbertura = !editingAlvara.issueDate;
        const isNowConcluido = !!data.issueDate;
        
        await updateAlvara(editingAlvara.id, data);
        
        if (wasEmAbertura && isNowConcluido) {
          setActiveTab('funcionamento');
          toast({
            title: 'Alvará concluído!',
            description: 'O alvará foi movido para a aba de alvarás em funcionamento.',
          });
        } else {
          toast({
            title: 'Alvará atualizado',
            description: 'As alterações foram salvas com sucesso.',
          });
        }
      } else {
        await addAlvara(data);
        toast({
          title: 'Alvará cadastrado',
          description: 'O novo alvará foi adicionado ao sistema.',
        });
      }
      setIsFormOpen(false);
      setEditingAlvara(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar alvará',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (alvara: Alvara) => {
    setEditingAlvara(alvara);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const alvara = alvaras.find((a) => a.id === id);
    if (alvara) setAlvaraParaExcluir(alvara);
  };

  const handleConfirmDelete = async () => {
    if (!alvaraParaExcluir) return;
    try {
      await deleteAlvara(alvaraParaExcluir.id);
      toast({
        title: 'Alvará removido',
        description: 'O alvará foi excluído do sistema.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao deletar alvará',
        variant: 'destructive',
      });
    } finally {
      setAlvaraParaExcluir(null);
    }
  };

  const handleOpenForm = () => {
    setEditingAlvara(null);
    setIsRenewing(false);
    setIsFormOpen(true);
  };

  const handleFinalize = (alvara: Alvara) => {
    setFinalizandoAlvara(alvara);
    setFinalizacaoDate('');
  };

  const handleRenew = (alvara: Alvara) => {
    // Abre o formulário de edição para renovar
    setEditingAlvara(alvara);
    setIsRenewing(true);
    setIsFormOpen(true);
  };

  const handleConfirmFinalize = async () => {
    if (!finalizandoAlvara || !finalizacaoDate) return;
    try {
      const expirationDate = new Date(finalizacaoDate);
      const issueDate = new Date();
      await updateAlvara(finalizandoAlvara.id, {
        ...finalizandoAlvara,
        issueDate,
        expirationDate,
      });
      setFinalizandoAlvara(null);
      setFinalizacaoDate('');
      setActiveTab('funcionamento');
      toast({
        title: 'Alvará finalizado',
        description: 'O alvará foi movido para Em Funcionamento.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao finalizar alvará',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <h1 className="text-base sm:text-lg font-bold text-foreground">Gestão de Alvarás</h1>
                <p className="text-xs text-muted-foreground">
                  Controle de documentos e vencimentos
                </p>
              </div>
            </div>
            <Button onClick={handleOpenForm} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Alvará</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 w-full">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'novos' | 'funcionamento')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 text-xs sm:text-base">
            <TabsTrigger value="funcionamento" className="gap-1 sm:gap-2">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Em Funcionamento</span>
              <span className="sm:hidden">Func.</span>
              {statsFuncionamento.total > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {statsFuncionamento.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="novos" className="gap-1 sm:gap-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Novos Alvarás</span>
              <span className="sm:hidden">Novos</span>
              {statsNovos.total > 0 && (
                <span className="ml-0.5 sm:ml-1 rounded-full bg-primary/10 px-1.5 sm:px-2 py-0.5 text-xs">
                  {statsNovos.total}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Novos Alvarás */}
          <TabsContent value="novos" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Stats Grid para Novos Alvarás */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4">
              <StatCard
                title="Total em Abertura"
                value={statsNovos.total}
                icon={FileText}
                variant="pending"
              />
              <StatCard
                title="Pendentes"
                value={statsNovos.pending}
                icon={Clock}
                variant="pending"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2 sm:gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alvará..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as AlvaraStatus | 'all')}
              >
                <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
              <p>
                {filteredAlvaras.length} de {novosAlvaras.length} alvarás em abertura
              </p>
              {statusFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Limpar filtro
                </Button>
              )}
            </div>

            {/* Table */}
            <AlvaraTable
              alvaras={filteredAlvaras}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onFinalize={handleFinalize}
            />
          </TabsContent>

          {/* Tab: Alvarás em Funcionamento */}
          <TabsContent value="funcionamento" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Stats Grid para Alvarás em Funcionamento */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              <StatCard
                title="Total"
                value={statsFuncionamento.total}
                icon={Building2}
                variant="valid"
              />
              <StatCard
                title="Válidos"
                value={statsFuncionamento.valid}
                icon={CheckCircle}
                variant="valid"
              />
              <StatCard
                title="Vencendo"
                value={statsFuncionamento.expiring}
                icon={AlertTriangle}
                variant="expiring"
              />
              <StatCard
                title="Vencidos"
                value={statsFuncionamento.expired}
                icon={XCircle}
                variant="expired"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2 sm:gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar alvará..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as AlvaraStatus | 'all')}
              >
                <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="valid">Válidos</SelectItem>
                  <SelectItem value="expiring">Vencendo</SelectItem>
                  <SelectItem value="expired">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
              <p>
                {filteredAlvaras.length} de {alvarasEmFuncionamento.length} alvarás em funcionamento
              </p>
              {statusFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Limpar filtro
                </Button>
              )}
            </div>

            {/* Table */}
            <AlvaraTable
              alvaras={filteredAlvaras}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onRenew={handleRenew}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Form Dialog */}
      <AlvaraForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingAlvara(null);
            setIsRenewing(false);
          }
        }}
        onSubmit={handleAddAlvara}
        editingAlvara={editingAlvara}
        clientes={clientes}
        isRenewing={isRenewing}
      />
      {/* Dialog de Finalização */}
      <Dialog open={!!finalizandoAlvara} onOpenChange={(open) => { if (!open) setFinalizandoAlvara(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Alvará</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Informe a data de vencimento para finalizar o alvará:</p>
            <input
              type="date"
              className="border rounded px-3 py-2 w-full"
              value={finalizacaoDate}
              onChange={e => setFinalizacaoDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizandoAlvara(null)}>Cancelar</Button>
            <Button onClick={handleConfirmFinalize} disabled={!finalizacaoDate}>Finalizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão de Alvará */}
      <Dialog open={!!alvaraParaExcluir} onOpenChange={(open) => { if (!open) setAlvaraParaExcluir(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Tem certeza que deseja excluir o alvará <b>{alvaraParaExcluir?.type}</b> do cliente <b>{alvaraParaExcluir?.clientName}</b>?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlvaraParaExcluir(null)}>Não</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Sim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlvarasPage;
