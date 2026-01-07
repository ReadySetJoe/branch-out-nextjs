import { useState, useRef } from "react";

interface LocationInputProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
  onCurrentLocation: () => void;
  loading: boolean;
}

export default function LocationInput({
  onLocationSelect,
  onCurrentLocation,
  loading,
}: LocationInputProps) {
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
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          inputValue
        )}&format=json&limit=5`
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
      name: result.display_name,
    });
    setSearchResults([]);
    setInputValue("");
  };

  return (
    <div className="w-full max-w-lg">
      <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex flex-col gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Search for a city
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchLocation()}
                placeholder="Enter a city or address..."
                className="input flex-1"
                disabled={loading || searching}
              />
              <button
                onClick={searchLocation}
                disabled={loading || searching || !inputValue.trim()}
                className="btn"
              >
                {searching ? (
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--border)]"></div>
            <span className="text-[var(--text-muted)] text-sm">or</span>
            <div className="flex-1 h-px bg-[var(--border)]"></div>
          </div>

          {/* Current Location Button */}
          <button
            onClick={onCurrentLocation}
            disabled={loading}
            className="btn-secondary flex items-center justify-center gap-2 w-full"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Use Current Location
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mt-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden animate-fade-in">
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => selectLocation(result)}
              className="w-full text-left px-4 py-3 hover:bg-[var(--surface-hover)] border-b border-[var(--border)] last:border-b-0 transition-colors"
            >
              <div className="font-medium text-white">
                {result.display_name.split(",")[0]}
              </div>
              <div className="text-sm text-[var(--text-muted)] truncate">
                {result.display_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
