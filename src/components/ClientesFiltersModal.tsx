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
import {
  type ClientesFilterSnapshot,
  type SavedClientesFilterTemplate,
  CLIENTES_COLUNA_OPTIONS,
  CLIENTES_OPCAO_OPTIONS,
  CLIENTES_NIVEL3_OPTIONS,
  listClientesFilterTemplates,
  saveClientesFilterTemplate,
  deleteClientesFilterTemplate,
  migrateClientesFilterSnapshot,
} from '@/lib/clientes-filters';
import { MultiCheckboxPill, filterPillInputClass } from '@/components/MultiCheckboxPill';
import { Check, Search, Trash2, BookmarkPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TAB_LABELS: Record<ClientesFilterSnapshot['activeTab'], string> = {
  ativos: 'Clientes ativos',
  inativos: 'Clientes inativos',
};

interface ClientesFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ClientesFilterSnapshot;
  onApply: (snapshot: ClientesFilterSnapshot) => void;
}

function FilterField({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div>
        <Label className="text-sm font-semibold text-foreground/90">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function ClientesFiltersModal({
  open,
  onOpenChange,
  initial,
  onApply,
}: ClientesFiltersModalProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<ClientesFilterSnapshot>(initial);
  const [templates, setTemplates] = useState<SavedClientesFilterTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [saveName, setSaveName] = useState('');
  const [showSaveRow, setShowSaveRow] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(migrateClientesFilterSnapshot(initial));
      setTemplates(listClientesFilterTemplates());
      setSelectedTemplateId('');
      setSaveName('');
      setShowSaveRow(false);
    }
  }, [open, initial]);

  const nivel3Labels = useMemo(() => {
    const m: Record<string, string> = {};
    CLIENTES_NIVEL3_OPTIONS.forEach((o) => {
      m[o.value] = o.label;
    });
    return m;
  }, []);

  const nivel3Keys = useMemo(() => CLIENTES_NIVEL3_OPTIONS.map((o) => o.value), []);

  const apiBloqueado = !draft.nivel1Coluna?.trim();

  const applySnapshot = (s: ClientesFilterSnapshot) => {
    onApply(s);
    onOpenChange(false);
  };

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    try {
      saveClientesFilterTemplate(name, draft);
      setTemplates(listClientesFilterTemplates());
      setSaveName('');
      setShowSaveRow(false);
      toast({ title: 'Modelo salvo', description: `“${name}” foi guardado neste navegador.` });
    } catch {
      toast({
        title: 'Não foi possível salvar',
        description: 'Informe um nome para o modelo.',
        variant: 'destructive',
      });
    }
  };

  const handleLoadTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) setDraft(migrateClientesFilterSnapshot(t.snapshot));
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplateId) return;
    deleteClientesFilterTemplate(selectedTemplateId);
    setTemplates(listClientesFilterTemplates());
    setSelectedTemplateId('');
  };

  const setNivel1 = (v: string) => {
    const col = v === '__none__' ? '' : v;
    setDraft((d) => ({
      ...d,
      nivel1Coluna: col,
      nivel2Opcao: '',
      nivel3Refinamento: [],
    }));
  };

  const setNivel2 = (v: string) => {
    const op = v === '__none__' ? '' : v;
    setDraft((d) => ({
      ...d,
      nivel2Opcao: op,
      nivel3Refinamento: [],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[min(100vw-1rem,920px)] gap-0 overflow-y-auto p-0 pr-10 pt-12 sm:rounded-xl">
        <div className="border-b bg-muted/30 px-6 py-4">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-semibold">Filtros em camadas</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Filtro 1 define a coluna; filtro 2 a opção da API; filtro 3 refina por situação dos alvarás do
              cliente (ex.: taxas pagas e depois vencendo ou sem alvará).
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
                placeholder="Nome do modelo"
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

        <div className="space-y-6 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FilterField label="Lista">
              <div className={filterPillInputClass}>
                <Select
                  value={draft.activeTab}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, activeTab: v as ClientesFilterSnapshot['activeTab'] }))
                  }
                >
                  <SelectTrigger className="h-9 w-full border-0 bg-transparent px-0 shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TAB_LABELS) as ClientesFilterSnapshot['activeTab'][]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {TAB_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterField>

            <FilterField label="Busca">
              <div className={cn(filterPillInputClass, 'gap-2 pl-3')}>
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="Razão social, CNPJ ou município..."
                  value={draft.searchTerm}
                  onChange={(e) => setDraft((d) => ({ ...d, searchTerm: e.target.value }))}
                  className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </FilterField>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Critérios da API (ordem)
            </p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FilterField
                label="Filtro 1 — Coluna"
                hint="Área do cadastro (sanitário, bombeiros, funcionamento, taxas)."
              >
                <div className={filterPillInputClass}>
                  <Select value={draft.nivel1Coluna || '__none__'} onValueChange={setNivel1}>
                    <SelectTrigger className="h-9 w-full border-0 bg-transparent px-0 shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Todos</SelectItem>
                      {CLIENTES_COLUNA_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FilterField>

              <FilterField
                label="Filtro 2 — Opção"
                hint="Ex.: Paga (taxas), Vencendo, Em renovação… Depende do filtro 1."
              >
                <div className={cn(filterPillInputClass, apiBloqueado && 'opacity-50')}>
                  <Select
                    value={draft.nivel2Opcao || '__none__'}
                    onValueChange={setNivel2}
                    disabled={apiBloqueado}
                  >
                    <SelectTrigger className="h-9 w-full border-0 bg-transparent px-0 shadow-none focus:ring-0">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Todos</SelectItem>
                      {CLIENTES_OPCAO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FilterField>
            </div>
          </div>

          <FilterField
            label="Filtro 3 — Refino por alvará"
            hint="Considera só os alvarás do tipo da coluna (ex.: Taxas/Funcionamento → só alvará de funcionamento). Múltipla escolha em OR. Vazio = não refinar."
            className="lg:col-span-2"
          >
            <MultiCheckboxPill
              options={nivel3Keys}
              labels={nivel3Labels}
              selected={draft.nivel3Refinamento}
              onChange={(nivel3Refinamento) => setDraft((d) => ({ ...d, nivel3Refinamento }))}
              placeholder="Opcional: refine por situação real dos alvarás."
            />
          </FilterField>
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="rounded-full bg-[#58698D] px-8 text-base font-semibold text-white hover:bg-[#4a5a7a]"
            onClick={() => applySnapshot(draft)}
          >
            <Check className="mr-2 h-5 w-5" />
            Aplicar filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
