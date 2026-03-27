import { useId, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const filterPillInputClass =
  'flex min-h-10 w-full items-center rounded-full border border-input bg-background px-3 shadow-sm';

export function MultiCheckboxPill({
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
            filterPillInputClass,
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
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">{placeholder}</div>
      </PopoverContent>
    </Popover>
  );
}
