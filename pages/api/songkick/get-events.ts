import type { NextApiRequest, NextApiResponse } from "next";

const SONGKICK_API_KEY = process.env.SONGKICK_API_KEY;
const SONGKICK_API_URL = "https://api.songkick.com/api/3.0/events.json";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }

  try {
    const events = [];
    let page = 1;
    let tries = 0;
    let event;

    do {
      const response = await fetch(
        `${SONGKICK_API_URL}?location=geo:${lat},${lng}&apikey=${SONGKICK_API_KEY}&page=${page}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch data from Songkick API");
      }

      const data = await response.json();
      event = data.resultsPage.results.event;
      if (!event || event.length === 0) {
        tries++;
      } else {
        events.push(...event);
        page++;
        tries = 0;
      }
    } while (event && event.length > 0 && tries < 10);

    res.status(200).json(events);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
}
