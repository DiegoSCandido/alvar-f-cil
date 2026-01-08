import { Alvara } from '@/types/alvara';
import { StatusBadge } from './StatusBadge';
import { getDaysUntilExpiration, formatCnpj } from '@/lib/alvara-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Edit, Eye } from 'lucide-react';
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
}

export function AlvaraTable({ alvaras, onDelete, onEdit }: AlvaraTableProps) {
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
      <div className="bg-card rounded-lg border p-12 text-center">
        <p className="text-muted-foreground">Nenhum alvará cadastrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Cliente</TableHead>
            <TableHead className="font-semibold">CNPJ</TableHead>
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Solicitação</TableHead>
            <TableHead className="font-semibold">Vencimento</TableHead>
            <TableHead className="font-semibold">Prazo</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alvaras.map((alvara, index) => (
            <TableRow
              key={alvara.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell className="font-medium">{alvara.clientName}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatCnpj(alvara.clientCnpj)}
              </TableCell>
              <TableCell>{alvara.type}</TableCell>
              <TableCell>{formatDate(alvara.requestDate)}</TableCell>
              <TableCell>{formatDate(alvara.expirationDate)}</TableCell>
              <TableCell className="text-muted-foreground">
                {getDaysText(alvara)}
              </TableCell>
              <TableCell>
                <StatusBadge status={alvara.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(alvara)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(alvara.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
