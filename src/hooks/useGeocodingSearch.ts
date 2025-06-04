import { useState, useCallback } from "react";

interface SearchResult {
  id: string;
  place_name: string;
  place_type: string[];
  relevance: number;
  properties: {
    wikidata?: string;
    short_code?: string;
  };
  text: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  context?: Array<{
    id: string;
    short_code?: string;
    wikidata?: string;
    text: string;
  }>;
}

interface GeocodingState {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  selectedResult: SearchResult | null;
}

const useGeocodingSearch = (mapboxToken: string) => {
  const [state, setState] = useState<GeocodingState>({
    results: [],
    isLoading: false,
    error: null,
    selectedResult: null,
  });

  // Busca por endereço ou local
  const searchLocation = useCallback(
    async (query: string, proximity?: [number, number]) => {
      if (!query.trim()) {
        setState((prev) => ({ ...prev, results: [], error: null }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Constrói URL da API de geocoding do Mapbox
        let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxToken}`;

        // Adiciona parâmetros para melhorar a busca no Brasil
        url += "&country=BR"; // Limita busca ao Brasil
        url += "&language=pt"; // Idioma português
        url += "&limit=10"; // Limita a 10 resultados
        url += "&types=place,postcode,locality,neighborhood,address"; // Tipos de locais

        // Adiciona proximidade se fornecida (prioriza resultados próximos)
        if (proximity) {
          url += `&proximity=${proximity[0]},${proximity[1]}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Erro na busca: ${response.status}`);
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          results: data.features || [],
          isLoading: false,
        }));

        return data.features || [];
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao buscar localização";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          results: [],
        }));
        throw error;
      }
    },
    [mapboxToken]
  );

  // Busca reversa (de coordenadas para endereço)
  const reverseGeocode = useCallback(
    async (longitude: number, latitude: number) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&language=pt&types=address,poi`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Erro na busca reversa: ${response.status}`);
        }

        const data = await response.json();

        const result = data.features?.[0] || null;

        setState((prev) => ({
          ...prev,
          selectedResult: result,
          isLoading: false,
        }));

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao buscar endereço";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw error;
      }
    },
    [mapboxToken]
  );

  // Seleciona um resultado
  const selectResult = useCallback((result: SearchResult) => {
    setState((prev) => ({ ...prev, selectedResult: result }));
  }, []);

  // Limpa resultados
  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      results: [],
      selectedResult: null,
      error: null,
    }));
  }, []);

  // Obtém sugestões de bairros populares de São Paulo
  const getPopularNeighborhoods = useCallback(() => {
    return [
      "Vila Madalena, São Paulo",
      "Itaim Bibi, São Paulo",
      "Pinheiros, São Paulo",
      "Consolação, São Paulo",
      "Vila Olímpia, São Paulo",
      "Moema, São Paulo",
      "Jardins, São Paulo",
      "Centro, São Paulo",
      "Liberdade, São Paulo",
      "Bela Vista, São Paulo",
      "Santa Cecília, São Paulo",
      "Perdizes, São Paulo",
      "Higienópolis, São Paulo",
      "Tatuapé, São Paulo",
      "Ipiranga, São Paulo",
    ];
  }, []);

  // Formata o resultado para exibição
  const formatResultText = useCallback((result: SearchResult) => {
    // Se tem contexto (bairro, cidade, etc), monta o endereço completo
    if (result.context && result.context.length > 0) {
      const addressParts = [result.text];

      result.context.forEach((ctx) => {
        if (ctx.text && !addressParts.includes(ctx.text)) {
          addressParts.push(ctx.text);
        }
      });

      return addressParts.join(", ");
    }

    return result.place_name;
  }, []);

  // Obtém o tipo do local (bairro, cidade, etc)
  const getPlaceType = useCallback((result: SearchResult) => {
    const typeMap: Record<string, string> = {
      neighborhood: "Bairro",
      locality: "Localidade",
      place: "Cidade",
      postcode: "CEP",
      address: "Endereço",
      poi: "Ponto de Interesse",
      region: "Estado",
      country: "País",
    };

    const primaryType = result.place_type?.[0];
    return typeMap[primaryType] || "Local";
  }, []);

  return {
    // Estado
    ...state,

    // Ações
    searchLocation,
    reverseGeocode,
    selectResult,
    clearResults,

    // Utilitários
    getPopularNeighborhoods,
    formatResultText,
    getPlaceType,

    // Status
    hasResults: state.results.length > 0,
    hasSelected: !!state.selectedResult,
  };
};

export default useGeocodingSearch;
