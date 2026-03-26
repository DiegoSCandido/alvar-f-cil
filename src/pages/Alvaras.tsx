import { useState, useMemo, useRef, useEffect } from 'react';
import { FinalizeAlvaraModal } from '@/components/FinalizeAlvaraModal';
import { useAlvaraUpload } from '@/hooks/useAlvaraUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAlvaras } from '@/hooks/useAlvaras';
import { useClientes } from '@/hooks/useClientes';
import { AlvaraTable } from '@/components/AlvaraTable';
import { AlvaraForm } from '@/components/AlvaraForm';
import { IntelligentUploadModal } from '@/components/IntelligentUploadModal';
import { StatCard } from '@/components/StatCard';
import { Alvara, AlvaraFormData, AlvaraStatus, ALVARA_TYPES } from '@/types/alvara';

// Array com os status disponíveis para o filtro
const STATUS_OPTIONS: AlvaraStatus[] = ['pending', 'valid', 'expiring', 'expired'];
const STATUS_LABELS: Record<AlvaraStatus, string> = {
  pending: 'Pendente',
  valid: 'Ativo',
  expiring: 'Vencendo',
  expired: 'Vencido',
};

// Opções especiais para filtro (Isento e SPF)
const SPECIAL_STATUS_OPTIONS = ['isento', 'semPontoFixo'];
const SPECIAL_STATUS_LABELS: Record<string, string> = {
  isento: 'Isento',
  semPontoFixo: 'SPF',
};
import { Button } from '@/components/ui/button';
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
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Building2,
  Sparkles,
  RotateCw,
  SlidersHorizontal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import o2conLogo from '@/assets/logo-o2con.png';
import { AlvarasFiltersModal } from '@/components/AlvarasFiltersModal';
import type { AlvarasFilterSnapshot } from '@/lib/alvaras-filter-templates';
import { Badge } from '@/components/ui/badge';

const DEFAULT_FILTERS_INITIAL: AlvarasFilterSnapshot = {
  activeTab: 'funcionamento',
  searchTerm: '',
  statusFilter: 'all',
  processingFilter: 'all',
  typeFilter: [],
  statusColumnFilter: [],
};

const AlvarasPage = () => {
  const { alvaras, stats, addAlvara, updateAlvara, deleteAlvara, refetch } = useAlvaras();
  const { clientes, getClienteById, refetch: refetchClientes } = useClientes();
  const { toast } = useToast();

  // Atualizar clientes quando modal salva (ex.: inativar) para refletir alvaras ocultos
  useEffect(() => {
    const handler = () => refetchClientes();
    window.addEventListener('clientes-updated', handler);
    return () => window.removeEventListener('clientes-updated', handler);
  }, [refetchClientes]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isIntelligentUploadOpen, setIsIntelligentUploadOpen] = useState(false);
  const [editingAlvara, setEditingAlvara] = useState<Alvara | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AlvaraStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string[]>([]); // Filtro por tipo de alvará
  const [statusColumnFilter, setStatusColumnFilter] = useState<string[]>([]); // Filtro por status na coluna (inclui isento e SPF)
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filtersInitial, setFiltersInitial] = useState<AlvarasFilterSnapshot>(DEFAULT_FILTERS_INITIAL);

  // Para destacar o StatCard ativo em funcionamento
  const handleStatCardClick = (status: AlvaraStatus | 'all') => {
    setStatusFilter((prev) => (prev === status ? 'all' : status));
  };
  const [activeTab, setActiveTab] = useState<'novos' | 'funcionamento' | 'renovacao'>('funcionamento');
  const [finalizandoAlvara, setFinalizandoAlvara] = useState<Alvara | null>(null);
  const [finalizacaoDate, setFinalizacaoDate] = useState('');
  const [alvaraParaExcluir, setAlvaraParaExcluir] = useState<Alvara | null>(null);

  // Upload PDF para finalização
  const [finalizeFile, setFinalizeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const finalizeFileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAlvaraDocument } = useAlvaraUpload();

  // Ocultar alvarás de clientes inativos
  const alvarasVisiveis = useMemo(() => {
    const inactiveIds = new Set(
      (clientes || []).filter((c) => c.ativo === false).map((c) => c.id)
    );
    return (alvaras || []).filter((a) => !inactiveIds.has(a.clienteId));
  }, [alvaras, clientes]);

  // Separar alvarás em categorias (apenas de clientes ativos)
  const { novosAlvaras, alvarasEmFuncionamento, alvarasRenovacao } = useMemo(() => {
    const novos = alvarasVisiveis.filter((a) => !a.issueDate && a.processingStatus !== 'renovacao');
    const emFuncionamento = alvarasVisiveis.filter((a) => a.issueDate);
    const renovacao = alvarasVisiveis.filter((a) => a.processingStatus === 'renovacao');
    return { novosAlvaras: novos, alvarasEmFuncionamento: emFuncionamento, alvarasRenovacao: renovacao };
  }, [alvarasVisiveis]);

  // Estatísticas para novos alvarás (por status de processamento)
  const statsNovos = useMemo(() => {
    const iniciado = novosAlvaras.filter((a) => a.processingStatus === 'lançado').length;
    const aguardandoCliente = novosAlvaras.filter((a) => a.processingStatus === 'aguardando_cliente').length;
    const aguardandoOrgao = novosAlvaras.filter((a) => a.processingStatus === 'aguardando_orgao').length;
    return {
      total: novosAlvaras.length,
      iniciado,
      aguardandoCliente,
      aguardandoOrgao,
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

  // Estatísticas para alvarás em renovação
  const statsRenovacao = useMemo(() => {
    return {
      total: alvarasRenovacao.length,
    };
  }, [alvarasRenovacao]);

  // Filtro de processamento para novos alvarás
  const [processingFilter, setProcessingFilter] = useState<'all' | 'lançado' | 'aguardando_cliente' | 'aguardando_orgao'>('all');

  // Garante que ao trocar de aba, o filtro correto é resetado
  // (evita bug de filtro travado ao alternar abas)
  useEffect(() => {
    if (activeTab === 'novos') setStatusFilter('all');
    if (activeTab === 'funcionamento') setProcessingFilter('all');
    if (activeTab === 'renovacao') {
      setStatusFilter('all');
      setProcessingFilter('all');
    }
    // Não resetamos o filtro de tipo ao trocar de aba, pois pode ser útil manter
  }, [activeTab]);

  // Filtrar e ordenar alvarás baseado na aba ativa e filtros
  const filteredAlvaras = useMemo(() => {
    let filtered: Alvara[] = [];
    
    if (activeTab === 'novos') {
      filtered = novosAlvaras.filter((alvara) => {
        if (!alvara || !alvara.clientName || !alvara.type) return false;
        const matchesSearch =
          alvara.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alvara.clientCnpj.includes(searchTerm) ||
          alvara.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesProcessing =
          processingFilter === 'all' || alvara.processingStatus === processingFilter;
        const matchesType =
          typeFilter.length === 0 || typeFilter.includes(alvara.type);
        const matchesStatusColumn =
          statusColumnFilter.length === 0 || 
          statusColumnFilter.some(filter => {
            if (filter === 'isento') return alvara.isento === true;
            if (filter === 'semPontoFixo') return alvara.semPontoFixo === true;
            return alvara.status === filter;
          });
        return matchesSearch && matchesProcessing && matchesType && matchesStatusColumn;
      });
      
      // Ordenar novos alvarás por data de criação (mais recentes primeiro)
      // Se algum tiver data de vencimento (caso raro), ordena por ela
      filtered.sort((a, b) => {
        // Se ambos têm data de vencimento, ordena por ela
        if (a.expirationDate && b.expirationDate) {
          const dateA = new Date(a.expirationDate).getTime();
          const dateB = new Date(b.expirationDate).getTime();
          return dateA - dateB;
        }
        // Caso contrário, ordena por data de criação (mais recentes primeiro)
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createdB - createdA; // Mais recentes primeiro
      });
    } else if (activeTab === 'renovacao') {
      filtered = alvarasRenovacao.filter((alvara) => {
        if (!alvara || !alvara.clientName || !alvara.type) return false;
        const matchesSearch =
          alvara.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alvara.clientCnpj.includes(searchTerm) ||
          alvara.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType =
          typeFilter.length === 0 || typeFilter.includes(alvara.type);
        const matchesStatusColumn =
          statusColumnFilter.length === 0 || 
          statusColumnFilter.some(filter => {
            if (filter === 'isento') return alvara.isento === true;
            if (filter === 'semPontoFixo') return alvara.semPontoFixo === true;
            return alvara.status === filter;
          });
        return matchesSearch && matchesType && matchesStatusColumn;
      });
      
      // Ordenar alvarás em renovação por data de vencimento (mais próximo primeiro)
      filtered.sort((a, b) => {
        // Alvarás sem data de vencimento vão para o final
        if (!a.expirationDate && !b.expirationDate) return 0;
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        
        const dateA = new Date(a.expirationDate).getTime();
        const dateB = new Date(b.expirationDate).getTime();
        return dateA - dateB;
      });
    } else {
      filtered = alvarasEmFuncionamento.filter((alvara) => {
        if (!alvara || !alvara.clientName || !alvara.type) return false;
        const matchesSearch =
          alvara.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alvara.clientCnpj.includes(searchTerm) ||
          alvara.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' || alvara.status === statusFilter;
        const matchesType =
          typeFilter.length === 0 || typeFilter.includes(alvara.type);
        const matchesStatusColumn =
          statusColumnFilter.length === 0 || 
          statusColumnFilter.some(filter => {
            if (filter === 'isento') return alvara.isento === true;
            if (filter === 'semPontoFixo') return alvara.semPontoFixo === true;
            return alvara.status === filter;
          });
        return matchesSearch && matchesStatus && matchesType && matchesStatusColumn;
      });
      
      // Ordenar por data de vencimento: mais próxima primeiro
      // Alvarás vencidos aparecem primeiro (mais vencidos primeiro)
      // Alvarás sem data de vencimento vão para o final
      filtered.sort((a, b) => {
        const now = Date.now();
        
        // Alvarás sem data de vencimento vão para o final
        if (!a.expirationDate && !b.expirationDate) return 0;
        if (!a.expirationDate) return 1; // a vai para o final
        if (!b.expirationDate) return -1; // b vai para o final
        
        // Compara as datas de vencimento
        const dateA = new Date(a.expirationDate).getTime();
        const dateB = new Date(b.expirationDate).getTime();
        
        // Ordena do mais próximo (menor data) para o mais distante (maior data)
        // Isso significa que vencidos (datas passadas) aparecem primeiro
        // e os que vencem mais cedo aparecem antes dos que vencem mais tarde
        return dateA - dateB;
      });
    }
    
    return filtered;
  }, [activeTab, novosAlvaras, alvarasEmFuncionamento, alvarasRenovacao, searchTerm, processingFilter, statusFilter, typeFilter, statusColumnFilter]);

  const filterBadgeCount = useMemo(() => {
    let n = 0;
    if (searchTerm.trim()) n += 1;
    if (typeFilter.length > 0) n += 1;
    if (statusColumnFilter.length > 0) n += 1;
    if (activeTab === 'novos' && processingFilter !== 'all') n += 1;
    if (activeTab === 'funcionamento' && statusFilter !== 'all') n += 1;
    return n;
  }, [searchTerm, typeFilter, statusColumnFilter, activeTab, processingFilter, statusFilter]);

  const openFiltersModal = () => {
    setFiltersInitial({
      activeTab,
      searchTerm,
      statusFilter,
      processingFilter,
      typeFilter: [...typeFilter],
      statusColumnFilter: [...statusColumnFilter],
    });
    setFilterModalOpen(true);
  };

  const applyFiltersSnapshot = (s: AlvarasFilterSnapshot) => {
    setActiveTab(s.activeTab);
    setSearchTerm(s.searchTerm);
    setStatusFilter(s.statusFilter);
    setProcessingFilter(s.processingFilter);
    setTypeFilter([...s.typeFilter]);
    setStatusColumnFilter([...s.statusColumnFilter]);
  };

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
        const isRenovacao = data.processingStatus === 'renovacao';
        const wasRenovacao = editingAlvara.processingStatus === 'renovacao';
        
        await updateAlvara(editingAlvara.id, data);
        
        if (wasEmAbertura && isNowConcluido) {
          setActiveTab('funcionamento');
          toast({
            title: 'Alvará concluído!',
            description: 'O alvará foi movido para a aba de alvarás em funcionamento.',
          });
        } else if (isRenovacao && !wasRenovacao) {
          // Se foi marcado para renovação, muda para a aba de renovação
          setActiveTab('renovacao');
          toast({
            title: 'Alvará em renovação',
            description: 'O alvará foi movido para a aba de renovação.',
          });
        } else if (!isRenovacao && wasRenovacao) {
          // Se foi removido da renovação, volta para a aba apropriada
          if (isNowConcluido) {
            setActiveTab('funcionamento');
          } else {
            setActiveTab('novos');
          }
          toast({
            title: 'Renovação finalizada',
            description: 'O alvará foi removido da aba de renovação.',
          });
        } else {
          toast({
            title: 'Alvará atualizado',
            description: 'As alterações foram salvas com sucesso.',
          });
        }
      } else {
        // Criar novo alvará
        const novoAlvara = await addAlvara(data);
        setIsFormOpen(false);
        setEditingAlvara(null);
        
        // Abrir modal de finalização automaticamente
        setFinalizandoAlvara(novoAlvara);
        setFinalizacaoDate('');
        setFinalizeFile(null);
        
        toast({
          title: 'Alvará cadastrado',
          description: 'Complete a finalização para mover o alvará para Em Funcionamento.',
        });
      }
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
    // Muda para a aba de renovação se ainda não estiver nela
    setActiveTab('renovacao');
  };

  const handleConfirmFinalize = async () => {
    if (!finalizandoAlvara) return;
    const isExempt = finalizandoAlvara.isento || finalizandoAlvara.semPontoFixo;
    
    // Se não for isento ou sem ponto fixo, valida campos obrigatórios
    if (!isExempt) {
      if (!finalizacaoDate) return;
      if (!finalizeFile) {
        toast({
          title: 'Documento obrigatório',
          description: 'Anexe o PDF do alvará para finalizar.',
          variant: 'destructive',
        });
        return;
      }
    }
    try {
      const expirationDate = finalizacaoDate ? new Date(finalizacaoDate) : undefined;
      const issueDate = new Date();
      await updateAlvara(finalizandoAlvara.id, {
        ...finalizandoAlvara,
        issueDate,
        expirationDate,
      });
      // Upload apenas se houver arquivo (não obrigatório para isento/sem ponto fixo)
      if (finalizeFile) {
        setUploading(true);
        try {
          await uploadAlvaraDocument(finalizandoAlvara.id, finalizeFile);
        } catch (uploadErr) {
          toast({
            title: 'Erro no upload',
            description: 'Erro ao enviar o PDF do alvará.',
            variant: 'destructive',
          });
          setUploading(false);
          return;
        }
        setUploading(false);
      }
      setFinalizandoAlvara(null);
      setFinalizacaoDate('');
      setFinalizeFile(null);
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
    <div className="min-h-screen">
      {/* Header */}
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
                <h1 className="truncate text-sm font-bold text-foreground sm:text-base">Gestão de Alvarás</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">Controle de documentos e vencimentos</p>
              </div>
            </div>
            <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:gap-3">
              <Button onClick={handleOpenForm} className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm lg:text-base px-3 sm:px-4">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Novo Alvará</span>
                <span className="md:hidden">Novo</span>
              </Button>
              <Button 
                onClick={() => setIsIntelligentUploadOpen(true)} 
                variant="outline"
                className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm lg:text-base px-3 sm:px-4"
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden md:inline">Upload Inteligente</span>
                <span className="md:hidden">IA</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container w-full min-w-0 space-y-4 px-3 py-4 sm:px-4 sm:space-y-5 sm:py-5 lg:space-y-4 lg:px-6 lg:py-4 xl:space-y-6 xl:px-8 xl:py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'novos' | 'funcionamento' | 'renovacao')}>
          <TabsList className="grid w-full max-w-md sm:max-w-lg lg:max-w-2xl grid-cols-3 text-xs sm:text-sm lg:text-base">
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
            <TabsTrigger value="renovacao" className="gap-1 sm:gap-2">
              <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Renovação</span>
              <span className="sm:hidden">Renov.</span>
              {statsRenovacao.total > 0 && (
                <span className="ml-0.5 sm:ml-1 rounded-full bg-primary/10 px-1.5 sm:px-2 py-0.5 text-xs">
                  {statsRenovacao.total}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6">
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
                  setTypeFilter([]);
                  setStatusColumnFilter([]);
                  setProcessingFilter('all');
                  setStatusFilter('all');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Tab: Novos Alvarás */}
          <TabsContent value="novos" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Cards de filtro para Novos Alvarás */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-2">
              <StatCard
                title="Todos"
                value={statsNovos.total}
                icon={FileText}
                variant={processingFilter === 'all' ? 'valid' : 'default'}
                onClick={() => setProcessingFilter('all')}
              />
              <StatCard
                title="Iniciado"
                value={statsNovos.iniciado}
                icon={CheckCircle}
                variant={processingFilter === 'lançado' ? 'valid' : 'default'}
                onClick={() => setProcessingFilter('lançado')}
              />
              <StatCard
                title="Aguardando Cliente"
                value={statsNovos.aguardandoCliente}
                icon={Clock}
                variant={processingFilter === 'aguardando_cliente' ? 'expiring' : 'default'}
                onClick={() => setProcessingFilter('aguardando_cliente')}
              />
              <StatCard
                title="Aguardando Órgão"
                value={statsNovos.aguardandoOrgao}
                icon={Building2}
                variant={processingFilter === 'aguardando_orgao' ? 'expired' : 'default'}
                onClick={() => setProcessingFilter('aguardando_orgao')}
              />
            </div>

            {/* Results info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
              <p>
                {filteredAlvaras.length} de {novosAlvaras.length} alvarás em abertura
              </p>
            </div>

            {/* Table */}
            <AlvaraTable
              alvaras={filteredAlvaras}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onFinalize={handleFinalize}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              availableTypes={ALVARA_TYPES}
              statusFilter={statusColumnFilter}
              onStatusFilterChange={setStatusColumnFilter}
              availableStatuses={[...STATUS_OPTIONS, ...SPECIAL_STATUS_OPTIONS]}
              statusLabels={{ ...STATUS_LABELS, ...SPECIAL_STATUS_LABELS }}
            />
          </TabsContent>

          {/* Tab: Alvarás em Funcionamento */}
          <TabsContent value="funcionamento" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Stats Grid para Alvarás em Funcionamento */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
              <StatCard
                title="Total"
                value={statsFuncionamento.total}
                icon={Building2}
                variant={statusFilter === 'all' ? 'valid' : 'default'}
                onClick={() => handleStatCardClick('all')}
              />
              <StatCard
                title="Válidos"
                value={statsFuncionamento.valid}
                icon={CheckCircle}
                variant={statusFilter === 'valid' ? 'valid' : 'default'}
                onClick={() => handleStatCardClick('valid')}
              />
              <StatCard
                title="Vencendo"
                value={statsFuncionamento.expiring}
                icon={AlertTriangle}
                variant={statusFilter === 'expiring' ? 'expiring' : 'default'}
                onClick={() => handleStatCardClick('expiring')}
              />
              <StatCard
                title="Vencidos"
                value={statsFuncionamento.expired}
                icon={XCircle}
                variant={statusFilter === 'expired' ? 'expired' : 'default'}
                onClick={() => handleStatCardClick('expired')}
              />
            </div>

            {/* Results info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
              <p>
                {filteredAlvaras.length} de {alvarasEmFuncionamento.length} alvarás em funcionamento
              </p>
            </div>

            {/* Table */}
            <AlvaraTable
              alvaras={filteredAlvaras}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onRenew={handleRenew}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              availableTypes={ALVARA_TYPES}
              statusFilter={statusColumnFilter}
              onStatusFilterChange={setStatusColumnFilter}
              availableStatuses={[...STATUS_OPTIONS, ...SPECIAL_STATUS_OPTIONS]}
              statusLabels={{ ...STATUS_LABELS, ...SPECIAL_STATUS_LABELS }}
            />
          </TabsContent>

          {/* Tab: Renovação */}
          <TabsContent value="renovacao" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Stats Card para Renovação */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 xl:gap-6">
              <StatCard
                title="Total em Renovação"
                value={statsRenovacao.total}
                icon={RotateCw}
                variant="default"
              />
            </div>

            {/* Results info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
              <p>
                {filteredAlvaras.length} de {alvarasRenovacao.length} alvarás em renovação
              </p>
            </div>

            {/* Table */}
            <AlvaraTable
              alvaras={filteredAlvaras}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onRenew={handleRenew}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              availableTypes={ALVARA_TYPES}
              statusFilter={statusColumnFilter}
              onStatusFilterChange={setStatusColumnFilter}
              availableStatuses={[...STATUS_OPTIONS, ...SPECIAL_STATUS_OPTIONS]}
              statusLabels={{ ...STATUS_LABELS, ...SPECIAL_STATUS_LABELS }}
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
        clientes={(clientes || []).filter((c) => c.ativo !== false)}
        isRenewing={isRenewing}
      />
      {/* Dialog de Finalização */}
      <FinalizeAlvaraModal
        open={!!finalizandoAlvara}
        onOpenChange={(open) => {
          if (!open) {
            // Se fechar sem finalizar, garantir que está na aba "Novos Alvarás"
            if (finalizandoAlvara && !finalizandoAlvara.issueDate) {
              setActiveTab('novos');
            }
            setFinalizandoAlvara(null);
          }
        }}
        isento={finalizandoAlvara?.isento}
        semPontoFixo={finalizandoAlvara?.semPontoFixo}
        onFinalize={async ({ expirationDate, file }) => {
          if (!finalizandoAlvara) return;
          const isExempt = finalizandoAlvara.isento || finalizandoAlvara.semPontoFixo;
          
          // Se não for isento ou sem ponto fixo, valida campos obrigatórios
          if (!isExempt && (!expirationDate || !file)) return;
          try {
            const issueDate = new Date();
            await updateAlvara(finalizandoAlvara.id, {
              ...finalizandoAlvara,
              issueDate,
              expirationDate,
            });
            // Upload apenas se houver arquivo (não obrigatório para isento/sem ponto fixo)
            if (file) {
              setUploading(true);
              try {
                await uploadAlvaraDocument(finalizandoAlvara.id, file);
              } catch (uploadErr) {
                toast({
                  title: 'Erro no upload',
                  description: 'Erro ao enviar o PDF do alvará.',
                  variant: 'destructive',
                });
                setUploading(false);
                return;
              }
              setUploading(false);
            }
            setFinalizandoAlvara(null);
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
        }}
      />

      {/* Dialog de Confirmação de Exclusão de Alvará */}
      <Dialog open={!!alvaraParaExcluir} onOpenChange={(open) => { if (!open) setAlvaraParaExcluir(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
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

      {/* Modal de Upload Inteligente */}
      <IntelligentUploadModal
        open={isIntelligentUploadOpen}
        onOpenChange={setIsIntelligentUploadOpen}
        onSuccess={() => {
          refetch();
          toast({
            title: 'Alvará criado com sucesso!',
            description: 'O alvará foi criado automaticamente a partir do PDF.',
          });
        }}
      />

      <AlvarasFiltersModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        initial={filtersInitial}
        onApply={applyFiltersSnapshot}
        availableTypes={ALVARA_TYPES}
        statusColumnOptions={[...STATUS_OPTIONS, ...SPECIAL_STATUS_OPTIONS]}
        statusColumnLabels={{ ...STATUS_LABELS, ...SPECIAL_STATUS_LABELS }}
      />
    </div>
  );
};

export default AlvarasPage;
