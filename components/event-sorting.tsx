import { SortOption } from "@/lib/artist-matcher";

interface EventSortingProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  disabled?: boolean;
}

export default function EventSorting({ sortBy, onSortChange, disabled }: EventSortingProps) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <label className="text-sm font-medium text-gray-700">Sort by:</label>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="match">Best Match</option>
        <option value="date">Date (Soonest First)</option>
        <option value="price">Price (Low to High)</option>
        <option value="name">Event Name (A-Z)</option>
      </select>
    </div>
  );
}