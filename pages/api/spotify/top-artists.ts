import { NextApiRequest, NextApiResponse } from "next";
import { refreshAccessToken, spotifyApi } from "@/lib/spotify";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await refreshAccessToken(req, res);

  try {
    const data = await spotifyApi.getMyTopArtists();
    res.status(200).json(data.body);
  } catch (error: any) {
    console.error("Error fetching top artists:", error);
    res.status(500).json({ error: "Failed to fetch top artists" });
  }
}
