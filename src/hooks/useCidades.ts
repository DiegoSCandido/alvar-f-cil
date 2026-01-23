import { useState, useEffect } from 'react';

interface Cidade {
  id: number;
  nome: string;
}

interface Estado {
  id: number;
  nome: string;
  sigla: string;
}

export function useCidades(uf: string) {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uf || uf.trim() === '') {
      setCidades([]);
      setError(null);
      return;
    }

    const buscarCidades = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log(`[useCidades] Buscando cidades para UF: ${uf}`);

        // Buscar UF ID primeiro
        const ufsResponse = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!ufsResponse.ok) {
          throw new Error(`Erro ao buscar estados: ${ufsResponse.status} ${ufsResponse.statusText}`);
        }

        const ufs = await ufsResponse.json();
        
        if (!Array.isArray(ufs)) {
          console.error('[useCidades] Resposta não é um array:', ufs);
          throw new Error('Resposta inválida da API de estados');
        }

        console.log(`[useCidades] UFs encontrados: ${ufs.length}`);

        const estadoSelecionado = ufs.find((estado: Estado) => estado.sigla === uf.toUpperCase());

        if (!estadoSelecionado) {
          setError(`Estado ${uf} não encontrado`);
          setCidades([]);
          console.warn(`[useCidades] Estado ${uf} não encontrado`);
          return;
        }

        console.log(`[useCidades] Estado encontrado: ${estadoSelecionado.nome} (ID: ${estadoSelecionado.id})`);

        // Buscar cidades do estado
        const cidadesResponse = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado.id}/municipios`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        if (!cidadesResponse.ok) {
          throw new Error(`Erro ao buscar cidades: ${cidadesResponse.status} ${cidadesResponse.statusText}`);
        }

        const cidadesData = await cidadesResponse.json();

        if (!Array.isArray(cidadesData)) {
          console.error('[useCidades] Cidades não é um array:', cidadesData);
          throw new Error('Resposta inválida da API de cidades');
        }

        console.log(`[useCidades] Cidades encontradas: ${cidadesData.length}`);

        // Validar dados antes de ordenar
        const cidadesValidas = cidadesData.filter(
          (cidade) => cidade && typeof cidade.nome === 'string' && typeof cidade.id === 'number'
        );

        console.log(`[useCidades] Cidades válidas: ${cidadesValidas.length}`);

        // Ordenar alfabeticamente com fallback seguro
        const cidadesOrdenadas = cidadesValidas.sort((a: Cidade, b: Cidade) => {
          try {
            return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
          } catch (err) {
            // Fallback simples se localeCompare falhar
            return a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0;
          }
        });

        setCidades(cidadesOrdenadas);
        console.log(`[useCidades] Cidades carregadas com sucesso!`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido ao buscar cidades';
        setError(message);
        console.error('[useCidades] Erro completo:', err);
        setCidades([]);
      } finally {
        setIsLoading(false);
      }
    };

    buscarCidades();
  }, [uf]);

  return { cidades, isLoading, error };
}

