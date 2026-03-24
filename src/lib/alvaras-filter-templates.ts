import type { AlvaraStatus } from '@/types/alvara';

export type AlvarasFilterTab = 'novos' | 'funcionamento' | 'renovacao';

export type ProcessingFilterValue =
  | 'all'
  | 'lançado'
  | 'aguardando_cliente'
  | 'aguardando_orgao';

export interface AlvarasFilterSnapshot {
  activeTab: AlvarasFilterTab;
  searchTerm: string;
  statusFilter: AlvaraStatus | 'all';
  processingFilter: ProcessingFilterValue;
  typeFilter: string[];
  statusColumnFilter: string[];
}

export interface SavedAlvarasFilterTemplate {
  id: string;
  name: string;
  createdAt: string;
  snapshot: AlvarasFilterSnapshot;
}

const STORAGE_KEY = 'alvaras-o2con-filter-templates';

function safeParse(raw: string | null): SavedAlvarasFilterTemplate[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is SavedAlvarasFilterTemplate =>
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

export function listAlvarasFilterTemplates(): SavedAlvarasFilterTemplate[] {
  return safeParse(localStorage.getItem(STORAGE_KEY)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveAlvarasFilterTemplate(
  name: string,
  snapshot: AlvarasFilterSnapshot
): SavedAlvarasFilterTemplate {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nome do modelo é obrigatório');

  const list = safeParse(localStorage.getItem(STORAGE_KEY));
  const item: SavedAlvarasFilterTemplate = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: new Date().toISOString(),
    snapshot: { ...snapshot },
  };
  list.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return item;
}

export function deleteAlvarasFilterTemplate(id: string): void {
  const list = safeParse(localStorage.getItem(STORAGE_KEY)).filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
