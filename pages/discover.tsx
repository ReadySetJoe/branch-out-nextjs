import Spinner from "@/components/spinner";
import LocationInput from "@/components/location-input";
import EventFilters from "@/components/event-filters";
import EventCard from "@/components/event-card";
import ProgressSteps from "@/components/progress-steps";
import {
  ScanningProgress,
  PartialResultsWarning,
  ResultsHeader,
  PlaylistSuccess,
  NoResults,
  Pagination,
} from "@/components/discover";
import { useDiscoverData } from "@/hooks/useDiscoverData";

export default function Discover() {
  const {
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
  } = useDiscoverData();

  if (status === "loading") {
    return <Spinner message="Loading..." />;
  }

  return (
    <main className="min-h-screen">
      {loadingMessage && <Spinner message={loadingMessage} />}

      {session && session.user && (
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome back, {session.user.name?.split(" ")[0]}
            </h2>
            <p className="text-[var(--text-secondary)]">
              Let&apos;s find concerts featuring artists you&apos;ll love.
            </p>
          </div>

          <ProgressSteps steps={progressSteps} />

          {/* Location Selection */}
          {allArtists.length > 0 && !location && (
            <div className="mb-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-4">
                Where are you looking for events?
              </h3>
              <div className="flex justify-center">
                <LocationInput
                  onLocationSelect={handleLocationSelect}
                  onCurrentLocation={findCurrentLocation}
                  loading={!!loadingMessage || loadingEvents}
                />
              </div>
            </div>
          )}

          {/* Filters and Results */}
          {location && (
            <div className="flex flex-col items-center">
              <div className="w-full max-w-2xl">
                <EventFilters
                  onFiltersChange={setFilters}
                  disabled={loadingEvents}
                />
              </div>

              {scanProgress && (
                <ScanningProgress
                  current={scanProgress.current}
                  total={scanProgress.total}
                  matchCount={matchedEvents.length}
                />
              )}

              {partialResults && !scanProgress && (
                <PartialResultsWarning message={partialResults} />
              )}

              {filteredAndSortedEvents.length > 0 && (
                <ResultsHeader
                  totalEvents={filteredAndSortedEvents.length}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onExportPlaylist={createPlaylist}
                  hasMatches={matchedEvents.length > 0}
                  disabled={loadingEvents}
                />
              )}
            </div>
          )}

          {playlist && <PlaylistSuccess playlistUri={playlist.uri} />}

          {/* Events Grid */}
          {displayedEvents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {displayedEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          )}

          {/* No Results */}
          {location &&
            events.length > 0 &&
            matchedEvents.length === 0 &&
            !loadingEvents &&
            !scanProgress && <NoResults />}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={loadingEvents}
            />
          )}
        </div>
      )}
    </main>
  );
}
