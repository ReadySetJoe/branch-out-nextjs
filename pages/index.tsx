import { useEffect, useState } from "react";
import Login from "@/components/login";
import { useSession } from "next-auth/react";

interface Artist {
  id: string;
  name: string;
}

interface Event {
  id: string;
  performance: {
    artist: {
      displayName: string;
    };
  }[];
  venue: {
    displayName: string;
  };
  start: {
    date: string;
  };
}

export default function Home() {
  const { data: session } = useSession();
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [relatedArtists, setRelatedArtists] = useState<Artist[]>([]);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [artistsInEvents, setArtistsInEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (session) {
      fetch(`/api/spotify/top-artists`)
        .then(res => res.json())
        .then(data => setTopArtists(data.items))
        .catch(error => console.error("Error fetching top artists:", error));
    }
  }, [session]);

  const findRelatedArtists = async () => {
    const artistIds = topArtists.map(artist => artist.id).join(",");
    const response = await fetch(
      `/api/spotify/related-artists?ids=${artistIds}`
    );
    const data = await response.json();
    setRelatedArtists(data);
  };

  const findEvents = async () => {
    const response = await fetch(
      `/api/songkick/get-events?lat=${location?.coords.latitude}&lng=${location?.coords.longitude}`
    );
    const data = await response.json();
    setEvents(data);
  };

  const findArtistsInEvents = () => {
    const artistNames = relatedArtists.map(artist => artist.name);
    const eventsWithArtists = events.filter(event =>
      artistNames.includes(event.performance[0]?.artist.displayName)
    );
    setArtistsInEvents(eventsWithArtists);
  };

  return (
    <main className={`flex min-h-screen flex-col items-center p-24`}>
      {<Login />}
      {session && session.user && (
        <>
          <h1>Welcome {session.user.name}</h1>
          <br />
          <h2>Found {topArtists.length} top artists</h2>
          <br />
          <button onClick={findRelatedArtists}>Find related artists </button>
          {relatedArtists && (
            <h2>Found {relatedArtists.length} related artists</h2>
          )}
          <br />
          <button
            onClick={() => {
              navigator.geolocation.getCurrentPosition(position => {
                setLocation(position);
              });
            }}
          >
            Find my location
          </button>
          {location && (
            <p>
              Latitude: {location.coords.latitude}, Longitude:{" "}
              {location.coords.longitude}
            </p>
          )}
          <br />
          {location && <button onClick={findEvents}>Find events </button>}
          {location && <h2>Found {events.length} events</h2>}
          <br />
          {events.length > 0 && location && (
            <button onClick={findArtistsInEvents}>
              Find artists in events
            </button>
          )}
          {events.length > 0 && location && (
            <h2>Found {artistsInEvents.length} artists in events</h2>
          )}
          {artistsInEvents.map(event => (
            <div key={event.id} className="border p-4 m-4">
              {event.performance.map((performance: any) => (
                <p key={performance.id}>{performance.artist.displayName}</p>
              ))}
              <p className="mt-2">{event.venue.displayName}</p>
              <p className="mt-2">{event.start.date}</p>
            </div>
          ))}
        </>
      )}
    </main>
  );
}
