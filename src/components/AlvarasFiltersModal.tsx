import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { AlvaraStatus } from '@/types/alvara';
import {
  type AlvarasFilterSnapshot,
  type SavedAlvarasFilterTemplate,
  listAlvarasFilterTemplates,
  saveAlvarasFilterTemplate,
  deleteAlvarasFilterTemplate,
  migrateAlvarasFilterSnapshot,
} from '@/lib/alvaras-filter-templates';
import { MultiCheckboxPill, filterPillInputClass } from '@/components/MultiCheckboxPill';
import { Check, Clock, Search, Trash2, BookmarkPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PROCESSING_KEYS = ['lançado', 'aguardando_cliente', 'aguardando_orgao'] as const;
const PROCESSING_LABELS: Record<string, string> = {
  lançado: 'Iniciado',
  aguardando_cliente: 'Aguardando cliente',
  aguardando_orgao: 'Aguardando órgão',
};

const STATUS_OVERVIEW_KEYS: AlvaraStatus[] = ['pending', 'valid', 'expiring', 'expired'];
const STATUS_OVERVIEW_LABELS: Record<AlvaraStatus, string> = {
  pending: 'Pendente',
  valid: 'Válidos',
  expiring: 'Vencendo',
  expired: 'Vencidos',
};

const TAB_LABELS: Record<AlvarasFilterSnapshot['activeTab'], string> = {
  funcionamento: 'Em funcionamento',
  novos: 'Novos alvarás',
  renovacao: 'Renovação',
};

interface AlvarasFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: AlvarasFilterSnapshot;
  onApply: (snapshot: AlvarasFilterSnapshot) => void;
  availableTypes: readonly string[];
  statusColumnOptions: string[];
  statusColumnLabels: Record<string, string>;
}

function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm font-semibold text-foreground/90">{label}</Label>
      {children}
    </div>
  );
}

export function AlvarasFiltersModal({
  open,
  onOpenChange,
  initial,
  onApply,
  availableTypes,
  statusColumnOptions,
  statusColumnLabels,
}: AlvarasFiltersModalProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<AlvarasFilterSnapshot>(initial);
  const [templates, setTemplates] = useState<SavedAlvarasFilterTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [saveName, setSaveName] = useState('');
  const [showSaveRow, setShowSaveRow] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(migrateAlvarasFilterSnapshot(initial));
      setTemplates(listAlvarasFilterTemplates());
      setSelectedTemplateId('');
      setSaveName('');
      setShowSaveRow(false);
    }
  }, [open, initial]);

  const typeLabels = useMemo(() => {
    const m: Record<string, string> = {};
    availableTypes.forEach((t) => {
      m[t] = t;
    });
    return m;
  }, [availableTypes]);

  const applySnapshot = (s: AlvarasFilterSnapshot) => {
    onApply(s);
    onOpenChange(false);
  };

  const handleApply = () => applySnapshot(draft);

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    try {
      saveAlvarasFilterTemplate(name, draft);
      setTemplates(listAlvarasFilterTemplates());
      setSaveName('');
      setShowSaveRow(false);
      toast({ title: 'Modelo salvo', description: `“${name}” foi guardado neste navegador.` });
    } catch {
      toast({ title: 'Não foi possível salvar', description: 'Informe um nome para o modelo.', variant: 'destructive' });
    }
  };

  const handleLoadTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) setDraft(migrateAlvarasFilterSnapshot(t.snapshot));
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplateId) return;
    deleteAlvarasFilterTemplate(selectedTemplateId);
    setTemplates(listAlvarasFilterTemplates());
    setSelectedTemplateId('');
  };

  const showProcessing = draft.activeTab === 'novos';
  const showStatusOverview = draft.activeTab === 'funcionamento';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[min(100vw-1rem,1100px)] gap-0 overflow-y-auto p-0 pr-10 pt-12 sm:rounded-xl">
        <div className="border-b bg-muted/30 px-6 py-4">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-semibold">Filtros</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Configure a busca e os critérios; salve um modelo para reutilizar depois.
            </p>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <FilterField label="Carregar modelo" className="min-w-0 flex-1">
              <div className={cn(filterPillInputClass, 'gap-2')}>
                <Select
                  value={selectedTemplateId || '__none__'}
                  onValueChange={(v) => (v === '__none__' ? setSelectedTemplateId('') : handleLoadTemplate(v))}
                >
                  <SelectTrigger className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus:ring-0">
                    <SelectValue placeholder="Selecione um modelo salvo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                  disabled={!selectedTemplateId}
                  onClick={handleDeleteTemplate}
                  title="Excluir modelo selecionado"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </FilterField>
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 rounded-full border-dashed"
              onClick={() => setShowSaveRow((v) => !v)}
            >
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Salvar modelo
            </Button>
          </div>
          {showSaveRow && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Nome do modelo (ex.: Vencendo + Bombeiros)"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="rounded-full border-input sm:flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button type="button" className="rounded-full" onClick={handleSave}>
                Guardar
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Aba / contexto">
              <div className={filterPillInputClass}>
                <Select
                  value={draft.activeTab}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, activeTab: v as AlvarasFilterSnapshot['activeTab'] }))
                  }
                >
                  <SelectTrigger className="h-9 w-full border-0 bg-transparent px-0 shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TAB_LABELS) as AlvarasFilterSnapshot['activeTab'][]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {TAB_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterField>

            <FilterField label="Busca" className="sm:col-span-2">
              <div className={cn(filterPillInputClass, 'gap-2 pl-3')}>
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Cliente, CNPJ ou tipo de alvará..."
                  value={draft.searchTerm}
                  onChange={(e) => setDraft((d) => ({ ...d, searchTerm: e.target.value }))}
                  className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </FilterField>

            <FilterField label={showProcessing ? 'Andamento (novos)' : showStatusOverview ? 'Situação (vencimento)' : '—'}>
              <div className={cn('min-w-0', !showProcessing && !showStatusOverview && 'opacity-50')}>
                {showProcessing ? (
                  <MultiCheckboxPill
                    options={[...PROCESSING_KEYS]}
                    labels={PROCESSING_LABELS}
                    selected={draft.processingFilters}
                    onChange={(processingFilters) => setDraft((d) => ({ ...d, processingFilters }))}
                    placeholder="Vazio = todos os andamentos."
                  />
                ) : showStatusOverview ? (
                  <MultiCheckboxPill
                    options={[...STATUS_OVERVIEW_KEYS]}
                    labels={STATUS_OVERVIEW_LABELS}
                    selected={draft.statusFilters}
                    onChange={(statusFilters) =>
                      setDraft((d) => ({
                        ...d,
                        statusFilters: statusFilters as AlvaraStatus[],
                      }))
                    }
                    placeholder="Vazio = todas as situações de vencimento."
                  />
                ) : (
                  <div className="flex h-9 w-full items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    Use os filtros ao lado
                  </div>
                )}
              </div>
            </FilterField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterField label="Tipo de alvará">
              <MultiCheckboxPill
                options={[...availableTypes]}
                labels={typeLabels}
                selected={draft.typeFilter}
                onChange={(typeFilter) => setDraft((d) => ({ ...d, typeFilter }))}
                placeholder="Vazio significa todos os tipos."
              />
            </FilterField>
            <FilterField label="Status na tabela" className="sm:col-span-2 lg:col-span-3">
              <MultiCheckboxPill
                options={statusColumnOptions}
                labels={statusColumnLabels}
                selected={draft.statusColumnFilter}
                onChange={(statusColumnFilter) => setDraft((d) => ({ ...d, statusColumnFilter }))}
                placeholder="Inclui Pendente, Ativo, Vencendo, Vencido, Isento e SPF."
              />
            </FilterField>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-full bg-[#58698D] px-8 text-base font-semibold text-white hover:bg-[#4a5a7a]"
            onClick={handleApply}
          >
            <Check className="mr-2 h-5 w-5" />
            Aplicar filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
