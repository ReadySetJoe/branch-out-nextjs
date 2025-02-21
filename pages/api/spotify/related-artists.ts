import { NextApiRequest, NextApiResponse } from "next";
import { refreshAccessToken, spotifyApi } from "@/lib/spotify";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { ids } = req.query;

  try {
    await refreshAccessToken(req, res);
    const results: { [key: string]: SpotifyApi.ArtistObjectFull } = {};
    for (const id of (ids as string).split(",")) {
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
