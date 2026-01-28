interface ScanningProgressProps {
  current: number;
  total: number;
  matchCount: number;
}

export default function ScanningProgress({
  current,
  total,
  matchCount,
}: ScanningProgressProps) {
  return (
    <div className="w-full max-w-xl mb-6 p-4 rounded-xl bg-[var(--surface)] border border-[var(--primary)]/30">
      <div className="flex items-center justify-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        <p className="text-[var(--text-secondary)]">
          Scanning events... (page {current} of {total})
          {matchCount > 0 && (
            <span className="text-[var(--primary)] font-medium ml-2">
              {matchCount} matches found
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
