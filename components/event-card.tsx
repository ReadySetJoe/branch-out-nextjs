/* eslint-disable @next/next/no-img-element */
import { MatchedEvent } from "@/lib/artist-matcher";
import { useState } from "react";

interface EventCardProps {
  event: MatchedEvent;
  index: number;
}

export default function EventCard({ event, index }: EventCardProps) {
  const [imageError, setImageError] = useState(false);
  const [artistImageErrors, setArtistImageErrors] = useState<Set<string>>(new Set());

  const handleArtistImageError = (artistId: string) => {
    setArtistImageErrors(prev => new Set(prev).add(artistId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriceRange = () => {
    if (!event.priceRanges || event.priceRanges.length === 0) return null;
    const min = Math.min(...event.priceRanges.map(p => p.min));
    const max = Math.max(...event.priceRanges.map(p => p.max));
    const currency = event.priceRanges[0].currency;
    
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  };

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noreferrer"
      className="border border-gray-700 flex flex-col justify-between hover:shadow-lg transition-shadow rounded-lg overflow-hidden"
    >
      {/* Main Event Image with Lazy Loading */}
      <div className="relative h-48 bg-gray-200">
        {event.images && event.images.length > 0 && !imageError ? (
          <img
            src={event.images[0]?.url}
            alt={event.name}
            loading={index > 5 ? "lazy" : "eager"}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500">No image available</span>
          </div>
        )}
        
        {/* Match Score Badge */}
        {event.matchScore && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {Math.round(event.matchScore * 100)}% Match
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Event Name */}
        <h3 className="text-lg font-bold mb-2 line-clamp-2">{event.name}</h3>

        {/* Matched Artists Section */}
        {event.matchedArtists && event.matchedArtists.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">Your artists performing:</p>
            <div className="flex flex-wrap gap-2">
              {event.matchedArtists.map((match) => (
                <div 
                  key={match.spotifyArtist.id}
                  className="flex items-center gap-1 bg-gray-100 rounded-full pr-2"
                >
                  {match.spotifyArtist.images && match.spotifyArtist.images[0] && !artistImageErrors.has(match.spotifyArtist.id) ? (
                    <img
                      src={match.spotifyArtist.images[0].url}
                      alt={match.spotifyArtist.name}
                      onError={() => handleArtistImageError(match.spotifyArtist.id)}
                      className="w-6 h-6 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300" />
                  )}
                  <span className="text-sm font-medium">{match.spotifyArtist.name}</span>
                  {match.confidence < 1 && (
                    <span className="text-xs text-gray-500">
                      ({Math.round(match.confidence * 100)}%)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Attractions */}
        {event._embedded?.attractions && (
          <div className="text-sm text-gray-600 mb-2">
            <p className="font-medium">Lineup:</p>
            <p className="line-clamp-2">
              {event._embedded.attractions.map(a => a.name).join(", ")}
            </p>
          </div>
        )}

        {/* Event Details */}
        <div className="mt-auto pt-3 border-t border-gray-200">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {event._embedded?.venues?.[0]?.name || "Unknown Venue"}
              </p>
              {event._embedded?.venues?.[0]?.city && (
                <p className="text-xs text-gray-500">
                  {event._embedded.venues[0].city.name}
                  {event._embedded.venues[0].state && `, ${event._embedded.venues[0].state.stateCode}`}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(event.dates.start.localDate)}
              </p>
            </div>
            <div className="text-right">
              {getPriceRange() && (
                <p className="text-sm font-semibold text-green-600">
                  {getPriceRange()}
                </p>
              )}
              {event.dates.start.localTime && (
                <p className="text-xs text-gray-500">
                  {new Date(`2000-01-01T${event.dates.start.localTime}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}