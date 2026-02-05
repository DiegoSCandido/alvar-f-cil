import { useState, useMemo } from 'react';
import { Alvara } from '@/types/alvara';
import { StatusBadge } from './StatusBadge';
import { getDaysUntilExpiration, formatCnpj, formatDateSafe } from '@/lib/alvara-utils';
import { Trash2, Edit, CheckCircle, RotateCw, Download, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useDocumentosAlvaraDownload } from '@/hooks/useDocumentosAlvaraDownload';
import { Button } from '@/components/ui/button';
import { DocumentPreviewModal } from './DocumentPreviewModal';
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
}

export function AlvaraTable({ alvaras, onDelete, onEdit, onFinalize, onRenew }: AlvaraTableProps) {
  const { getDownloadUrl, isLoading: isDownloading } = useDocumentosAlvaraDownload();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
          'font-semibold text-xs sm:text-sm lg:text-base cursor-pointer hover:bg-muted/70 transition-colors select-none',
          className
        )}
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span>{children}</span>
          <div className="flex flex-col">
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              ) : (
                <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              )
            ) : (
              <ArrowUpDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground opacity-50" />
            )}
          </div>
        </div>
      </TableHead>
    );
  };

  if (alvaras.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-8 sm:p-12 text-center">
        <p className="text-muted-foreground text-sm sm:text-base">Nenhum alvará cadastrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <SortableHeader 
                column="clientName" 
                className="min-w-[200px] sm:min-w-[250px] xl:min-w-[300px]"
              >
                Cliente
              </SortableHeader>
              <SortableHeader 
                column="cnpj" 
                className="hidden sm:table-cell"
              >
                CNPJ
              </SortableHeader>
              <SortableHeader 
                column="type" 
                className="hidden lg:table-cell min-w-[180px] xl:min-w-[200px]"
              >
                Tipo
              </SortableHeader>
              <SortableHeader 
                column="expirationDate" 
                className="hidden xl:table-cell whitespace-nowrap"
              >
                Vencimento
              </SortableHeader>
              <SortableHeader 
                column="daysUntilExpiration" 
                className="whitespace-nowrap"
              >
                Prazo
              </SortableHeader>
              <SortableHeader 
                column="status" 
                className="whitespace-nowrap"
              >
                Status
              </SortableHeader>
              <TableHead className="font-semibold text-xs sm:text-sm lg:text-base text-right whitespace-nowrap">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAlvaras.map((alvara, index) => (
              <TableRow
                key={alvara.id}
                className={`animate-fade-in text-xs sm:text-sm ${
                  alvara.status === 'expiring' || alvara.status === 'expired'
                    ? 'bg-amber-50'
                    : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-medium min-w-[200px] sm:min-w-[250px] xl:min-w-[300px] max-w-[250px] sm:max-w-[350px] xl:max-w-[400px]">
                  <div className="truncate" title={alvara.clientName}>
                    <span className="text-xs sm:text-sm lg:text-base">{alvara.clientName}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground whitespace-nowrap hidden sm:table-cell">
                  <span className="text-xs sm:text-sm lg:text-base">{formatCnpj(alvara.clientCnpj)}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell min-w-[180px] xl:min-w-[200px] max-w-[250px] xl:max-w-[300px]">
                  <div className="truncate" title={alvara.type}>
                    <span className="text-xs sm:text-sm lg:text-base">{alvara.type}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell whitespace-nowrap">
                  <span className="text-xs sm:text-sm lg:text-base">{formatDate(alvara.expirationDate)}</span>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <span className="text-xs sm:text-sm lg:text-base">{getDaysText(alvara)}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge alvara={alvara} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5 sm:gap-1 xl:gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(alvara)}
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      title="Editar Alvará"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    {onFinalize && !alvara.issueDate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onFinalize(alvara)}
                        className="h-7 w-7 sm:h-8 sm:w-8 text-green-600 hover:text-green-700"
                        title="Finalizar Alvará"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                    {alvara.issueDate && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(alvara.id)}
                          className="h-7 w-7 sm:h-8 sm:w-8 text-primary hover:text-primary/80"
                          title="Visualizar PDF do Alvará"
                          disabled={isDownloading}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(alvara.id)}
                          className="h-7 w-7 sm:h-8 sm:w-8 text-primary hover:text-primary/80"
                          title="Baixar PDF do Alvará"
                          disabled={isDownloading}
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </>
                    )}
                    {onRenew && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRenew(alvara)}
                        className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600 hover:text-amber-700"
                        title="Renovar Alvará"
                      >
                        <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(alvara.id)}
                      className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                      title="Excluir Alvará"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal de pré-visualização */}
      <DocumentPreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        documentUrl={previewUrl}
        documentName={previewName}
      />
    </div>
  );
}
