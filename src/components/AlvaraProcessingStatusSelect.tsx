import { AlvaraProcessingStatus } from '@/types/alvara';
import { PROCESSING_STATUS_OPTIONS } from '@/lib/processing-status-options';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


interface AlvaraProcessingStatusSelectProps {
  value?: AlvaraProcessingStatus;
  onValueChange: (status: AlvaraProcessingStatus) => void;
  disabled?: boolean;
  onlyInitialOptions?: boolean; // se true, mostra só opções iniciais
}

export function AlvaraProcessingStatusSelect({
  value,
  onValueChange,
  disabled = false,
  onlyInitialOptions = false,
}: AlvaraProcessingStatusSelectProps) {
  // Filtra opções se necessário
  const options = onlyInitialOptions
    ? PROCESSING_STATUS_OPTIONS.filter(
        (opt) => opt.value === 'lançado' || opt.value === 'aguardando_cliente' || opt.value === 'aguardando_orgao'
      ).map((opt) =>
        opt.value === 'lançado'
          ? { ...opt, label: 'Iniciado' } // renomeia label
          : opt
      )
    : PROCESSING_STATUS_OPTIONS;

  return (
    <Select
      value={value || ''}
      onValueChange={(val) => onValueChange(val as AlvaraProcessingStatus)}
      disabled={disabled}
    >
      <SelectTrigger id="processingStatus" className={disabled ? 'bg-muted cursor-not-allowed' : ''}>
        <SelectValue placeholder="Selecione o status" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
