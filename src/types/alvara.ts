export type AlvaraStatus = 'pending' | 'valid' | 'expiring' | 'expired';
export type AlvaraProcessingStatus = 'lançado' | 'aguardando_cliente' | 'aguardando_orgao' | 'renovacao';

export const ALVARA_TYPES = [
  'Alvará de Funcionamento',
  'Alvará de Bombeiros',
  'Alvará Sanitário',
  'Alvará Polícia Civil',
  'Dispensa de Alvará Sanitário',
] as const;

export type AlvaraType = typeof ALVARA_TYPES[number];

export interface Alvara {
  id: string;
  clienteId: string; // ID do cliente cadastrado
  clientName: string; // Mantido para compatibilidade/display
  clientCnpj: string; // Mantido para compatibilidade/display
  type: AlvaraType;
  requestDate: Date;
  issueDate?: Date;
  expirationDate?: Date;
  status: AlvaraStatus;
  processingStatus?: AlvaraProcessingStatus; // Status de processamento do alvará
  notes?: string;
}

export interface AlvaraFormData {
  clienteId: string; // ID do cliente selecionado
  type: AlvaraType;
  requestDate: Date;
  issueDate?: Date;
  expirationDate?: Date;
  processingStatus?: AlvaraProcessingStatus;
  notes?: string;
}
