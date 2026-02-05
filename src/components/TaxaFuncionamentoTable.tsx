import React, { useEffect, useState } from 'react';
import { clienteAPI, taxaAPI } from '@/lib/api-client';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Cliente {
  id: string;
  razaoSocial: string;
  cnpj: string;
}

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const clientesRes = await clienteAPI.list();
      setClientes(clientesRes);
      const taxasRes = await taxaAPI.list(ANO_ATUAL);
      const taxasMap: Record<string, TaxaCliente> = {};
      if (Array.isArray(taxasRes)) {
        taxasRes.forEach(t => { taxasMap[t.clienteId] = t; });
      }
      setTaxas(taxasMap);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleCheckbox = async (clienteId: string, campo: 'gerada'|'enviada'|'paga', checked: boolean) => {
    const taxa = taxas[clienteId] || {
      clienteId,
      ano: ANO_ATUAL,
      gerada: false,
      enviada: false,
      paga: false,
      protocolo: ''
    };
    const novaTaxa = { ...taxa, [campo]: checked };
    try {
      if (taxa.id) {
        await taxaAPI.update(taxa.id, novaTaxa);
      } else {
        const res = await taxaAPI.create(novaTaxa);
        novaTaxa.id = res.id;
      }
      setTaxas({ ...taxas, [clienteId]: novaTaxa });
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

  const handleProtocoloChange = async (clienteId: string, protocolo: string) => {
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
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Gerada</TableHead>
            <TableHead>Enviada</TableHead>
            <TableHead>Paga</TableHead>
            <TableHead>Protocolo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map(cliente => {
            const taxa = taxas[cliente.id] || { gerada: false, enviada: false, paga: false, protocolo: '' };
            return (
              <TableRow key={cliente.id}>
                <TableCell>{cliente.razaoSocial}</TableCell>
                <TableCell>{cliente.cnpj}</TableCell>
                <TableCell>
                  <Checkbox checked={!!taxa.gerada} onCheckedChange={checked => handleCheckbox(cliente.id, 'gerada', !!checked)} />
                </TableCell>
                <TableCell>
                  <Checkbox checked={!!taxa.enviada} onCheckedChange={checked => handleCheckbox(cliente.id, 'enviada', !!checked)} />
                </TableCell>
                <TableCell>
                  <Checkbox checked={!!taxa.paga} onCheckedChange={checked => handleCheckbox(cliente.id, 'paga', !!checked)} />
                </TableCell>
                <TableCell>
                  <Input value={taxa.protocolo || ''} onChange={e => handleProtocoloChange(cliente.id, e.target.value)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
