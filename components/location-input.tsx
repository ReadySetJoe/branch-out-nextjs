import { useState, useRef, useEffect } from "react";

interface LocationInputProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void;
  onCurrentLocation: () => void;
  loading: boolean;
}

export default function LocationInput({ onLocationSelect, onCurrentLocation, loading }: LocationInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchCache = useRef<Map<string, any[]>>(new Map());

  const searchLocation = async () => {
    if (!inputValue.trim()) return;
    
    // Check cache first
    const cacheKey = inputValue.toLowerCase().trim();
    if (searchCache.current.has(cacheKey)) {
      setSearchResults(searchCache.current.get(cacheKey)!);
      return;
    }
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=json&limit=5`
      );
      const data = await response.json();
      
      // Cache the results
      searchCache.current.set(cacheKey, data);
      
      // Limit cache size to 50 entries
      if (searchCache.current.size > 50) {
        const firstKey = searchCache.current.keys().next().value;
        if (firstKey) {
          searchCache.current.delete(firstKey);
        }
      }
      
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching location:", error);
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (result: any) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name
    });
    setSearchResults([]);
    setInputValue("");
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchLocation()}
            placeholder="Enter a city or address..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || searching}
          />
          <button
            onClick={searchLocation}
            disabled={loading || searching || !inputValue.trim()}
            className="btn"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        
        <button
          onClick={onCurrentLocation}
          disabled={loading}
          className="btn w-full"
        >
          Use Current Location
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => selectLocation(result)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
            >
              <div className="font-medium">{result.display_name.split(",")[0]}</div>
              <div className="text-sm text-gray-600">{result.display_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}