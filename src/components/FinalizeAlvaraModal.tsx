import { useState } from "react";
import { formatDateSafe } from "@/lib/alvara-utils";
import { CalendarIcon, FileText, Upload, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FinalizeAlvaraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinalize?: (data: { expirationDate: Date; file: File | null }) => void;
}

export function FinalizeAlvaraModal({
  open,
  onOpenChange,
  onFinalize,
}: FinalizeAlvaraModalProps) {
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFinalize = () => {
    if (expirationDate) {
      onFinalize?.({ expirationDate, file });
      onOpenChange(false);
      setExpirationDate(undefined);
      setFile(null);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setExpirationDate(undefined);
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span>Finalizar Alvará</span>
              <p className="text-sm font-normal text-muted-foreground mt-0.5">
                Informe os dados para concluir o alvará
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Data de Vencimento <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11",
                    !expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? (
                    formatDateSafe(expirationDate)
                  ) : (
                    <span>dd/mm/aaaa</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Upload do Documento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Documento do Alvará (PDF) <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-11 px-3 rounded-md border border-input bg-background flex items-center">
                {file ? (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="truncate">{file.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Nenhum arquivo selecionado
                  </span>
                )}
              </div>
              <label htmlFor="alvara-file">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4" />
                    Anexar arquivo
                  </span>
                </Button>
                <input
                  id="alvara-file"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-muted/30 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={!expirationDate}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Finalizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
