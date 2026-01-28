import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  matchEventsWithArtists,
  filterEvents,
  sortEvents,
  type MatchedEvent,
  type EventFilters as Filters,
  type SortOption,
} from "@/lib/artist-matcher";

export interface Artist {
  id: string;
  name: string;
  images?: { url: string }[];
}

export interface Playlist {
  id: string;
  name: string;
  uri: string;
}

export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface FilterState {
  dateFrom?: string;
  dateTo?: string;
  radius: number;
  priceMin?: number;
  priceMax?: number;
}

export interface ScanProgress {
  current: number;
  total: number;
}

const EVENTS_PER_PAGE = 12;

export function useDiscoverData() {
  const { data: session, status } = useSession();
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<Artist[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [matchedEvents, setMatchedEvents] = useState<MatchedEvent[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  const [filters, setFilters] = useState<FilterState>({ radius: 100 });
  const [sortBy, setSortBy] = useState<SortOption>("date");

  const [currentPage, setCurrentPage] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [partialResults, setPartialResults] = useState<string | null>(null);

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

  const findAllEvents = useCallback(
    async (loc: Location) => {
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
      const MAX_PAGES = 5;

      while (page < totalPages && page < MAX_PAGES) {
        try {
          const params = new URLSearchParams({
            lat: loc.lat.toString(),
            lng: loc.lng.toString(),
            radius: filters.radius.toString(),
            page: page.toString(),
            size: "200",
          });

          if (filters.dateFrom) params.append("startDateTime", filters.dateFrom);
          if (filters.dateTo) params.append("endDateTime", filters.dateTo);

          const response = await fetch(`/api/songkick/get-events?${params}`);
          const data = await response.json();

          if (data.error) {
            stoppedEarly = true;
            if (allEvents.length === 0) {
              setError("Error fetching events: " + data.error);
            } else {
              setPartialResults(
                `Showing partial results (${allEvents.length} events from ${page} of ${totalPages} pages due to API limit)`
              );
            }
            break;
          }

          if (page === 0) {
            totalPages = Math.min(data.pagination?.totalPages || 1, MAX_PAGES);
          }

          setScanProgress({ current: page + 1, total: totalPages });

          const pageEvents = data.events || [];
          allEvents.push(...pageEvents);

          if (pageEvents.length > 0) {
            const matched = matchEventsWithArtists(pageEvents, allArtists, 0.7);
            allMatched.push(...matched);
            setEvents([...allEvents]);
            setMatchedEvents([...allMatched]);
          }

          page++;

          if (page < totalPages) {
            await new Promise(resolve => setTimeout(resolve, 350));
          }
        } catch (error) {
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

      if (!stoppedEarly && allEvents.length > 0) {
        setPartialResults(null);
      }

      setLoadingEvents(false);
      setScanProgress(null);
    },
    [filters, allArtists]
  );

  // Auto-fetch events when location changes
  useEffect(() => {
    if (location && allArtists.length > 0) {
      findAllEvents(location);
    }
  }, [location, filters, allArtists, findAllEvents]);

  const handleLocationSelect = useCallback((selectedLocation: Location) => {
    setLocation(selectedLocation);
  }, []);

  const findCurrentLocation = useCallback(() => {
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
  }, []);

  const createPlaylist = useCallback(async () => {
    if (!matchedEvents.length) return;

    setLoadingMessage("Creating playlist...");

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
  }, [matchedEvents]);

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
  const totalPages = Math.ceil(filteredAndSortedEvents.length / EVENTS_PER_PAGE);

  const displayedEvents = useMemo(() => {
    const start = currentPage * EVENTS_PER_PAGE;
    return filteredAndSortedEvents.slice(start, start + EVENTS_PER_PAGE);
  }, [filteredAndSortedEvents, currentPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return {
    session,
    status,
    allArtists,
    location,
    events,
    matchedEvents,
    loadingMessage,
    loadingEvents,
    scanProgress,
    partialResults,
    playlist,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    currentPage,
    totalPages,
    displayedEvents,
    filteredAndSortedEvents,
    progressSteps,
    handleLocationSelect,
    findCurrentLocation,
    createPlaylist,
    handlePageChange,
  };
}
