import { NextApiRequest, NextApiResponse } from "next";
import { refreshAccessToken, spotifyApi } from "@/lib/spotify";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await refreshAccessToken(req, res);

  try {
    await spotifyApi.refreshAccessToken();
    const data = await spotifyApi.getMyTopArtists();
    res.status(200).json(data.body);
  } catch (error: any) {}
}
