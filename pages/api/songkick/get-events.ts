import type { NextApiRequest, NextApiResponse } from "next";

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_API_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";

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
    let page = 0;
    let event;

    do {
      const response = await fetch(
        `${TICKETMASTER_API_URL}?apikey=${TICKETMASTER_API_KEY}&latlong=${lat},${lng}&classificationName=music&page=${page}&sort=distance,asc`
      );
      console.log("response", response);
      if (!response.ok) {
        throw new Error("Failed to fetch data from the Ticketmaster API");
      }

      const data = await response.json();
      event = data._embedded?.events;
      if (event && event.length > 0) {
        events.push(...event);
        page++;
      } else {
        break;
      }
    } while (event && event.length > 0 && page < 10);

    res.status(200).json(events);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
}
