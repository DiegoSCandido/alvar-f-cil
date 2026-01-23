export interface DocumentoCliente {
  id: string;
  clienteId: string;
  nomeDocumento: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  tamanhoArquivo: number;
  tipoMime: string;
  tipoDocumento?: string;
  tipoArmazenamento: 'local' | 'cloud';
  dataUpload: Date;
}

export interface DocumentoClienteFormData {
  nomeDocumento: string;
  tipoDocumento?: string;
  file?: File;
}
