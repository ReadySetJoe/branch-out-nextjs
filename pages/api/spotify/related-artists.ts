import { NextApiRequest, NextApiResponse } from "next";
import SpotifyWebApi from "spotify-web-api-node";

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { accessToken, ids } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }

  if (!ids || typeof ids !== "string") {
    return res.status(400).json({ error: "Artist IDs are required" });
  }

  spotifyApi.setAccessToken(accessToken as string);

  try {
    const results: { [key: string]: SpotifyApi.ArtistObjectFull } = {};
    for (const id of ids.split(",")) {
      const data = await spotifyApi.getArtistRelatedArtists(id);
      data.body.artists.forEach(artist => {
        if (!results[artist.id]) {
          results[artist.id] = artist;
        }
      });
    }
    const resultsArray = Object.values(results);
    res.status(200).json(resultsArray);
  } catch (error: any) {
    console.error("Error fetching top artists:", error);
    res.status(500).json({ error: error.message });
  }
}
