import { NextApiRequest, NextApiResponse } from "next";
import { getPlaylistName } from "@/components/playlist-name";
import { refreshAccessToken, spotifyApi } from "@/lib/spotify";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { ids } = req.query;

  await refreshAccessToken(req, res);
  const artistIds = (ids as string).split(",");

  try {
    const playlistName = getPlaylistName();
    const data = await spotifyApi.createPlaylist(playlistName);
    const trackUris = [];
    for (const artistId of artistIds) {
      const tracks = await spotifyApi.getArtistTopTracks(artistId, "US");
      trackUris.push(tracks.body.tracks[0].uri);
    }
    await spotifyApi.addTracksToPlaylist(data.body.id, trackUris);
    res.status(200).json(data.body);
  } catch (error: any) {}
}
