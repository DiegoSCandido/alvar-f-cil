export interface Cliente {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  uf: string;
  municipio: string;
  atividadePrincipalCodigo: string;
  atividadePrincipalDescricao: string;
  alvaras: string[];
  ativo?: boolean;
}

export interface ClienteFormData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  uf: string;
  municipio: string;
  atividadePrincipalCodigo: string;
  atividadePrincipalDescricao: string;
  alvaras: string[];
  ativo?: boolean;
}
