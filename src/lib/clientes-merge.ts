import type { Cliente } from '@/types/cliente';
import type { Alvara } from '@/types/alvara';
import { clienteAPI } from '@/lib/api-client';
import { isClientSidePair } from '@/lib/clientes-filters';

const TIPOS_RENOVACAO: Record<string, string[]> = {
  sanitario: ['Alvará Sanitário', 'Dispensa de Alvará Sanitário'],
  bombeiros: ['Alvará de Bombeiros'],
  funcionamento: ['Alvará de Funcionamento'],
};

function matchesTaxasPaga(
  cl: Cliente,
  c: { coluna: string; opcao: string },
  taxasPaga: Record<string, { paga?: boolean } | undefined>
): boolean {
  return (
    (c.coluna === 'funcionamento' || c.coluna === 'taxas') &&
    c.opcao === 'paga' &&
    !!taxasPaga[cl.id]?.paga
  );
}

function matchesRenovacao(
  cl: Cliente,
  c: { coluna: string; opcao: string },
  alvaras: Alvara[]
): boolean {
  if (c.opcao !== 'renovacao') return false;
  const tipos = TIPOS_RENOVACAO[c.coluna] ?? [];
  return alvaras.some(
    (a) =>
      a.clienteId === cl.id &&
      tipos.includes(a.type) &&
      a.processingStatus === 'renovacao'
  );
}

/** União (OR) dos clientes que satisfazem qualquer critério (coluna+opção). */
export async function mergeClientesByCriteria(
  criterios: { coluna: string; opcao: string }[],
  alvaras: Alvara[],
  taxasPaga: Record<string, { paga?: boolean } | undefined>
): Promise<Cliente[]> {
  if (criterios.length === 0) return clienteAPI.list();

  const full = await clienteAPI.list();
  const idSet = new Set<string>();

  for (const c of criterios) {
    if (isClientSidePair(c)) {
      for (const cl of full) {
        if (matchesTaxasPaga(cl, c, taxasPaga) || matchesRenovacao(cl, c, alvaras)) {
          idSet.add(cl.id);
        }
      }
    } else {
      const part = await clienteAPI.list({ coluna: c.coluna, opcao: c.opcao });
      part.forEach((x) => idSet.add(x.id));
    }
  }

  return full.filter((cl) => idSet.has(cl.id));
}
