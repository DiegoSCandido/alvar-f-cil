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

export interface ClientesFilterSnapshot {
  activeTab: ClientesFilterTab;
  searchTerm: string;
  filtroColuna: string;
  filtroOpcao: string;
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
