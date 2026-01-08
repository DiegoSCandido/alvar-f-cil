export interface Cliente {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  telefone: string;
  emailApuracao: string;
  uf: string;
  municipio: string;
  regimeTributario: string;
  atividadePrincipalCodigo: string;
  atividadePrincipalDescricao: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
}

export interface ClienteFormData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  email: string;
  telefone: string;
  emailApuracao: string;
  uf: string;
  municipio: string;
  regimeTributario: string;
  atividadePrincipalCodigo: string;
  atividadePrincipalDescricao: string;
  inscricaoMunicipal?: string;
  inscricaoEstadual?: string;
}
