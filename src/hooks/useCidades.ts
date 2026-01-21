import { useState, useEffect } from 'react';

interface Cidade {
  id: number;
  nome: string;
}

export function useCidades(uf: string) {
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uf) {
      setCidades([]);
      return;
    }

    const buscarCidades = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Buscar UF ID primeiro
        const ufsResponse = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        const ufs = await ufsResponse.json();
        const estadoSelecionado = ufs.find((estado: any) => estado.sigla === uf);

        if (!estadoSelecionado) {
          setError('Estado não encontrado');
          return;
        }

        // Buscar cidades do estado
        const cidadesResponse = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado.id}/municipios`
        );
        const cidadesData = await cidadesResponse.json();

        // Ordenar alfabeticamente
        const cidadesOrdenadas = cidadesData.sort((a: Cidade, b: Cidade) =>
          a.nome.localeCompare(b.nome, 'pt-BR')
        );

        setCidades(cidadesOrdenadas);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar cidades';
        setError(message);
        console.error('Erro ao buscar cidades:', err);
      } finally {
        setIsLoading(false);
      }
    };

    buscarCidades();
  }, [uf]);

  return { cidades, isLoading, error };
}
