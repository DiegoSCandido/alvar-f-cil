import { useState } from 'react';
import { Alvara } from '@/types/alvara';
import { StatusBadge } from './StatusBadge';
import { getDaysUntilExpiration, formatCnpj, formatDateSafe } from '@/lib/alvara-utils';
import { Trash2, Edit, CheckCircle, RotateCw, Download, Eye } from 'lucide-react';
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
              <TableHead className="font-semibold text-xs sm:text-sm min-w-[250px]">Cliente</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">CNPJ</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell min-w-[200px]">Tipo</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Vencimento</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Prazo</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Status</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alvaras.map((alvara, index) => (
              <TableRow
                key={alvara.id}
                className={`animate-fade-in text-xs sm:text-sm ${
                  alvara.status === 'expiring' || alvara.status === 'expired'
                    ? 'bg-amber-50'
                    : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-medium min-w-[250px] max-w-[400px]">
                  <div className="truncate" title={alvara.clientName}>
                    {alvara.clientName}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                  {formatCnpj(alvara.clientCnpj)}
                </TableCell>
                <TableCell className="hidden md:table-cell min-w-[200px] max-w-[300px]">
                  <div className="truncate" title={alvara.type}>
                    {alvara.type}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell whitespace-nowrap">
                  {formatDate(alvara.expirationDate)}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {getDaysText(alvara)}
                </TableCell>
                <TableCell>
                  <StatusBadge alvara={alvara} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5 sm:gap-1">
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
