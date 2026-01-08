import { Alvara, AlvaraStatus } from '@/types/alvara';
import { differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

export function calculateAlvaraStatus(alvara: Alvara): AlvaraStatus {
  const today = new Date();
  
  // If no issue date, it's still pending
  if (!alvara.issueDate) {
    return 'pending';
  }
  
  // If no expiration date, consider it valid
  if (!alvara.expirationDate) {
    return 'valid';
  }
  
  const expirationDate = new Date(alvara.expirationDate);
  
  // Check if expired
  if (isBefore(expirationDate, today)) {
    return 'expired';
  }
  
  // Check if expiring within 30 days
  const thirtyDaysFromNow = addDays(today, 30);
  if (isBefore(expirationDate, thirtyDaysFromNow)) {
    return 'expiring';
  }
  
  return 'valid';
}

export function getDaysUntilExpiration(expirationDate?: Date): number | null {
  if (!expirationDate) return null;
  return differenceInDays(new Date(expirationDate), new Date());
}

export function getStatusLabel(status: AlvaraStatus): string {
  const labels: Record<AlvaraStatus, string> = {
    pending: 'Pendente',
    valid: 'Válido',
    expiring: 'Vencendo',
    expired: 'Vencido',
  };
  return labels[status];
}

export function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
