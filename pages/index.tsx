/* eslint-disable @next/next/no-img-element */
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import Checkmark from "@/components/checkmark";
import Landing from "@/components/landing";

interface Artist {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  url: string;
  images: { url: string }[];
  performance: { artist: { displayName: string } }[];
  dates: { start: { localDate: string } };
  _embedded?: {
    attractions?: { id: string; name: string }[];
    venues?: { name: string }[];
  };
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
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [artistsInEvents, setArtistsInEvents] = useState<Event[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    if (session && !topArtists.length) {
      setLoadingMessage("Fetching top artists...");
      fetch(`/api/spotify/top-artists`)
        .then(res => res.json())
        .then(data => {
          setTopArtists(data.items);
          setLoadingMessage("Fetching related artists...");
          fetch(
            `/api/spotify/related-artists?ids=${data.items
              .map((artist: Artist) => artist.id)
              .join(",")}`
          )
            .then(res => res.json())
            .then(data => {
              setRelatedArtists(data);
            })
            .catch(error =>
              setError("Error fetching related artists: " + error.message)
            )
            .finally(() => setLoadingMessage(""));
        })
        .catch(error =>
          setError("Error fetching top artists: " + error.message)
        );
    }
  }, [session, topArtists]);

  const findEvents = async (location: GeolocationPosition) => {
    setLoadingMessage("Finding events near you...");
    setError(null);
    try {
      const response = await fetch(
        `/api/songkick/get-events?lat=${location?.coords.latitude}&lng=${location?.coords.longitude}`
      );
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      setError("Error fetching events: " + (error as any).message);
    } finally {
      setLoadingMessage("");
    }
  };

  const findLocation = () => {
    setLoadingMessage("Finding your location...");
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation(position);
          setLoadingMessage("");
          findEvents(position);
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

  const findArtistsInEvents = () => {
    const artistNames = relatedArtists.map(artist => artist.name);
    const eventsWithArtists = events.filter(event =>
      artistNames.some(artistName => event.name.includes(artistName))
    );
    const uniqueEvents = eventsWithArtists.filter(
      (event, index, self) =>
        index === self.findIndex(e => e.name === event.name)
    );
    setArtistsInEvents(uniqueEvents);
  };

  const createPlaylist = async () => {
    const artistNames = artistsInEvents.map(
      event => event.performance[0].artist.displayName
    );
    const artistIds = relatedArtists
      .filter(artist => artistNames.includes(artist.name))
      .map(artist => artist.id);
    try {
      const response = await fetch(
        `/api/spotify/create-playlist?ids=${artistIds.join(",")}`
      );
      const data = await response.json();
      setPlaylist(data);
    } catch (error) {
      setError("Error creating playlist: " + (error as any).message);
    }
  };

  return (
    <main className="flex flex-col container mx-auto p-4">
      {loadingMessage && <Spinner message={loadingMessage} />}
      {error && <p className="text-red-500">{error}</p>}{" "}
      {!session && <Landing />}
      {session && session.user && !error && (
        <>
          <h2>Welcome, {session.user.name}</h2>
          <p className="text-gray-600">
            This site uses your Spotify to find concerts near you featuring
            artists you might like.
          </p>
          <br />
          <div className="flex items-center">
            <Checkmark />
            <h2>Found {topArtists.length} top artists</h2>
          </div>
          <br />
          {relatedArtists && (
            <div className="flex items-center">
              <Checkmark />
              <h2>Found {relatedArtists.length} related artists</h2>
            </div>
          )}
          <br />
          {!location && !loadingMessage && (
            <button className="btn" onClick={findLocation}>
              Find my location
            </button>
          )}
          {location && (
            <div className="flex items-center">
              <Checkmark />
              <h2>Found your location</h2>
            </div>
          )}
          <br />
          {location && (
            <div className="flex items-center">
              <Checkmark />
              <h2>Found {events.length} events in your area</h2>
            </div>
          )}
          <br />
          {events.length > 0 && location && !artistsInEvents.length && (
            <button className="btn" onClick={findArtistsInEvents}>
              Let&apos;s find some shows!
            </button>
          )}
          <br />
          {artistsInEvents.length > 0 && (
            <>
              <div className="flex items-center mb-4">
                <Checkmark />
                <h2>Found {artistsInEvents.length} shows for you!</h2>
              </div>
              <button className="btn mb-4" onClick={createPlaylist}>
                Export to Playlist
              </button>
            </>
          )}
          {playlist && (
            <div className="flex items-center">
              <Checkmark />
              <h2>
                Created playlist:{" "}
                <a
                  href={playlist.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-500 underline"
                >
                  {playlist.name}
                </a>
              </h2>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-4">
            {artistsInEvents.map(event => (
              <a
                key={event.id}
                href={event.url} //
                target="_blank"
                rel="noreferrer"
                className="border border-gray-700 flex flex-col justify-between"
              >
                <img
                  src={event.images[0]?.url}
                  alt={event.name}
                  className="w-full h-auto object-cover"
                />
                <div className="p-3 flex flex-col flex-grow">
                  <h3 className="text-md font-bold mb-3">{event.name}</h3>
                  <div className="flex justify-between flex-grow">
                    <div className="self-end">
                      {event._embedded?.attractions?.map(attraction => (
                        <p key={attraction.id} className="text-gray-600">
                          {attraction.name}
                        </p>
                      ))}
                    </div>
                    <div className="self-end text-right">
                      <p className="text-gray-600">
                        {event._embedded?.venues?.[0]?.name ?? "Unknown Venue"}
                      </p>{" "}
                      <p className="text-gray-600">
                        {event.dates.start.localDate}
                      </p>{" "}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
