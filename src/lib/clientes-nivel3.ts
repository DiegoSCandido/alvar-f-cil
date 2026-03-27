import type { Alvara } from '@/types/alvara';

/**
 * Tipos de alvará que entram no refino conforme a coluna do filtro 1.
 * Assim não misturamos, por exemplo, Bombeiros vencendo com Funcionamento ativo.
 */
const TIPOS_ALVARA_POR_COLUNA: Record<string, string[]> = {
  sanitario: ['Alvará Sanitário', 'Dispensa de Alvará Sanitário'],
  bombeiros: ['Alvará de Bombeiros'],
  funcionamento: ['Alvará de Funcionamento'],
  /** Taxas no sistema seguem o alvará de funcionamento para situação/vencimento. */
  taxas: ['Alvará de Funcionamento'],
};

function alvarasNoEscopoColuna(
  clienteId: string,
  alvaras: Alvara[],
  contextoColuna: string | undefined
): Alvara[] {
  const doCliente = alvaras.filter((a) => a.clienteId === clienteId);
  const col = contextoColuna?.trim();
  if (!col) return doCliente;
  const tipos = TIPOS_ALVARA_POR_COLUNA[col];
  if (!tipos?.length) return doCliente;
  return doCliente.filter((a) => tipos.includes(a.type));
}

/**
 * Refino do filtro 3 sobre alvarás **do tipo da coluna** (filtro 1).
 * OR entre refinamentos escolhidos; cada critério olha só `escopo`.
 */
export function clienteMatchesNivel3Refinamento(
  clienteId: string,
  refinamentos: string[],
  alvaras: Alvara[],
  contextoColuna?: string
): boolean {
  if (refinamentos.length === 0) return true;

  const escopo = alvarasNoEscopoColuna(clienteId, alvaras, contextoColuna);
  const comEmissaoNoEscopo = escopo.filter((a) => a.issueDate);

  return refinamentos.some((r) => {
    switch (r) {
      case 'vencendo':
        return escopo.some((a) => a.status === 'expiring');
      case 'vencido':
        return escopo.some((a) => a.status === 'expired');
      case 'ativo':
        return escopo.some((a) => a.status === 'valid');
      case 'pending':
        return escopo.some((a) => a.status === 'pending');
      case 'sem_status':
        if (escopo.length === 0) return true;
        return comEmissaoNoEscopo.length === 0;
      case 'renovacao':
        return escopo.some((a) => a.processingStatus === 'renovacao');
      case 'spf':
        return escopo.some((a) => a.semPontoFixo === true);
      case 'isento':
        return escopo.some((a) => a.isento === true);
      default:
        return false;
    }
  });
}
