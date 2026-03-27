export type ClientesFilterTab = 'ativos' | 'inativos';

export const CLIENTES_COLUNA_OPTIONS = [
  { value: 'sanitario', label: 'Sanitário' },
  { value: 'bombeiros', label: 'Bombeiros' },
  { value: 'funcionamento', label: 'Funcionamento' },
  { value: 'taxas', label: 'Taxas' },
] as const;

export const CLIENTES_OPCAO_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'vencendo', label: 'Vencendo' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'renovacao', label: 'Em Renovação' },
  { value: 'spf', label: 'SPF' },
  { value: 'isento', label: 'Isento' },
  { value: 'sem_status', label: 'Sem alvará' },
  { value: 'paga', label: 'Paga' },
] as const;

/** Nível 3 — refino por situação real dos alvarás do cliente (filtro no cliente, após API). */
export const CLIENTES_NIVEL3_OPTIONS = [
  { value: 'vencendo', label: 'Vencendo' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'sem_status', label: 'Sem alvará emitido' },
  { value: 'ativo', label: 'Alvará ativo (válido)' },
  { value: 'pending', label: 'Pendente' },
  { value: 'renovacao', label: 'Em renovação' },
  { value: 'spf', label: 'SPF' },
  { value: 'isento', label: 'Isento' },
] as const;

export interface ClientesFilterSnapshot {
  activeTab: ClientesFilterTab;
  searchTerm: string;
  /** Nível 1 — coluna da API. Vazio = não usar filtro API por coluna. */
  nivel1Coluna: string;
  /** Nível 2 — opção da API (depende do nível 1). Vazio = não usar. */
  nivel2Opcao: string;
  /** Nível 3 — refino por alvará (múltipla escolha, OR). Vazio = todos após níveis 1–2. */
  nivel3Refinamento: string[];
}

export function buildApiPair(snapshot: Pick<ClientesFilterSnapshot, 'nivel1Coluna' | 'nivel2Opcao'>): {
  coluna: string;
  opcao: string;
} | null {
  const { nivel1Coluna, nivel2Opcao } = snapshot;
  if (!nivel1Coluna?.trim() || !nivel2Opcao?.trim()) return null;
  return { coluna: nivel1Coluna, opcao: nivel2Opcao };
}

export function isClientSidePair(c: { coluna: string; opcao: string }): boolean {
  return (
    ((c.coluna === 'funcionamento' || c.coluna === 'taxas') && c.opcao === 'paga') ||
    ((c.coluna === 'sanitario' || c.coluna === 'bombeiros' || c.coluna === 'funcionamento') &&
      c.opcao === 'renovacao')
  );
}

export function migrateClientesFilterSnapshot(raw: unknown): ClientesFilterSnapshot {
  const empty: ClientesFilterSnapshot = {
    activeTab: 'ativos',
    searchTerm: '',
    nivel1Coluna: '',
    nivel2Opcao: '',
    nivel3Refinamento: [],
  };

  if (!raw || typeof raw !== 'object') return empty;
  const o = raw as Record<string, unknown>;

  if ('nivel1Coluna' in o || 'nivel2Opcao' in o || 'nivel3Refinamento' in o) {
    const n3 = o.nivel3Refinamento;
    return {
      activeTab: (o.activeTab as ClientesFilterTab) || 'ativos',
      searchTerm: typeof o.searchTerm === 'string' ? o.searchTerm : '',
      nivel1Coluna: typeof o.nivel1Coluna === 'string' ? o.nivel1Coluna : '',
      nivel2Opcao: typeof o.nivel2Opcao === 'string' ? o.nivel2Opcao : '',
      nivel3Refinamento: Array.isArray(n3) ? n3.filter((x): x is string => typeof x === 'string') : [],
    };
  }

  if (Array.isArray(o.filtroColunas) && Array.isArray(o.filtroOpcoes)) {
    const cols = o.filtroColunas.filter((x): x is string => typeof x === 'string');
    const ops = o.filtroOpcoes.filter((x): x is string => typeof x === 'string');
    return {
      activeTab: (o.activeTab as ClientesFilterTab) || 'ativos',
      searchTerm: typeof o.searchTerm === 'string' ? o.searchTerm : '',
      nivel1Coluna: cols[0] ?? '',
      nivel2Opcao: ops[0] ?? '',
      nivel3Refinamento: [],
    };
  }

  const col = typeof o.filtroColuna === 'string' ? o.filtroColuna : '';
  const op = typeof o.filtroOpcao === 'string' ? o.filtroOpcao : '';
  return {
    activeTab: (o.activeTab as ClientesFilterTab) || 'ativos',
    searchTerm: typeof o.searchTerm === 'string' ? o.searchTerm : '',
    nivel1Coluna: col,
    nivel2Opcao: op,
    nivel3Refinamento: [],
  };
}

export interface SavedClientesFilterTemplate {
  id: string;
  name: string;
  createdAt: string;
  snapshot: ClientesFilterSnapshot;
}

const STORAGE_KEY = 'clientes-o2con-filter-templates';

function safeParse(raw: string | null): SavedClientesFilterTemplate[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is SavedClientesFilterTemplate =>
        typeof x === 'object' &&
        x !== null &&
        'id' in x &&
        'name' in x &&
        'snapshot' in x
    );
  } catch {
    return [];
  }
}

export function listClientesFilterTemplates(): SavedClientesFilterTemplate[] {
  return safeParse(localStorage.getItem(STORAGE_KEY)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveClientesFilterTemplate(
  name: string,
  snapshot: ClientesFilterSnapshot
): SavedClientesFilterTemplate {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nome do modelo é obrigatório');

  const list = safeParse(localStorage.getItem(STORAGE_KEY));
  const item: SavedClientesFilterTemplate = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: new Date().toISOString(),
    snapshot: { ...snapshot },
  };
  list.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return item;
}

export function deleteClientesFilterTemplate(id: string): void {
  const list = safeParse(localStorage.getItem(STORAGE_KEY)).filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
