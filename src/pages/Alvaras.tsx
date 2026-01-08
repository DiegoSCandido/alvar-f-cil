import { useState, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AlvaraStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'novos' | 'funcionamento'>('novos');

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
      const matchesSearch =
        alvara.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alvara.clientCnpj.includes(searchTerm) ||
        alvara.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || alvara.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activeTab, novosAlvaras, alvarasEmFuncionamento, searchTerm, statusFilter]);

  const handleAddAlvara = (data: AlvaraFormData) => {
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
      
      updateAlvara(editingAlvara.id, data, getClienteById);
      
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
      addAlvara(data, getClienteById);
      toast({
        title: 'Alvará cadastrado',
        description: 'O novo alvará foi adicionado ao sistema.',
      });
    }
    setIsFormOpen(false);
    setEditingAlvara(null);
  };

  const handleEdit = (alvara: Alvara) => {
    setEditingAlvara(alvara);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteAlvara(id);
    toast({
      title: 'Alvará removido',
      description: 'O alvará foi excluído do sistema.',
      variant: 'destructive',
    });
  };

  const handleOpenForm = () => {
    setEditingAlvara(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
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
            <Button onClick={handleOpenForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Alvará
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6 pl-72">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'novos' | 'funcionamento')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="novos" className="gap-2">
              <FileText className="h-4 w-4" />
              Novos Alvarás
              {statsNovos.total > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {statsNovos.total}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="funcionamento" className="gap-2">
              <Building2 className="h-4 w-4" />
              Em Funcionamento
              {statsFuncionamento.total > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {statsFuncionamento.total}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Novos Alvarás */}
          <TabsContent value="novos" className="space-y-6 mt-6">
            {/* Stats Grid para Novos Alvarás */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, CNPJ ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as AlvaraStatus | 'all')}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
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
              showIssueDate={false}
            />
          </TabsContent>

          {/* Tab: Alvarás em Funcionamento */}
          <TabsContent value="funcionamento" className="space-y-6 mt-6">
            {/* Stats Grid para Alvarás em Funcionamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, CNPJ ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as AlvaraStatus | 'all')}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
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
            <div className="flex items-center justify-between text-sm text-muted-foreground">
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
              showIssueDate={true}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Form Dialog */}
      <AlvaraForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddAlvara}
        editingAlvara={editingAlvara}
        clientes={clientes}
      />
    </div>
  );
};

export default AlvarasPage;
