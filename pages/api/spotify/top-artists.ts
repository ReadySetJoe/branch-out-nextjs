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
  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }

  spotifyApi.setAccessToken(accessToken as string);

  try {
    const data = await spotifyApi.getMyTopArtists();
    res.status(200).json(data.body);
  } catch (error: any) {
    console.error("Error fetching top artists:", error);
    res.status(500).json({ error: error.message });
  }
}
