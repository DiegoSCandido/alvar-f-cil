import { AlvaraProcessingStatus } from '@/types/alvara';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Building2 } from 'lucide-react';

interface ProcessingStatusBadgeProps {
  status?: AlvaraProcessingStatus;
}

export function ProcessingStatusBadge({ status }: ProcessingStatusBadgeProps) {
  if (!status) {
    return null;
  }

  const statusConfig: Record<AlvaraProcessingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    lançado: {
      label: 'Lançado',
      variant: 'default',
      icon: <CheckCircle className="h-3 w-3" />,
    },
    aguardando_cliente: {
      label: 'Aguardando Cliente',
      variant: 'outline',
      icon: <Clock className="h-3 w-3" />,
    },
    aguardando_orgao: {
      label: 'Aguardando Órgão',
      variant: 'secondary',
      icon: <Building2 className="h-3 w-3" />,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="gap-1 whitespace-nowrap">
      {config.icon}
      {config.label}
    </Badge>
  );
}
