import { Cliente } from '@/types/cliente';
import { Alvara, AlvaraStatus } from '@/types/alvara';
import { formatCnpj } from '@/lib/alvara-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Edit, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ClienteTableProps {
  clientes: Cliente[];
  alvaras: Alvara[];
  onDelete: (id: string) => void;
  onEdit: (cliente: Cliente) => void;
}

// Função para buscar alvará por cliente e tipo
function getAlvaraByTipo(alvaras: Alvara[], clienteId: string, tipo: string): Alvara | undefined {
  return alvaras.find(
    (a) => a.clienteId === clienteId && a.type === tipo && a.issueDate
  );
}

// Componente para exibir alvará com status
function AlvaraCell({ alvara }: { alvara?: Alvara }) {
  if (!alvara || !alvara.expirationDate) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusIcon = (status: AlvaraStatus) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{formatDate(alvara.expirationDate)}</span>
      {getStatusIcon(alvara.status)}
    </div>
  );
}

export function ClienteTable({ clientes, alvaras, onDelete, onEdit }: ClienteTableProps) {
  if (clientes.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-8 sm:p-12 text-center">
        <p className="text-muted-foreground text-sm sm:text-base">Nenhum cliente cadastrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs sm:text-sm">CNPJ</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">Razão Social</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Nome Fantasia</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">UF</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">Município</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden xl:table-cell">Alvará Func.</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden xl:table-cell">Alvará San.</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden 2xl:table-cell">Alvará Bomb.</TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente, index) => {
              const alvaraFuncionamento = getAlvaraByTipo(
                alvaras,
                cliente.id,
                'Alvará de Funcionamento'
              );
              const alvaraSanitario = getAlvaraByTipo(
                alvaras,
                cliente.id,
                'Alvará Sanitário'
              );
              const alvaraBombeiros = getAlvaraByTipo(
                alvaras,
                cliente.id,
                'Alvará de Bombeiros'
              );

              return (
                <TableRow
                  key={cliente.id}
                  className="animate-fade-in text-xs sm:text-sm"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                    {formatCnpj(cliente.cnpj)}
                  </TableCell>
                  <TableCell className="font-medium max-w-[150px] truncate">
                    {cliente.razaoSocial}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[150px] truncate">
                    {cliente.nomeFantasia}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{cliente.uf}</TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[100px] truncate">
                    {cliente.municipio}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <AlvaraCell alvara={alvaraFuncionamento} />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <AlvaraCell alvara={alvaraSanitario} />
                  </TableCell>
                  <TableCell className="hidden 2xl:table-cell">
                    <AlvaraCell alvara={alvaraBombeiros} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(cliente)}
                        className="h-7 w-7 sm:h-8 sm:w-8"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(cliente.id)}
                        className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
