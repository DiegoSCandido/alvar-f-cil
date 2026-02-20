import React, { useEffect, useState, useRef } from 'react';
import { clienteAPI, taxaAPI } from '@/lib/api-client';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useClienteModal } from '@/contexts/ClienteModalContext';
import { Cliente } from '@/types/cliente';


interface TaxaCliente {
  id?: string;
  clienteId: string;
  ano: number;
  gerada: boolean;
  enviada: boolean;
  paga: boolean;
  protocolo: string;
}

const ANO_ATUAL = new Date().getFullYear();

export default function TaxaFuncionamentoTable() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [taxas, setTaxas] = useState<Record<string, TaxaCliente>>({});
  const [protocoloValues, setProtocoloValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { openModal } = useClienteModal();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    clienteId: string;
    campo: 'gerada' | 'enviada' | 'paga';
    clienteNome: string;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const clientesRes = await clienteAPI.list();
      setClientes(clientesRes);
      const taxasRes = await taxaAPI.list(ANO_ATUAL);
      const taxasMap: Record<string, TaxaCliente> = {};
      const protocoloMap: Record<string, string> = {};
      if (Array.isArray(taxasRes)) {
        taxasRes.forEach(t => { 
          taxasMap[t.clienteId] = t;
          protocoloMap[t.clienteId] = t.protocolo || '';
        });
      }
      setTaxas(taxasMap);
      setProtocoloValues(protocoloMap);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleCheckbox = (clienteId: string, campo: 'gerada'|'enviada'|'paga', checked: boolean) => {
    // Se está desmarcando (checked = false), pedir confirmação
    if (!checked) {
      const cliente = clientes.find(c => c.id === clienteId);
      setConfirmDialog({
        open: true,
        clienteId,
        campo,
        clienteNome: cliente?.razaoSocial || 'Cliente'
      });
      return;
    }

    // Se está marcando, executar diretamente
    executeCheckboxChange(clienteId, campo, checked);
  };

  const executeCheckboxChange = async (clienteId: string, campo: 'gerada'|'enviada'|'paga', checked: boolean) => {
    const taxa = taxas[clienteId] || {
      clienteId,
      ano: ANO_ATUAL,
      gerada: false,
      enviada: false,
      paga: false,
      protocolo: ''
    };
    const protocoloAtual = protocoloValues[clienteId] ?? taxa.protocolo ?? '';
    const novaTaxa = { ...taxa, [campo]: checked, protocolo: protocoloAtual };
    try {
      if (taxa.id) {
        await taxaAPI.update(taxa.id, novaTaxa);
      } else {
        const res = await taxaAPI.create(novaTaxa);
        novaTaxa.id = res.id;
      }
      setTaxas({ ...taxas, [clienteId]: novaTaxa });
      // Garante que o protocoloValues está sincronizado
      if (!protocoloValues[clienteId] && protocoloAtual) {
        setProtocoloValues({ ...protocoloValues, [clienteId]: protocoloAtual });
      }
      toast({ title: 'Salvo com sucesso!', description: `Alteração salva para ${campo}.` });
    } catch (error) {
      console.error('Erro ao salvar taxa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar';
      toast({ 
        title: 'Erro ao salvar', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  };

  const handleConfirmUncheck = async () => {
    if (!confirmDialog) return;
    await executeCheckboxChange(confirmDialog.clienteId, confirmDialog.campo, false);
    setConfirmDialog(null);
  };

  const handleProtocoloInputChange = (clienteId: string, protocolo: string) => {
    // Atualiza o estado local imediatamente para uma resposta visual rápida
    setProtocoloValues({ ...protocoloValues, [clienteId]: protocolo });

    // Limpa o timer anterior se existir
    if (debounceTimers.current[clienteId]) {
      clearTimeout(debounceTimers.current[clienteId]);
    }

    // Cria um novo timer para salvar após 1 segundo de inatividade
    debounceTimers.current[clienteId] = setTimeout(() => {
      handleProtocoloSave(clienteId, protocolo);
    }, 1000);
  };

  const handleProtocoloBlur = (clienteId: string) => {
    // Salva imediatamente quando o usuário sai do campo
    const protocolo = protocoloValues[clienteId] || '';
    if (debounceTimers.current[clienteId]) {
      clearTimeout(debounceTimers.current[clienteId]);
      delete debounceTimers.current[clienteId];
    }
    handleProtocoloSave(clienteId, protocolo);
  };

  const handleProtocoloSave = async (clienteId: string, protocolo: string) => {
    const taxa = taxas[clienteId] || {
      clienteId,
      ano: ANO_ATUAL,
      gerada: false,
      enviada: false,
      paga: false,
      protocolo: ''
    };
    const novaTaxa = { ...taxa, protocolo };
    try {
      if (taxa.id) {
        await taxaAPI.update(taxa.id, novaTaxa);
      } else {
        const res = await taxaAPI.create(novaTaxa);
        novaTaxa.id = res.id;
      }
      setTaxas({ ...taxas, [clienteId]: novaTaxa });
      toast({ title: 'Salvo com sucesso!', description: 'Protocolo atualizado.' });
    } catch (error) {
      console.error('Erro ao salvar protocolo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar';
      toast({ 
        title: 'Erro ao salvar', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      // Reverte o valor em caso de erro
      setProtocoloValues({ ...protocoloValues, [clienteId]: taxa.protocolo || '' });
    }
  };

  // Calcular totais
  const totalGeradas = Object.values(taxas).filter(t => t.gerada).length;
  const totalEnviadas = Object.values(taxas).filter(t => t.enviada).length;
  const totalPagas = Object.values(taxas).filter(t => t.paga).length;

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    </div>
  );

  // Mobile: card layout; Desktop: table layout
  return (
    <>
      {/* Cards com totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Total de Taxas Geradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalGeradas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Total de Taxas Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalEnviadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Total de Taxas Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalPagas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Alteração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja desmarcar <b>{confirmDialog?.campo === 'gerada' ? 'Gerada' : confirmDialog?.campo === 'enviada' ? 'Enviada' : 'Paga'}</b> para o cliente <b>{confirmDialog?.clienteNome}</b>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Não</Button>
            <Button variant="destructive" onClick={handleConfirmUncheck}>Sim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Mobile Card Layout */}
      <div className="space-y-3 lg:hidden">
        {clientes.map(cliente => {
          const taxa = taxas[cliente.id] || { gerada: false, enviada: false, paga: false, protocolo: '' };
          const protocoloValue = protocoloValues[cliente.id] !== undefined 
            ? protocoloValues[cliente.id] 
            : (taxa.protocolo || '');
          return (
            <div key={cliente.id} className="bg-card rounded-lg border shadow-sm p-3 sm:p-4 space-y-3">
              <div className="min-w-0">
                <p 
                  className="font-medium text-sm sm:text-base truncate cursor-pointer hover:text-primary transition-colors" 
                  title={cliente.razaoSocial}
                  onClick={() => openModal(cliente)}
                >
                  {cliente.razaoSocial}
                </p>
                <p className="text-xs text-muted-foreground font-mono">{cliente.cnpj}</p>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <label className="flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer">
                  <Checkbox checked={!!taxa.gerada} onCheckedChange={checked => handleCheckbox(cliente.id, 'gerada', !!checked)} />
                  <span>Gerada</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer">
                  <Checkbox checked={!!taxa.enviada} onCheckedChange={checked => handleCheckbox(cliente.id, 'enviada', !!checked)} />
                  <span>Enviada</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer">
                  <Checkbox checked={!!taxa.paga} onCheckedChange={checked => handleCheckbox(cliente.id, 'paga', !!checked)} />
                  <span>Paga</span>
                </label>
              </div>
              <Input 
                value={protocoloValue} 
                onChange={e => handleProtocoloInputChange(cliente.id, e.target.value)}
                onBlur={() => handleProtocoloBlur(cliente.id)}
                placeholder="Protocolo"
                className="text-sm"
              />
            </div>
          );
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-sm min-w-[200px]">Cliente</TableHead>
                <TableHead className="font-semibold text-sm whitespace-nowrap">CNPJ</TableHead>
                <TableHead className="font-semibold text-sm text-center">Gerada</TableHead>
                <TableHead className="font-semibold text-sm text-center">Enviada</TableHead>
                <TableHead className="font-semibold text-sm text-center">Paga</TableHead>
                <TableHead className="font-semibold text-sm min-w-[180px]">Protocolo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map(cliente => {
                const taxa = taxas[cliente.id] || { gerada: false, enviada: false, paga: false, protocolo: '' };
                const protocoloValue = protocoloValues[cliente.id] !== undefined 
                  ? protocoloValues[cliente.id] 
                  : (taxa.protocolo || '');
                return (
                  <TableRow key={cliente.id} className="text-sm">
                    <TableCell className="font-medium min-w-[200px] max-w-[300px]">
                      <div 
                        className="truncate cursor-pointer hover:text-primary transition-colors" 
                        title={cliente.razaoSocial}
                        onClick={() => openModal(cliente)}
                      >
                        {cliente.razaoSocial}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground whitespace-nowrap">{cliente.cnpj}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={!!taxa.gerada} onCheckedChange={checked => handleCheckbox(cliente.id, 'gerada', !!checked)} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={!!taxa.enviada} onCheckedChange={checked => handleCheckbox(cliente.id, 'enviada', !!checked)} />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={!!taxa.paga} onCheckedChange={checked => handleCheckbox(cliente.id, 'paga', !!checked)} />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={protocoloValue} 
                        onChange={e => handleProtocoloInputChange(cliente.id, e.target.value)}
                        onBlur={() => handleProtocoloBlur(cliente.id)}
                        placeholder="Protocolo"
                        className="text-sm"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
