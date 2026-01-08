import { AlvaraStatus } from '@/types/alvara';
import { getStatusLabel } from '@/lib/alvara-utils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AlvaraStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        {
          'status-pending': status === 'pending',
          'status-valid': status === 'valid',
          'status-expiring': status === 'expiring',
          'status-expired': status === 'expired',
        },
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
