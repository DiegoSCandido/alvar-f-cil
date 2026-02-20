import { useState, useMemo, Fragment } from 'react';
import { Alvara } from '@/types/alvara';
import { StatusBadge } from './StatusBadge';
import { getDaysUntilExpiration, formatCnpj, formatDateSafe } from '@/lib/alvara-utils';
import { Trash2, Edit, CheckCircle, RotateCw, Download, Eye, EyeOff, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useDocumentosAlvaraDownload } from '@/hooks/useDocumentosAlvaraDownload';
import { useClientes } from '@/hooks/useClientes';
import { useClienteModal } from '@/contexts/ClienteModalContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { TableColumnFilter } from './TableColumnFilter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type SortColumn = 'clientName' | 'cnpj' | 'type' | 'expirationDate' | 'daysUntilExpiration' | 'status' | null;
type SortDirection = 'asc' | 'desc';

interface AlvaraTableProps {
  alvaras: Alvara[];
  onDelete: (id: string) => void;
  onEdit: (alvara: Alvara) => void;
  onFinalize?: (alvara: Alvara) => void;
  onRenew?: (alvara: Alvara) => void;
  typeFilter?: string[];
  onTypeFilterChange?: (values: string[]) => void;
  availableTypes?: string[];
  statusFilter?: string[];
  onStatusFilterChange?: (values: string[]) => void;
  availableStatuses?: string[];
  statusLabels?: Record<string, string>;
}

// Função para truncar texto
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export function AlvaraTable({ 
  alvaras, 
  onDelete, 
  onEdit, 
  onFinalize, 
  onRenew,
  typeFilter = [],
  onTypeFilterChange,
  availableTypes = [],
  statusFilter = [],
  onStatusFilterChange,
  availableStatuses = [],
  statusLabels = {},
}: AlvaraTableProps) {
  const { getDownloadUrl, isLoading: isDownloading } = useDocumentosAlvaraDownload();
  const { getClienteById } = useClientes();
  const { openModal } = useClienteModal();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showCnpj, setShowCnpj] = useState(true);

  const handleClienteClick = (alvara: Alvara) => {
    if (alvara.clienteId) {
      const cliente = getClienteById(alvara.clienteId);
      if (cliente) {
        openModal(cliente);
      }
    }
  };

  // Handler para visualizar o PDF do alvará
  const handlePreview = async (alvaraId: string) => {
    try {
      const { signedUrl, originalName } = await getDownloadUrl(alvaraId);
      setPreviewUrl(signedUrl);
      setPreviewName(originalName || 'Documento do Alvará');
      setIsPreviewOpen(true);
    } catch (err) {
      alert('Erro ao carregar documento do alvará.');
    }
  };

  // Handler para download do PDF do alvará
  const handleDownload = async (alvaraId: string) => {
    try {
      const { signedUrl } = await getDownloadUrl(alvaraId);
      // Abre o PDF em uma nova aba
      window.open(signedUrl, '_blank', 'noopener');
    } catch (err) {
      alert('Erro ao abrir documento do alvará.');
    }
  };
  const formatDate = (date?: Date | string) => {
    return formatDateSafe(date);
  };

  const getDaysText = (alvara: Alvara) => {
    if (!alvara.expirationDate) return '-';
    const days = getDaysUntilExpiration(alvara.expirationDate);
    if (days === null) return '-';
    if (days < 0) return `${Math.abs(days)} dias vencido`;
    if (days === 0) return 'Vence hoje';
    return `${days} dias`;
  };

  const getDaysUntilExpirationNumber = (alvara: Alvara): number => {
    if (!alvara.expirationDate) return Infinity; // Sem data vai para o final
    const days = getDaysUntilExpiration(alvara.expirationDate);
    return days !== null ? days : Infinity;
  };

  // Função para lidar com clique no cabeçalho
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Se já está ordenando por esta coluna, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é uma nova coluna, ordena em ordem crescente
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Ordena os alvarás baseado na coluna e direção selecionadas
  const sortedAlvaras = useMemo(() => {
    if (!sortColumn) {
      // Se não há ordenação específica, mantém a ordenação padrão (por vencimento)
      return [...alvaras].sort((a, b) => {
        const now = Date.now();
        
        // Alvarás sem data de vencimento vão para o final
        if (!a.expirationDate && !b.expirationDate) return 0;
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        
        const dateA = new Date(a.expirationDate).getTime();
        const dateB = new Date(b.expirationDate).getTime();
        
        return dateA - dateB;
      });
    }

    const sorted = [...alvaras].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'clientName':
          comparison = (a.clientName || '').localeCompare(b.clientName || '', 'pt-BR', { sensitivity: 'base' });
          break;
        case 'cnpj':
          comparison = (a.clientCnpj || '').localeCompare(b.clientCnpj || '');
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '', 'pt-BR', { sensitivity: 'base' });
          break;
        case 'expirationDate':
          // Alvarás sem data vão para o final
          if (!a.expirationDate && !b.expirationDate) comparison = 0;
          else if (!a.expirationDate) comparison = 1;
          else if (!b.expirationDate) comparison = -1;
          else {
            const dateA = new Date(a.expirationDate).getTime();
            const dateB = new Date(b.expirationDate).getTime();
            comparison = dateA - dateB;
          }
          break;
        case 'daysUntilExpiration':
          const daysA = getDaysUntilExpirationNumber(a);
          const daysB = getDaysUntilExpirationNumber(b);
          comparison = daysA - daysB;
          break;
        case 'status':
          const statusOrder: Record<string, number> = { expired: 0, expiring: 1, valid: 2, pending: 3 };
          comparison = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [alvaras, sortColumn, sortDirection]);

  // Componente para renderizar o cabeçalho com ordenação
  const SortableHeader = ({ 
    column, 
    children, 
    className 
  }: { 
    column: SortColumn; 
    children: React.ReactNode;
    className?: string;
  }) => {
    const isSorted = sortColumn === column;
    return (
      <TableHead 
        className={cn(
          'font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none',
          className
        )}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1">
          <span>{children}</span>
          <div className="flex flex-col">
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3 text-primary" />
              ) : (
                <ArrowDown className="h-3 w-3 text-primary" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 text-muted-foreground opacity-50" />
            )}
          </div>
        </div>
      </TableHead>
    );
  };

  // Não retornamos mais cedo quando não há alvarás - mantemos a tabela visível para não perder o cabeçalho

  // Helper para renderizar ações
  const renderActions = (alvara: typeof alvaras[0]) => (
    <div className="flex items-center gap-0 flex-nowrap">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(alvara)}
        className="h-6 w-6"
        title="Editar Alvará"
      >
        <Edit className="h-3 w-3" />
      </Button>
      {onFinalize && !alvara.issueDate && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onFinalize(alvara)}
          className="h-6 w-6 text-green-600 hover:text-green-700"
          title="Finalizar Alvará"
        >
          <CheckCircle className="h-3 w-3" />
        </Button>
      )}
      {alvara.issueDate && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePreview(alvara.id)}
            className="h-6 w-6 text-primary hover:text-primary/80"
            title="Visualizar PDF"
            disabled={isDownloading}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDownload(alvara.id)}
            className="h-6 w-6 text-primary hover:text-primary/80"
            title="Baixar PDF"
            disabled={isDownloading}
          >
            <Download className="h-3 w-3" />
          </Button>
        </>
      )}
      {onRenew && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRenew(alvara)}
          className="h-6 w-6 text-amber-600 hover:text-amber-700"
          title="Renovar Alvará"
        >
          <RotateCw className="h-3 w-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(alvara.id)}
        className="h-6 w-6 text-destructive hover:text-destructive"
        title="Excluir Alvará"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <Fragment>
      {/* Mobile Card Layout */}
      <div className="space-y-3 sm:hidden">
        {sortedAlvaras.length === 0 ? (
          <div className="bg-card rounded-lg border p-6 text-center">
            <p className="text-muted-foreground text-sm">Nenhum alvará encontrado</p>
          </div>
        ) : (
          sortedAlvaras.map((alvara, index) => (
            <div
              key={alvara.id}
              className={cn(
                'bg-card rounded-lg border shadow-sm p-3 space-y-2 animate-fade-in',
                (alvara.status === 'expiring' || alvara.status === 'expired') && 'border-amber-200 bg-amber-50/50'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p 
                    className="font-medium text-sm truncate cursor-pointer hover:text-primary transition-colors" 
                    title={alvara.clientName}
                    onClick={() => handleClienteClick(alvara)}
                  >
                    {alvara.clientName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">{formatCnpj(alvara.clientCnpj)}</p>
                </div>
                <StatusBadge alvara={alvara} />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">{alvara.type}</span>
                <span className="whitespace-nowrap font-medium">{getDaysText(alvara)}</span>
              </div>
              {alvara.expirationDate && (
                <p className="text-xs text-muted-foreground">
                  Venc: {formatDate(alvara.expirationDate)}
                </p>
              )}
              <div className="flex items-center justify-end pt-1 border-t border-border/50">
                {renderActions(alvara)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block">
        {/* Toggle para mostrar/ocultar CNPJ */}
        <div className="flex items-center justify-end gap-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <Switch
              id="show-cnpj-alvaras"
              checked={showCnpj}
              onCheckedChange={setShowCnpj}
            />
            <Label 
              htmlFor="show-cnpj-alvaras" 
              className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
            >
              {showCnpj ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              Mostrar CNPJ
            </Label>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[420px] lg:min-w-[480px]">
              <TableHeader>
                <TableRow className="bg-muted/50 h-10">
                  <SortableHeader 
                    column="clientName" 
                    className="text-xs w-[130px] lg:w-[140px] px-1.5"
                  >
                    Cliente
                  </SortableHeader>
                  {showCnpj && (
                    <SortableHeader 
                      column="cnpj" 
                      className="text-xs hidden md:table-cell w-[95px] lg:w-[100px] px-1.5"
                    >
                      CNPJ
                    </SortableHeader>
                  )}
                <TableHead 
                  className="text-xs hidden lg:table-cell w-[110px] lg:w-[120px] px-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div 
                      className="flex items-center gap-1 flex-1 cursor-pointer hover:bg-muted/70 transition-colors select-none"
                      onClick={() => handleSort('type')}
                    >
                      <span>Tipo</span>
                      <div className="flex flex-col">
                        {sortColumn === 'type' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground opacity-50" />
                        )}
                      </div>
                    </div>
                    {onTypeFilterChange && availableTypes.length > 0 && (
                      <TableColumnFilter
                        options={availableTypes}
                        selectedValues={typeFilter}
                        onSelectionChange={onTypeFilterChange}
                        label="Filtrar por tipo"
                      />
                    )}
                  </div>
                </TableHead>
                <SortableHeader 
                  column="expirationDate" 
                  className="text-xs hidden xl:table-cell whitespace-nowrap w-[90px] px-1.5"
                >
                  Vencimento
                </SortableHeader>
                <SortableHeader 
                  column="daysUntilExpiration" 
                  className="text-xs whitespace-nowrap w-[70px] lg:w-[75px] px-1.5"
                >
                  Prazo
                </SortableHeader>
                <TableHead 
                  className="text-xs whitespace-nowrap w-[70px] lg:w-[75px] px-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div 
                      className="flex items-center gap-1 flex-1 cursor-pointer hover:bg-muted/70 transition-colors select-none"
                      onClick={() => handleSort('status')}
                    >
                      <span>Status</span>
                      <div className="flex flex-col">
                        {sortColumn === 'status' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground opacity-50" />
                        )}
                      </div>
                    </div>
                    {onStatusFilterChange && availableStatuses.length > 0 && (
                      <TableColumnFilter
                        options={availableStatuses.map(status => statusLabels[status] || status)}
                        selectedValues={statusFilter.map(status => statusLabels[status] || status)}
                        onSelectionChange={(labels) => {
                          // Converter labels de volta para valores de status
                          const values = labels.map(label => {
                            // Verificar se é um status especial primeiro
                            if (label === 'Isento') return 'isento';
                            if (label === 'SPF') return 'semPontoFixo';
                            // Depois verificar status normais
                            const entry = Object.entries(statusLabels).find(([_, l]) => l === label);
                            return entry ? entry[0] : label;
                          });
                          onStatusFilterChange(values);
                        }}
                        label="Filtrar por status"
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-xs text-center whitespace-nowrap w-[110px] lg:w-[120px] px-1.5">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAlvaras.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    Nenhum alvará encontrado
                  </TableCell>
                </TableRow>
              ) : (
                sortedAlvaras.map((alvara, index) => (
                  <TableRow
                    key={alvara.id}
                    className={`animate-fade-in text-xs h-10 ${
                      alvara.status === 'expiring' || alvara.status === 'expired'
                        ? 'bg-amber-50'
                        : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium text-xs px-1.5 py-1.5">
                      <div 
                        className="truncate cursor-pointer hover:text-primary transition-colors" 
                        title={alvara.clientName}
                        onClick={() => handleClienteClick(alvara)}
                      >
                        {truncateText(alvara.clientName || '', 40)}
                      </div>
                    </TableCell>
                    {showCnpj && (
                      <TableCell className="font-mono text-muted-foreground whitespace-nowrap text-xs hidden md:table-cell px-1.5 py-1.5">
                        {formatCnpj(alvara.clientCnpj)}
                      </TableCell>
                    )}
                    <TableCell className="hidden lg:table-cell text-xs px-1.5 py-1.5">
                      <div className="truncate" title={alvara.type}>
                        {alvara.type}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell whitespace-nowrap text-xs px-1.5 py-1.5">
                      {formatDate(alvara.expirationDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs px-1.5 py-1.5">
                      {getDaysText(alvara)}
                    </TableCell>
                    <TableCell className="text-xs px-1.5 py-1.5">
                      <StatusBadge alvara={alvara} className="px-1.5 py-0.5 text-[10px]" />
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap px-1.5 py-1.5">
                      {renderActions(alvara)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>

      {/* Modal de pré-visualização */}
      <DocumentPreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        documentUrl={previewUrl}
        documentName={previewName}
      />
    </Fragment>
  );
}
