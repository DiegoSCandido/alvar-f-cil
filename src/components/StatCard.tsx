import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon?: LucideIcon;
  variant?: 'pending' | 'valid' | 'expiring' | 'expired' | 'default';
  description?: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'default',
  description,
  isLoading = false,
  onClick
}: StatCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        'bg-card rounded-lg border p-4 sm:p-5 lg:p-6 shadow-sm hover:shadow-md transition-all animate-fade-in',
        onClick && 'hover:border-primary/50 cursor-pointer',
        // Destaca o card ativo
        variant !== 'default' && 'border-primary ring-2 ring-primary/30'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground font-medium truncate">{title}</p>
          {isLoading ? (
            <div className="h-6 sm:h-7 lg:h-8 bg-muted rounded mt-2 w-16 sm:w-20 animate-pulse" />
          ) : (
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-1">{value}</p>
          )}
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden lg:block">{description}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'p-2 sm:p-2.5 lg:p-3 rounded-full flex-shrink-0 ml-2 sm:ml-3 lg:ml-4',
              {
                'status-pending': variant === 'pending',
                'status-valid': variant === 'valid',
                'status-expiring': variant === 'expiring',
                'status-expired': variant === 'expired',
                'bg-blue-100 dark:bg-blue-900': variant === 'default',
              }
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
