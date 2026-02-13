import { Cliente } from '@/types/cliente';
import { Alvara, AlvaraStatus } from '@/types/alvara';
import { formatCnpj } from '@/lib/alvara-utils';
import { formatDateSafe } from '@/lib/alvara-utils';
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
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  const formatDate = (date: Date) => {
    return formatDateSafe(date);
  };

  const getStatusIcon = (status: AlvaraStatus) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'expiring':
        return <Clock className="h-3.5 w-3.5 text-yellow-600" />;
      case 'expired':
        return <XCircle className="h-3.5 w-3.5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-medium whitespace-nowrap">{formatDate(alvara.expirationDate)}</span>
      <span className="flex-shrink-0">{getStatusIcon(alvara.status)}</span>
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
    <>
      {/* Mobile Card Layout */}
      <div className="space-y-3 sm:hidden">
        {clientes.map((cliente, index) => {
          const alvaraFuncionamento = getAlvaraByTipo(alvaras, cliente.id, 'Alvará de Funcionamento');
          const alvaraSanitario = getAlvaraByTipo(alvaras, cliente.id, 'Alvará Sanitário');
          const alvaraBombeiros = getAlvaraByTipo(alvaras, cliente.id, 'Alvará de Bombeiros');

          return (
            <div
              key={cliente.id}
              className="bg-card rounded-lg border shadow-sm p-3 space-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate" title={cliente.razaoSocial}>{cliente.razaoSocial}</p>
                  <p className="text-xs text-muted-foreground font-mono">{formatCnpj(cliente.cnpj)}</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(cliente)} className="h-7 w-7" title="Editar">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(cliente.id)} className="h-7 w-7 text-destructive" title="Excluir">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{cliente.uf}</span>
                <span>•</span>
                <span className="truncate">{cliente.municipio}</span>
              </div>
              {(alvaraFuncionamento || alvaraSanitario || alvaraBombeiros) && (
                <div className="grid grid-cols-1 gap-1.5 pt-1.5 border-t border-border/50 text-xs">
                  {alvaraSanitario && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">San.</span>
                      <AlvaraCell alvara={alvaraSanitario} />
                    </div>
                  )}
                  {alvaraBombeiros && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Bomb.</span>
                      <AlvaraCell alvara={alvaraBombeiros} />
                    </div>
                  )}
                  {alvaraFuncionamento && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Func.</span>
                      <AlvaraCell alvara={alvaraFuncionamento} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden sm:block bg-card rounded-lg border shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs w-[115px]">CNPJ</TableHead>
                <TableHead className="font-semibold text-xs w-[180px]">Razão Social</TableHead>
                <TableHead className="font-semibold text-xs hidden md:table-cell w-[45px]">UF</TableHead>
                <TableHead className="font-semibold text-xs hidden xl:table-cell w-[110px]">Município</TableHead>
                <TableHead className="font-semibold text-xs hidden md:table-cell w-[90px]">Sanitário</TableHead>
                <TableHead className="font-semibold text-xs hidden md:table-cell w-[90px]">Bombeiros</TableHead>
                <TableHead className="font-semibold text-xs hidden md:table-cell w-[105px]">Funcionamento</TableHead>
                <TableHead className="font-semibold text-xs text-right whitespace-nowrap w-[75px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente, index) => {
                const alvaraFuncionamento = getAlvaraByTipo(alvaras, cliente.id, 'Alvará de Funcionamento');
                const alvaraSanitario = getAlvaraByTipo(alvaras, cliente.id, 'Alvará Sanitário');
                const alvaraBombeiros = getAlvaraByTipo(alvaras, cliente.id, 'Alvará de Bombeiros');

                return (
                  <TableRow
                    key={cliente.id}
                    className="animate-fade-in text-xs"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap text-xs">
                      {formatCnpj(cliente.cnpj)}
                    </TableCell>
                    <TableCell className="font-medium text-xs">
                      <div className="truncate" title={cliente.razaoSocial}>
                        {cliente.razaoSocial}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      {cliente.uf}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs truncate">
                      {cliente.municipio}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <AlvaraCell alvara={alvaraSanitario} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <AlvaraCell alvara={alvaraBombeiros} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <AlvaraCell alvara={alvaraFuncionamento} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(cliente)}
                          className="h-7 w-7"
                          title="Editar Cliente"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(cliente.id)}
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Excluir Cliente"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
    </>
  );
}
