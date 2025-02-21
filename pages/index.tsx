/* eslint-disable @next/next/no-img-element */
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import Checkmark from "@/components/checkmark";
import Landing from "@/components/landing";

interface Artist {
  id: string;
  name: string;
}
interface Event {
  id: string;
  performance: {
    id: string;
    artist: {
      id: string;
      displayName: string;
    };
  }[];
  venue: {
    displayName: string;
  };
  start: {
    date: string;
    time: string;
  };
  displayName: string;
  location: {
    city: string;
  };
  status: string;
  uri: string;
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

  useEffect(() => {
    if (relatedArtists.length > 0 && location && !events.length) {
      findEvents();
    }
  }, [relatedArtists, location, events]);

  const findLocation = () => {
    setLoadingMessage("Finding your location...");
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLocation(position);
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

  const findEvents = async () => {
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

  const findArtistsInEvents = () => {
    const artistNames = relatedArtists.map(artist => artist.name);
    const eventsWithArtists = events.filter(event =>
      artistNames.includes(event.performance[0]?.artist.displayName)
    );
    setArtistsInEvents(eventsWithArtists);
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
                href={event.uri}
                target="_blank"
                rel="noreferrer"
                className="border border-gray-700 flex flex-col justify-between"
              >
                <img
                  src={`https://images.sk-static.com/images/media/profile_images/artists/${event.performance[0].artist.id}/huge_avatar`}
                  alt={event.performance[0].artist.displayName}
                  className="w-full h-auto object-cover"
                />
                <div className="p-3 flex flex-col flex-grow">
                  <h3 className="text-md font-bold mb-3">
                    {event.displayName}
                  </h3>
                  <div className="flex justify-between flex-grow">
                    <div className="self-end">
                      {event.performance.map(performance => (
                        <p key={performance.id} className="text-gray-600">
                          {performance.artist.displayName}
                        </p>
                      ))}
                    </div>
                    <div className="self-end text-right">
                      <p className="text-gray-600">{event.venue.displayName}</p>
                      <p className="text-gray-600">{event.location.city}</p>
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
