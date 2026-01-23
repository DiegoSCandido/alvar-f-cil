import { AlvaraProcessingStatus } from '@/types/alvara';
import { CheckCircle, Clock, Building2, RotateCw } from 'lucide-react';

export const PROCESSING_STATUS_OPTIONS = [
  {
    value: 'lançado' as AlvaraProcessingStatus,
    label: 'Lançado',
    description: 'Alvará lançado no sistema',
    icon: CheckCircle,
  },
  {
    value: 'aguardando_cliente' as AlvaraProcessingStatus,
    label: 'Aguardando Cliente',
    description: 'Aguardando documentação do cliente',
    icon: Clock,
  },
  {
    value: 'aguardando_orgao' as AlvaraProcessingStatus,
    label: 'Aguardando Órgão',
    description: 'Aguardando resposta do órgão',
    icon: Building2,
  },
  {
    value: 'renovacao' as AlvaraProcessingStatus,
    label: 'Renovação',
    description: 'Em processo de renovação',
    icon: RotateCw,
  },
] as const;
