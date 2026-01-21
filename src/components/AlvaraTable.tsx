import { Alvara } from '@/types/alvara';
import { StatusBadge } from './StatusBadge';
import { getDaysUntilExpiration, formatCnpj } from '@/lib/alvara-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
}

export function AlvaraTable({ alvaras, onDelete, onEdit, onFinalize }: AlvaraTableProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
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
              <TableHead className="font-semibold text-xs sm:text-sm">Cliente</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">CNPJ</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Tipo</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">Solicitação</TableHead>
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
                className="animate-fade-in text-xs sm:text-sm"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-medium max-w-[120px] truncate">
                  {alvara.clientName}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                  {formatCnpj(alvara.clientCnpj)}
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-[100px] truncate">
                  {alvara.type}
                </TableCell>
                <TableCell className="hidden lg:table-cell whitespace-nowrap">
                  {formatDate(alvara.requestDate)}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(alvara.id)}
                      className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
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
    </div>
  );
}
