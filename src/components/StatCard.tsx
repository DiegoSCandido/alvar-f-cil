import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant: 'pending' | 'valid' | 'expiring' | 'expired';
}

export function StatCard({ title, value, icon: Icon, variant }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div
          className={cn(
            'p-3 rounded-full',
            {
              'status-pending': variant === 'pending',
              'status-valid': variant === 'valid',
              'status-expiring': variant === 'expiring',
              'status-expired': variant === 'expired',
            }
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
