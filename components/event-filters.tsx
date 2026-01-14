import { useState, useEffect, useRef } from "react";

interface EventFiltersProps {
  onFiltersChange: (filters: {
    dateFrom?: string;
    dateTo?: string;
    radius: number;
  }) => void;
  disabled?: boolean;
}

export default function EventFilters({
  onFiltersChange,
  disabled,
}: EventFiltersProps) {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [radius, setRadius] = useState<number>(100);
  const [debouncedRadius, setDebouncedRadius] = useState<number>(100);
  const [isExpanded, setIsExpanded] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Set default dates (today to 6 months from now)
  useEffect(() => {
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    setDateFrom(today.toISOString().split("T")[0]);
    setDateTo(sixMonthsLater.toISOString().split("T")[0]);
  }, []);

  // Debounce radius changes - only trigger API call after user stops dragging
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedRadius(radius);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [radius]);

  useEffect(() => {
    onFiltersChange({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      radius: debouncedRadius,
    });
  }, [dateFrom, dateTo, debouncedRadius, onFiltersChange]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Any";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="w-full mb-6">
      {/* Collapsed Summary */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Radius Badge */}
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[var(--text-muted)]"
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
            </svg>
            <span className="text-sm text-[var(--text-secondary)]">
              {radius} miles
            </span>
          </div>

          {/* Date Range Badge */}
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-[var(--text-secondary)]">
              {formatDate(dateFrom)} - {formatDate(dateTo)}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="btn-sm flex items-center gap-1"
        >
          <svg
            className={`w-4 h-4 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {isExpanded ? "Hide" : "Filters"}
        </button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-2 p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Search Radius */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                Search Radius
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={radius}
                  onChange={e => setRadius(parseInt(e.target.value))}
                  disabled={disabled}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>10 mi</span>
                  <span className="font-medium text-[var(--primary)]">
                    {radius} miles
                  </span>
                  <span>200 mi</span>
                </div>
              </div>
            </div>
            <br />

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                disabled={disabled}
                className="input"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                disabled={disabled}
                min={dateFrom}
                className="input"
              />
            </div>

            {/* Quick Select */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                Quick Select
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    const nextWeek = new Date();
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    setDateFrom(today.toISOString().split("T")[0]);
                    setDateTo(nextWeek.toISOString().split("T")[0]);
                  }}
                  disabled={disabled}
                  className="btn-sm"
                >
                  This Week
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setDateFrom(today.toISOString().split("T")[0]);
                    setDateTo(nextMonth.toISOString().split("T")[0]);
                  }}
                  disabled={disabled}
                  className="btn-sm"
                >
                  This Month
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
