/* eslint-disable @next/next/no-img-element */
import { MatchedEvent } from "@/lib/artist-matcher";
import { useState } from "react";

interface EventCardProps {
  event: MatchedEvent;
  index: number;
}

export default function EventCard({ event, index }: EventCardProps) {
  const [imageError, setImageError] = useState(false);
  const [artistImageErrors, setArtistImageErrors] = useState<Set<string>>(
    new Set()
  );

  const handleArtistImageError = (artistId: string) => {
    setArtistImageErrors(prev => new Set(prev).add(artistId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getPriceRange = () => {
    if (!event.priceRanges || event.priceRanges.length === 0) return null;
    const min = Math.min(...event.priceRanges.map(p => p.min));
    const max = Math.max(...event.priceRanges.map(p => p.max));

    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  };

  // Get better quality image
  const getEventImage = () => {
    if (!event.images || event.images.length === 0) return null;
    // Try to find a 16:9 ratio image with good resolution
    const preferred = event.images.find(
      img => img.url.includes("RETINA") || img.url.includes("TABLET")
    );
    return preferred?.url || event.images[0]?.url;
  };

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noreferrer"
      className="card flex flex-col group"
    >
      {/* Event Image */}
      <div className="relative aspect-[16/9] bg-[var(--surface-hover)] overflow-hidden">
        {getEventImage() && !imageError ? (
          <img
            src={getEventImage()!}
            alt={event.name}
            loading={index > 3 ? "lazy" : "eager"}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
        )}

        {/* Match Score Badge */}
        {event.matchScore && (
          <div className="absolute top-3 right-3 badge">
            {Math.round(event.matchScore * 100)}% Match
          </div>
        )}

        {/* Date Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8">
          <p className="text-white text-sm font-medium">
            {formatDate(event.dates.start.localDate)}
            {event.dates.start.localTime && (
              <span className="text-white/70 ml-2">
                {new Date(
                  `2000-01-01T${event.dates.start.localTime}`
                ).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Event Name */}
        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
          {event.name}
        </h3>

        {/* Venue */}
        <div className="flex items-start gap-2 mb-3">
          <svg
            className="w-4 h-4 text-[var(--text-muted)] mt-0.5 flex-shrink-0"
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
          <div className="text-sm">
            <p className="text-[var(--text-secondary)]">
              {event._embedded?.venues?.[0]?.name || "Venue TBA"}
            </p>
            {event._embedded?.venues?.[0]?.city && (
              <p className="text-[var(--text-muted)] text-xs">
                {event._embedded.venues[0].city.name}
                {event._embedded.venues[0].state &&
                  `, ${event._embedded.venues[0].state.stateCode}`}
              </p>
            )}
          </div>
        </div>

        {/* Matched Artists */}
        {event.matchedArtists && event.matchedArtists.length > 0 && (
          <div className="mt-auto pt-3 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Your artists:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {event.matchedArtists.slice(0, 3).map(match => (
                <div
                  key={match.spotifyArtist.id}
                  className="flex items-center gap-1.5 bg-[var(--surface-hover)] rounded-full pl-1 pr-2.5 py-0.5"
                >
                  {match.spotifyArtist.images &&
                  match.spotifyArtist.images[0] &&
                  !artistImageErrors.has(match.spotifyArtist.id) ? (
                    <img
                      src={match.spotifyArtist.images[0].url}
                      alt={match.spotifyArtist.name}
                      onError={() =>
                        handleArtistImageError(match.spotifyArtist.id)
                      }
                      className="w-5 h-5 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[var(--border)] flex items-center justify-center">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {match.spotifyArtist.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {match.spotifyArtist.name}
                  </span>
                </div>
              ))}
              {event.matchedArtists.length > 3 && (
                <span className="text-xs text-[var(--text-muted)] self-center ml-1">
                  +{event.matchedArtists.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Price */}
        {getPriceRange() && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">From</span>
            <span className="text-sm font-semibold text-[var(--primary)]">
              {getPriceRange()}
            </span>
          </div>
        )}
      </div>
    </a>
  );
}
