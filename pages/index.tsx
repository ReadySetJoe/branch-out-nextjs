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

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(false);

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
      findEvents(location, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, filters, allArtists]);

  const findEvents = async (
    loc: { lat: number; lng: number },
    page: number = 0
  ) => {
    setLoadingEvents(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: loc.lat.toString(),
        lng: loc.lng.toString(),
        radius: filters.radius.toString(),
        page: page.toString(),
      });

      if (filters.dateFrom) params.append("startDateTime", filters.dateFrom);
      if (filters.dateTo) params.append("endDateTime", filters.dateTo);

      const response = await fetch(`/api/songkick/get-events?${params}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setEvents(data.events || []);
      setTotalPages(data.pagination?.totalPages || 0);
      setCurrentPage(page);

      // Automatically match events with artists
      if (data.events && data.events.length > 0) {
        // Debug: Log event structure to understand matching
        console.log("Events from API:", data.events.length);
        console.log("Sample event:", JSON.stringify(data.events[0], null, 2));
        console.log(
          "Sample attractions:",
          data.events[0]?._embedded?.attractions
        );
        console.log("All artists count:", allArtists.length);

        const matched = matchEventsWithArtists(data.events, allArtists, 0.7);
        console.log("Matched events:", matched.length);
        setMatchedEvents(matched);
      } else {
        setMatchedEvents([]);
      }
    } catch (error) {
      setError("Error fetching events: " + (error as any).message);
      setEvents([]);
      setMatchedEvents([]);
    } finally {
      setLoadingEvents(false);
    }
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

  // Apply filters and sorting to matched events
  const displayedEvents = useMemo(() => {
    const eventFilters: Filters = {
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
    };

    const filtered = filterEvents(matchedEvents, eventFilters);
    return sortEvents(filtered, sortBy);
  }, [matchedEvents, filters, sortBy]);

  const handlePageChange = (newPage: number) => {
    if (location) {
      findEvents(location, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <main className="flex flex-col container mx-auto p-4">
      {loadingMessage && <Spinner message={loadingMessage} />}

      {!session && <Landing />}

      {session && session.user && (
        <>
          <h2 className="text-2xl font-bold mb-2">
            Welcome, {session.user.name}
          </h2>
          <p className="text-gray-600 mb-6">
            Let&apos;s find concerts near you featuring artists you&apos;ll
            love.
          </p>

          {/* Progress Steps */}
          <ProgressSteps steps={progressSteps} />

          {/* Location Selection */}
          {allArtists.length > 0 && !location && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Where are you looking for events?
              </h3>
              <LocationInput
                onLocationSelect={handleLocationSelect}
                onCurrentLocation={findCurrentLocation}
                loading={!!loadingMessage || loadingEvents}
              />
            </div>
          )}

          {/* Filters and Sorting */}
          {location && (
            <>
              <EventFilters
                onFiltersChange={setFilters}
                disabled={loadingEvents}
              />

              {matchedEvents.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="text-lg font-semibold">
                      {displayedEvents.length} Matching Events
                    </h3>
                  </div>
                  <div className="flex gap-4 items-center">
                    <EventSorting
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                      disabled={loadingEvents}
                    />
                    {matchedEvents.length > 0 && (
                      <button className="btn" onClick={createPlaylist}>
                        Export to Playlist
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Playlist Created Message */}
          {playlist && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded-lg">
              <p className="text-green-700">
                Created playlist:{" "}
                <a
                  href={playlist.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline"
                >
                  {playlist.name}
                </a>
              </p>
            </div>
          )}

          {/* Events Grid */}
          {displayedEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {displayedEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          )}

          {/* No Results Message */}
          {location &&
            events.length > 0 &&
            matchedEvents.length === 0 &&
            !loadingEvents && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-2">
                  No events found matching your music taste in this area.
                </p>
                <p className="text-sm text-gray-500">
                  Try adjusting your search radius or date range.
                </p>
              </div>
            )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0 || loadingEvents}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || loadingEvents}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
