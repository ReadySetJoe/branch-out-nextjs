import { useState, useEffect } from "react";

interface EventFiltersProps {
  onFiltersChange: (filters: {
    dateFrom?: string;
    dateTo?: string;
    radius: number;
    priceMin?: number;
    priceMax?: number;
  }) => void;
  disabled?: boolean;
}

export default function EventFilters({ onFiltersChange, disabled }: EventFiltersProps) {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [radius, setRadius] = useState<number>(50);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Set default dates (today to 6 months from now)
  useEffect(() => {
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    
    setDateFrom(today.toISOString().split('T')[0]);
    setDateTo(sixMonthsLater.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    onFiltersChange({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      radius,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
    });
  }, [dateFrom, dateTo, radius, priceMin, priceMax, onFiltersChange]);

  return (
    <div className="w-full max-w-4xl mb-6 border border-gray-300 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Event Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 hover:text-blue-700"
          disabled={disabled}
        >
          {isExpanded ? "Hide" : "Show"} Filters
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={disabled}
              min={dateFrom}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Radius: {radius} miles
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10mi</span>
              <span>200mi</span>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price ($)
            </label>
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              disabled={disabled}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price ($)
            </label>
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              disabled={disabled}
              placeholder="500"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Select
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setDateFrom(today.toISOString().split('T')[0]);
                  setDateTo(nextWeek.toISOString().split('T')[0]);
                }}
                disabled={disabled}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
              >
                Next Week
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const nextMonth = new Date();
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setDateFrom(today.toISOString().split('T')[0]);
                  setDateTo(nextMonth.toISOString().split('T')[0]);
                }}
                disabled={disabled}
                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
              >
                Next Month
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {!isExpanded && (
        <div className="text-sm text-gray-600">
          Showing events within {radius} miles from {dateFrom || "any date"} to {dateTo || "any date"}
          {(priceMin || priceMax) && `, $${priceMin || "0"} - $${priceMax || "∞"}`}
        </div>
      )}
    </div>
  );
}