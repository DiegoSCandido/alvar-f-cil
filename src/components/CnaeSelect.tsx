import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, X } from 'lucide-react';
import { CNAE_LIST } from '@/lib/cnae-data';

export interface CnaeOption {
  codigo: string;
  descricao: string;
}

interface CnaeSelectProps {
  label: string;
  codigoValue: string;
  descricaoValue: string;
  onSelect: (codigo: string, descricao: string) => void;
}

export function CnaeSelect({
  label,
  codigoValue,
  descricaoValue,
  onSelect,
}: CnaeSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtradas, setFiltradas] = useState<CnaeOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atualizar filtrados conforme digita
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length === 0) {
      setFiltradas(CNAE_LIST.slice(0, 50)); // Mostra primeiras 50
    } else {
      const q = query.toLowerCase();
      const resultado = CNAE_LIST.filter(
        (opt) => {
          // Validar que opt existe e tem propriedades válidas
          if (!opt || !opt.codigo || !opt.descricao) return false;
          return (
            opt.codigo.toLowerCase().includes(q) ||
            opt.descricao.toLowerCase().includes(q)
          );
        }
      );
      setFiltradas(resultado.slice(0, 100)); // Limita a 100 resultados
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setSearchQuery('');
      setFiltradas(CNAE_LIST.slice(0, 50)); // Mostra primeiras 50 ao abrir
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSelect = (codigo: string, descricao: string) => {
    onSelect(codigo, descricao);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onSelect('', '');
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="cnae-select">{label}</Label>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="cnae-select"
            variant="outline"
            className="w-full justify-between"
          >
            <span className="truncate text-left">
              {descricaoValue || 'Selecionar atividade...'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-4 space-y-4">
            {/* Input de busca */}
            <Input
              ref={inputRef}
              placeholder="Buscar por código ou descrição..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />

            {/* Área de resultados */}
            {filtradas.length > 0 ? (
              <ScrollArea className="h-80 border rounded">
                <ul className="divide-y">
                  {filtradas.map((opt) => (
                    <li key={opt.codigo}>
                      <button
                        type="button"
                        onClick={() => handleSelect(opt.codigo, opt.descricao)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 transition"
                      >
                        <div className="font-medium text-sm text-gray-400">{opt.codigo}</div>
                        <div className="text-xs text-gray-600">{opt.descricao}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                {searchQuery
                  ? 'Nenhuma atividade encontrada'
                  : 'Nenhuma atividade disponível'}
              </div>
            )}

            {/* Informações */}
            {codigoValue && (
              <div className="pt-2 border-t space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Selecionado:</span>
                  <div className="text-xs text-gray-400 font-mono">{codigoValue}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Mostrar código selecionado abaixo */}
      {codigoValue && (
        <div className="text-xs text-gray-400 mt-1">
          Código: <span className="font-mono font-medium">{codigoValue}</span>
        </div>
      )}
    </div>
  );
}
