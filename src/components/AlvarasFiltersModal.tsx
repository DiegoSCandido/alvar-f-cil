import { useEffect, useId, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { AlvaraStatus } from '@/types/alvara';
import {
  type AlvarasFilterSnapshot,
  type ProcessingFilterValue,
  type SavedAlvarasFilterTemplate,
  listAlvarasFilterTemplates,
  saveAlvarasFilterTemplate,
  deleteAlvarasFilterTemplate,
} from '@/lib/alvaras-filter-templates';
import { Check, ChevronDown, Clock, Search, Trash2, BookmarkPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const pillInput =
  'flex min-h-10 w-full items-center rounded-full border border-input bg-background px-3 shadow-sm';

const PROCESSING_OPTIONS: { value: ProcessingFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'lançado', label: 'Iniciado' },
  { value: 'aguardando_cliente', label: 'Aguardando cliente' },
  { value: 'aguardando_orgao', label: 'Aguardando órgão' },
];

const STATUS_OVERVIEW_OPTIONS: { value: AlvaraStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'valid', label: 'Válidos' },
  { value: 'expiring', label: 'Vencendo' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'pending', label: 'Pendente' },
];

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

function MultiCheckboxPill({
  options,
  labels,
  selected,
  onChange,
  placeholder,
}: {
  options: string[];
  labels: Record<string, string>;
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => {
    if (selected.length === 0 || selected.length === options.length) return 'Todos';
    if (selected.length === 1) return labels[selected[0]] ?? selected[0];
    return `${selected.length} selecionados`;
  }, [selected, options.length, labels, options]);

  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  };

  const selectAll = () => {
    if (selected.length === options.length) onChange([]);
    else onChange([...options]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            pillInput,
            'justify-between gap-2 text-left text-sm text-foreground'
          )}
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
        <div className="border-b px-3 py-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 text-sm font-medium"
            onClick={selectAll}
          >
            <Checkbox
              checked={options.length > 0 && selected.length === options.length}
              className="pointer-events-none"
            />
            Selecionar todos
          </button>
        </div>
        <ScrollArea className="h-[220px]">
          <div className="space-y-2 p-3">
            {options.map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  id={`${uid}-${opt}`}
                  checked={selected.includes(opt)}
                  onCheckedChange={() => toggle(opt)}
                />
                <label htmlFor={`${uid}-${opt}`} className="cursor-pointer text-sm leading-tight">
                  {labels[opt] ?? opt}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          {placeholder}
        </div>
      </PopoverContent>
    </Popover>
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
      setDraft(initial);
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
    if (t) setDraft({ ...t.snapshot });
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
              <div className={cn(pillInput, 'gap-2')}>
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
              <div className={pillInput}>
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
              <div className={cn(pillInput, 'gap-2 pl-3')}>
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
              <div className={cn(pillInput, !showProcessing && !showStatusOverview && 'opacity-50')}>
                {showProcessing ? (
                  <Select
                    value={draft.processingFilter}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, processingFilter: v as ProcessingFilterValue }))
                    }
                  >
                    <SelectTrigger className="h-9 w-full border-0 bg-transparent px-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCESSING_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : showStatusOverview ? (
                  <Select
                    value={draft.statusFilter}
                    onValueChange={(v) =>
                      setDraft((d) => ({ ...d, statusFilter: v as AlvaraStatus | 'all' }))
                    }
                  >
                    <SelectTrigger className="h-9 w-full border-0 bg-transparent px-0 shadow-none focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OVERVIEW_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
