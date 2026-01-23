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
}

export function AlvaraProcessingStatusSelect({
  value,
  onValueChange,
  disabled = false,
}: AlvaraProcessingStatusSelectProps) {
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
        {PROCESSING_STATUS_OPTIONS.map((option) => {
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
