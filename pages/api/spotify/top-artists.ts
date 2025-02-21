import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
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
  const session = await getServerSession(req, res, authOptions);
  const { accessToken, refreshToken } = session;

  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }

  spotifyApi.setAccessToken(accessToken as string);
  spotifyApi.setRefreshToken(refreshToken as string);

  try {
    await spotifyApi.refreshAccessToken();
    const data = await spotifyApi.getMyTopArtists();
    res.status(200).json(data.body);
  } catch (error: any) {}
}
