// Hook para buscar dados de CNPJ via proxy do backend (que chama ReceitaWS)

interface CNPJData {
  status: string;
  cnpj: string;
  tipo: string;
  porte: string;
  nome: string;
  fantasia: string;
  abertura: string;
  atividade_principal: Array<{
    code: string;
    text: string;
  }>;
  atividades_secundarias: Array<{
    code: string;
    text: string;
  }>;
  natureza_juridica: string;
  logradouro: string;
  numero: string;
  complemento: string;
  cep: string;
  bairro: string;
  municipio: string;
  uf: string;
  email: string;
  telefone: string;
  efr: string;
  situacao: string;
  data_situacao: string;
  motivo_situacao: string;
  qsa: Array<{
    nome: string;
    qual: string;
    pais_origem: string;
  }>;
  capital_social: string;
}

export async function fetchCNPJData(cnpj: string): Promise<CNPJData | null> {
  try {
    // Remover formatação do CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    // Validar se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ deve ter 14 dígitos');
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(
      `${apiUrl}/cnpj/${cnpjLimpo}`
    );

    if (response.status === 429) {
      throw new Error('Limite de requisições excedido (3 por minuto). Tente novamente em alguns segundos.');
    }

    if (response.status === 504) {
      throw new Error('Timeout - CNPJ não encontrado ou não disponível no momento');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Erro ao buscar CNPJ');
    }

    const data: CNPJData = await response.json();

    if (data.status !== 'OK') {
      throw new Error('CNPJ não encontrado ou inativo');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erro ao buscar CNPJ: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Converte dados da API ReceitaWS para o formato do formulário
 */
export function convertCNPJDataToFormData(cnpjData: CNPJData) {
  const uf = (cnpjData.uf || '').trim().toUpperCase();
  
  return {
    cnpj: cnpjData.cnpj,
    razaoSocial: cnpjData.nome || '',
    nomeFantasia: cnpjData.fantasia || '',
    uf: uf,
    municipio: cnpjData.municipio || '',
    atividadePrincipalCodigo: cnpjData.atividade_principal?.[0]?.code || '',
    atividadePrincipalDescricao: cnpjData.atividade_principal?.[0]?.text || '',
  };
}
