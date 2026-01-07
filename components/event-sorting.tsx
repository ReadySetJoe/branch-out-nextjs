import { SortOption } from "@/lib/artist-matcher";

interface EventSortingProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  disabled?: boolean;
}

export default function EventSorting({
  sortBy,
  onSortChange,
  disabled,
}: EventSortingProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-[var(--text-muted)]">Sort:</label>
      <select
        value={sortBy}
        onChange={e => onSortChange(e.target.value as SortOption)}
        disabled={disabled}
        className="input py-1.5 px-3 text-sm w-auto"
      >
        <option value="match">Best Match</option>
        <option value="date">Date</option>
        <option value="price">Price</option>
        <option value="name">Name</option>
      </select>
    </div>
  );
}
