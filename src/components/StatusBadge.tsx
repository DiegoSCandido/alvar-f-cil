import { AlvaraStatus, AlvaraProcessingStatus } from '@/types/alvara';
import { getStatusLabel, calculateAlvaraStatus } from '@/lib/alvara-utils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  alvara?: {
    status: AlvaraStatus;
    issueDate?: Date;
    expirationDate?: Date;
    processingStatus?: AlvaraProcessingStatus;
    isento?: boolean;
    semPontoFixo?: boolean;
  };
  status?: AlvaraStatus;
  processingStatus?: AlvaraProcessingStatus;
  className?: string;
}

export function StatusBadge({ alvara, status, processingStatus, className }: StatusBadgeProps) {
  // Se passar o alvara completo, calcula o status correto
  let displayStatus = status;
  let displayProcessingStatus = processingStatus;

  if (alvara) {
    displayStatus = calculateAlvaraStatus(alvara);
    displayProcessingStatus = alvara.processingStatus;
  }

  // Se o alvará está em processo de renovação, mostrar isso independente do status
  if (displayProcessingStatus === 'renovacao') {
    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
          className
        )}
      >
        Em Renovação
      </span>
    );
  }

  // Se o alvará está em abertura (sem issueDate), mostrar o processingStatus
  if (alvara && !alvara.issueDate && displayProcessingStatus) {
    const processingStatusLabels: Record<AlvaraProcessingStatus, string> = {
      lançado: 'Iniciado',
      aguardando_cliente: 'Aguardando Cliente',
      aguardando_orgao: 'Aguardando Órgão',
      renovacao: 'Em Renovação',
    };

    const processingStatusClasses: Record<AlvaraProcessingStatus, string> = {
      lançado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      aguardando_cliente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      aguardando_orgao: 'bg-o2-blue-light text-o2-blue dark:bg-o2-blue/20 dark:text-o2-blue-light',
      renovacao: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    };

    return (
      <span
        className={cn(
          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
          processingStatusClasses[displayProcessingStatus],
          className
        )}
      >
        {processingStatusLabels[displayProcessingStatus]}
      </span>
    );
  }

  const statusLabels: Record<AlvaraStatus, string> = {
    pending: 'Pendente',
    valid: 'Ativo',
    expiring: 'Vencendo',
    expired: 'Vencido',
  };

  const statusClasses: Record<AlvaraStatus, string> = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    valid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    expiring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  // Verifica se é isento ou sem ponto fixo
  const isExempt = alvara?.isento || alvara?.semPontoFixo;
  const isento = alvara?.isento;
  const semPontoFixo = alvara?.semPontoFixo;

  // Se for isento ou sem ponto fixo, mostra apenas os badges Isento/SPF (sem o status)
  if (isExempt) {
    return (
      <div className="inline-flex items-center gap-1 flex-wrap">
        {isento && (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
              className
            )}
          >
            Isento
          </span>
        )}
        {semPontoFixo && (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
              className
            )}
          >
            SPF
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        statusClasses[displayStatus || 'pending'],
        className
      )}
    >
      {statusLabels[displayStatus || 'pending']}
    </span>
  );
}
