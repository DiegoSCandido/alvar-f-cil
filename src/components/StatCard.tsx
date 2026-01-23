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
        'bg-card rounded-lg border p-6 shadow-sm hover:shadow-md transition-all animate-fade-in',
        onClick && 'hover:border-primary/50 cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          {isLoading ? (
            <div className="h-8 bg-muted rounded mt-2 w-20 animate-pulse" />
          ) : (
            <p className="text-3xl font-bold mt-1">{value}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'p-3 rounded-full flex-shrink-0 ml-4',
              {
                'status-pending': variant === 'pending',
                'status-valid': variant === 'valid',
                'status-expiring': variant === 'expiring',
                'status-expired': variant === 'expired',
                'bg-blue-100 dark:bg-blue-900': variant === 'default',
              }
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
