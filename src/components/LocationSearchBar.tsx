import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, Clock, X, Loader2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useGeocodingSearch from "@/hooks/useGeocodingSearch";

interface LocationSearchBarProps {
  onLocationSelect: (coordinates: [number, number], address: string) => void;
  onLocationClear?: () => void;
  placeholder?: string;
  mapboxToken: string;
  currentLocation?: [number, number];
  className?: string;
}

const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onLocationSelect,
  onLocationClear,
  placeholder = "Buscar por endereço ou bairro",
  mapboxToken,
  currentLocation,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showPopularSuggestions, setShowPopularSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    results,
    isLoading,
    error,
    selectedResult,
    searchLocation,
    selectResult,
    clearResults,
    getPopularNeighborhoods,
    formatResultText,
    getPlaceType,
    hasResults,
  } = useGeocodingSearch(mapboxToken);

  // Busca com debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 3) {
        searchLocation(query, currentLocation);
        setShowSuggestions(true);
      } else {
        clearResults();
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchLocation, clearResults, currentLocation]);

  // Carrega pesquisas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentLocationSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Salva pesquisa recente
  const saveRecentSearch = (searchTerm: string) => {
    const updated = [
      searchTerm,
      ...recentSearches.filter((s) => s !== searchTerm),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentLocationSearches", JSON.stringify(updated));
  };

  // Manipula seleção de resultado
  const handleResultSelect = (result: any) => {
    const [longitude, latitude] = result.center;
    const address = formatResultText(result);

    setQuery(address);
    selectResult(result);
    setShowSuggestions(false);
    setShowPopularSuggestions(false);

    saveRecentSearch(address);
    onLocationSelect([longitude, latitude], address);
  };

  // Manipula mudança no input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length === 0) {
      setShowPopularSuggestions(true);
      setShowSuggestions(false);
    } else {
      setShowPopularSuggestions(false);
    }
  };

  // Manipula foco no input
  const handleInputFocus = () => {
    if (query.length === 0) {
      setShowPopularSuggestions(true);
    } else if (hasResults) {
      setShowSuggestions(true);
    }
  };

  // Limpa busca
  const handleClear = () => {
    setQuery("");
    clearResults();
    setShowSuggestions(false);
    setShowPopularSuggestions(false);
    onLocationClear?.();
    inputRef.current?.focus();
  };

  // Obtém localização atual
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada pelo seu navegador");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        setQuery("📍 Sua localização atual");
        onLocationSelect(coordinates, "Sua localização atual");
        setShowSuggestions(false);
        setShowPopularSuggestions(false);
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        alert(
          "Não foi possível obter sua localização. Verifique as permissões."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Manipula clique em pesquisa recente
  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    setShowPopularSuggestions(false);
    searchLocation(search, currentLocation);
    setShowSuggestions(true);
  };

  // Manipula clique em sugestão popular
  const handlePopularSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowPopularSuggestions(false);
    searchLocation(suggestion, currentLocation);
    setShowSuggestions(true);
  };

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowPopularSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const popularNeighborhoods = getPopularNeighborhoods();

  return (
    <div className={`relative ${className}`}>
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10 pr-20"
          autoComplete="off"
        />

        {/* Botões de ação */}
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}

          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGetCurrentLocation}
            className="h-6 w-6 p-0"
            title="Usar minha localização"
          >
            <Navigation className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="absolute top-full mt-1 w-full z-50 bg-red-50 border border-red-200 rounded-md p-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Sugestões de resultados de busca */}
      {showSuggestions && hasResults && (
        <div
          ref={suggestionsRef}
          className="absolute top-full mt-1 w-full z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          <div className="p-2">
            <p className="text-xs text-gray-500 mb-2">Resultados da busca</p>
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultSelect(result)}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-md flex items-start gap-3 transition-colors"
              >
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{result.text}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {formatResultText(result)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getPlaceType(result)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Relevância: {Math.round(result.relevance * 100)}%
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sugestões populares e recentes */}
      {showPopularSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute top-full mt-1 w-full z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto"
        >
          <div className="p-2">
            {/* Pesquisas recentes */}
            {recentSearches.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pesquisas recentes
                </p>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-md flex items-center gap-3 transition-colors"
                  >
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm truncate">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Bairros populares */}
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Bairros populares em São Paulo
              </p>
              {popularNeighborhoods.slice(0, 8).map((neighborhood, index) => (
                <button
                  key={index}
                  onClick={() => handlePopularSuggestionClick(neighborhood)}
                  className="w-full text-left p-2 hover:bg-gray-50 rounded-md flex items-center gap-3 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm">{neighborhood}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearchBar;
