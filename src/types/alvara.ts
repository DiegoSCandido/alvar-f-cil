export type AlvaraStatus = 'pending' | 'valid' | 'expiring' | 'expired';

export interface Alvara {
  id: string;
  clientName: string;
  clientCnpj: string;
  type: string;
  requestDate: Date;
  issueDate?: Date;
  expirationDate?: Date;
  status: AlvaraStatus;
  notes?: string;
}

export interface AlvaraFormData {
  clientName: string;
  clientCnpj: string;
  type: string;
  requestDate: Date;
  issueDate?: Date;
  expirationDate?: Date;
  notes?: string;
}
