interface PlaylistSuccessProps {
  playlistUri: string;
}

export default function PlaylistSuccess({ playlistUri }: PlaylistSuccessProps) {
  return (
    <div className="mb-6 p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 max-w-xl mx-auto">
      <div className="flex items-center justify-center gap-3">
        <svg
          className="w-5 h-5 text-[var(--primary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <p className="text-[var(--text-secondary)]">
          Playlist created!{" "}
          <a
            href={playlistUri}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--primary)] hover:underline"
          >
            Open in Spotify
          </a>
        </p>
      </div>
    </div>
  );
}
