export interface AtividadeSecundaria {
  id: string;
  clienteId: string;
  codigo: string;
  descricao: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface AtividadeSecundariaFormData {
  codigo: string;
  descricao: string;
}
