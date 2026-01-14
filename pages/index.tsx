/* eslint-disable @next/next/no-img-element */
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState, useMemo } from "react";
import Spinner from "@/components/spinner";
import Landing from "@/components/landing";
import LocationInput from "@/components/location-input";
import EventFilters from "@/components/event-filters";
import EventSorting from "@/components/event-sorting";
import EventCard from "@/components/event-card";
import ProgressSteps from "@/components/progress-steps";
import {
  matchEventsWithArtists,
  filterEvents,
  sortEvents,
  type MatchedEvent,
  type EventFilters as Filters,
  type SortOption,
} from "@/lib/artist-matcher";

interface Artist {
  id: string;
  name: string;
  images?: { url: string }[];
}

interface Playlist {
  id: string;
  name: string;
  uri: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<Artist[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    name?: string;
  } | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [matchedEvents, setMatchedEvents] = useState<MatchedEvent[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  // Filter and sort states
  const [filters, setFilters] = useState<{
    dateFrom?: string;
    dateTo?: string;
    radius: number;
    priceMin?: number;
    priceMax?: number;
  }>({ radius: 50 });
  const [sortBy, setSortBy] = useState<SortOption>("match");

  // Pagination - now client-side over matched events
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [scanProgress, setScanProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [partialResults, setPartialResults] = useState<string | null>(null);
  const EVENTS_PER_PAGE = 12;

  // Progress steps
  const progressSteps = useMemo(() => {
    const steps: Array<{
      id: string;
      label: string;
      status: "pending" | "loading" | "completed" | "error";
      error?: string;
    }> = [
      {
        id: "artists",
        label:
          topArtists.length > 0
            ? `Found ${topArtists.length} top artists and ${relatedArtists.length} related artists`
            : "Fetching your music taste from Spotify",
        status: loadingMessage?.includes("artist")
          ? "loading"
          : topArtists.length > 0
          ? "completed"
          : "pending",
      },
      {
        id: "location",
        label: location
          ? `Location: ${location.name || "Current location"}`
          : "Select your location",
        status: loadingMessage?.includes("location")
          ? "loading"
          : location
          ? "completed"
          : "pending",
      },
      {
        id: "events",
        label:
          events.length > 0
            ? `Found ${events.length} events in your area`
            : "Search for events",
        status: loadingEvents
          ? "loading"
          : events.length > 0
          ? "completed"
          : location
          ? "pending"
          : "pending",
      },
      {
        id: "matches",
        label:
          matchedEvents.length > 0
            ? `Matched ${matchedEvents.length} events with your music taste`
            : "Match events with your artists",
        status:
          matchedEvents.length > 0
            ? "completed"
            : events.length > 0
            ? "pending"
            : "pending",
      },
    ];

    // Add error state if needed
    if (error) {
      const errorStep = steps.find(
        s =>
          (error.includes("artist") && s.id === "artists") ||
          (error.includes("location") && s.id === "location") ||
          (error.includes("event") && s.id === "events")
      );
      if (errorStep) {
        errorStep.status = "error";
        errorStep.error = error;
      }
    }

    return steps;
  }, [
    topArtists,
    relatedArtists,
    location,
    events,
    matchedEvents,
    loadingMessage,
    loadingEvents,
    error,
  ]);

  // Fetch artists on login
  useEffect(() => {
    if (session && !topArtists.length) {
      setLoadingMessage("Fetching your top artists...");
      setError(null);

      fetch(`/api/spotify/top-artists`)
        .then(res => res.json())
        .then(topData => {
          setTopArtists(topData.items);
          setLoadingMessage("Fetching related artists...");

          return fetch(
            `/api/spotify/related-artists?ids=${topData.items
              .map((artist: Artist) => artist.id)
              .join(",")}`
          )
            .then(res => res.json())
            .then(relatedData => ({ topItems: topData.items, relatedData }));
        })
        .then(({ topItems, relatedData }) => {
          setRelatedArtists(relatedData);
          // Combine top and related artists - use topItems directly, not stale state
          const combined = [...topItems, ...relatedData];
          const uniqueArtists = Array.from(
            new Map(combined.map(a => [a.id, a])).values()
          );
          setAllArtists(uniqueArtists);
          setLoadingMessage("");
        })
        .catch(error => {
          setError("Error fetching artists: " + error.message);
          setLoadingMessage("");
        });
    }
  }, [session, topArtists]);

  // Auto-fetch events when location changes
  useEffect(() => {
    if (location && allArtists.length > 0) {
      findAllEvents(location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, filters, allArtists]);

  const findAllEvents = async (loc: { lat: number; lng: number }) => {
    setLoadingEvents(true);
    setError(null);
    setEvents([]);
    setMatchedEvents([]);
    setCurrentPage(0);
    setScanProgress(null);
    setPartialResults(null);

    const allEvents: any[] = [];
    const allMatched: MatchedEvent[] = [];
    let page = 0;
    let totalPages = 1;
    let stoppedEarly = false;
    const MAX_PAGES = 5; // Cap at 5 pages to avoid rate limiting (5 * 200 = 1000 events max)

    // Fetch pages from the API until done or error
    while (page < totalPages && page < MAX_PAGES) {
      try {
        const params = new URLSearchParams({
          lat: loc.lat.toString(),
          lng: loc.lng.toString(),
          radius: filters.radius.toString(),
          page: page.toString(),
          size: "200", // Max page size to reduce total API calls
        });

        if (filters.dateFrom) params.append("startDateTime", filters.dateFrom);
        if (filters.dateTo) params.append("endDateTime", filters.dateTo);

        const response = await fetch(`/api/songkick/get-events?${params}`);
        const data = await response.json();

        if (data.error) {
          // API returned an error - stop fetching but keep what we have
          stoppedEarly = true;
          if (allEvents.length === 0) {
            // No events fetched yet, show error
            setError("Error fetching events: " + data.error);
          } else {
            // We have some events, show partial results message
            setPartialResults(
              `Showing partial results (${allEvents.length} events from ${page} of ${totalPages} pages due to API limit)`
            );
          }
          break;
        }

        // Update total pages from first response (capped at MAX_PAGES)
        if (page === 0) {
          totalPages = Math.min(data.pagination?.totalPages || 1, MAX_PAGES);
        }

        setScanProgress({ current: page + 1, total: totalPages });

        const pageEvents = data.events || [];
        allEvents.push(...pageEvents);

        // Match events from this page
        if (pageEvents.length > 0) {
          const matched = matchEventsWithArtists(pageEvents, allArtists, 0.7);
          allMatched.push(...matched);

          // Update state progressively so user sees results as they come in
          setEvents([...allEvents]);
          setMatchedEvents([...allMatched]);
        }

        page++;

        // Add delay between requests to avoid rate limiting (Ticketmaster limits ~5 req/sec)
        if (page < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 350));
        }
      } catch (error) {
        // Network or other error - stop fetching but keep what we have
        stoppedEarly = true;
        if (allEvents.length === 0) {
          setError("Error fetching events: " + (error as any).message);
        } else {
          setPartialResults(
            `Showing partial results (${allEvents.length} events from ${page} of ${totalPages} pages)`
          );
        }
        break;
      }
    }

    // Final state update
    if (!stoppedEarly && allEvents.length > 0) {
      setPartialResults(null);
    }

    setLoadingEvents(false);
    setScanProgress(null);
  };

  const handleLocationSelect = (selectedLocation: {
    lat: number;
    lng: number;
    name: string;
  }) => {
    setLocation(selectedLocation);
  };

  const findCurrentLocation = () => {
    setLoadingMessage("Finding your location...");
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Current Location",
          };
          setLocation(loc);
          setLoadingMessage("");
        },
        error => {
          setError("Error finding location: " + error.message);
          setLoadingMessage("");
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setLoadingMessage("");
    }
  };

  const createPlaylist = async () => {
    if (!matchedEvents.length) return;

    setLoadingMessage("Creating playlist...");

    // Get unique artist IDs from matched events
    const artistIds = new Set<string>();
    matchedEvents.forEach(event => {
      event.matchedArtists.forEach(match => {
        artistIds.add(match.spotifyArtist.id);
      });
    });

    try {
      const response = await fetch(
        `/api/spotify/create-playlist?ids=${Array.from(artistIds).join(",")}`
      );
      const data = await response.json();
      setPlaylist(data);
      setLoadingMessage("");
    } catch (error) {
      setError("Error creating playlist: " + (error as any).message);
      setLoadingMessage("");
    }
  };

  // Reset to first page when filters or sort changes
  useEffect(() => {
    setCurrentPage(0);
  }, [filters, sortBy]);

  // Apply filters and sorting to matched events
  const filteredAndSortedEvents = useMemo(() => {
    const eventFilters: Filters = {
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
    };

    const filtered = filterEvents(matchedEvents, eventFilters);
    return sortEvents(filtered, sortBy);
  }, [matchedEvents, filters, sortBy]);

  // Client-side pagination
  const totalPages = Math.ceil(
    filteredAndSortedEvents.length / EVENTS_PER_PAGE
  );
  const displayedEvents = useMemo(() => {
    const start = currentPage * EVENTS_PER_PAGE;
    return filteredAndSortedEvents.slice(start, start + EVENTS_PER_PAGE);
  }, [filteredAndSortedEvents, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen">
      {loadingMessage && <Spinner message={loadingMessage} />}

      {!session && <Landing />}

      {session && session.user && (
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome back, {session.user.name?.split(" ")[0]}
            </h2>
            <p className="text-[var(--text-secondary)]">
              Let&apos;s find concerts featuring artists you&apos;ll love.
            </p>
          </div>

          {/* Progress Steps */}
          <ProgressSteps steps={progressSteps} />

          {/* Location Selection */}
          {allArtists.length > 0 && !location && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Where are you looking for events?
              </h3>
              <LocationInput
                onLocationSelect={handleLocationSelect}
                onCurrentLocation={findCurrentLocation}
                loading={!!loadingMessage || loadingEvents}
              />
            </div>
          )}

          {/* Filters and Results */}
          {location && (
            <>
              <EventFilters
                onFiltersChange={setFilters}
                disabled={loadingEvents}
              />

              {/* Scanning Progress */}
              {scanProgress && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--surface)] border border-[var(--primary)]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                    <p className="text-[var(--text-secondary)]">
                      Scanning events... (page {scanProgress.current} of{" "}
                      {scanProgress.total})
                      {matchedEvents.length > 0 && (
                        <span className="text-[var(--primary)] font-medium ml-2">
                          {matchedEvents.length} matches found
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Partial Results Warning */}
              {partialResults && !scanProgress && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--surface)] border border-yellow-500/30">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-yellow-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <p className="text-[var(--text-secondary)] text-sm">
                      {partialResults}
                    </p>
                  </div>
                </div>
              )}

              {/* Results Header */}
              {filteredAndSortedEvents.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {filteredAndSortedEvents.length} Matching Events
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Showing page {currentPage + 1} of {totalPages || 1}
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <EventSorting
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      disabled={loadingEvents}
                    />
                    {matchedEvents.length > 0 && (
                      <button className="btn flex items-center gap-2" onClick={createPlaylist}>
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                        </svg>
                        Export Playlist
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Playlist Created Message */}
          {playlist && (
            <div className="mb-6 p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30">
              <div className="flex items-center gap-3">
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
                    href={playlist.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--primary)] hover:underline"
                  >
                    Open in Spotify
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Events Grid */}
          {displayedEvents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {displayedEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          )}

          {/* No Results Message */}
          {location &&
            events.length > 0 &&
            matchedEvents.length === 0 &&
            !loadingEvents &&
            !scanProgress && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface)] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[var(--text-muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-[var(--text-secondary)] mb-2">
                  No events found matching your music taste in this area.
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  Try adjusting your search radius or date range.
                </p>
              </div>
            )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0 || loadingEvents}
                className="btn-secondary px-4 py-2 flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>
              <div className="flex items-center gap-1 px-4">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (currentPage < 3) {
                    pageNum = i;
                  } else if (currentPage > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || loadingEvents}
                className="btn-secondary px-4 py-2 flex items-center gap-1"
              >
                Next
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
