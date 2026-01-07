import type { NextApiRequest, NextApiResponse } from "next";

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_API_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    lat,
    lng,
    radius = "50",
    startDateTime,
    endDateTime,
    page = "0",
    size = "500",
  } = req.query;

  if (!lat || !lng) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }

  try {
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY!,
      latlong: `${lat},${lng}`,
      classificationName: "music",
      page: page.toString(),
      size: size.toString(),
      sort: "date,asc",
      radius: radius.toString(),
      unit: "miles",
    });

    // Add date filters if provided
    if (startDateTime) {
      params.append("startDateTime", `${startDateTime}T00:00:00Z`);
    }
    if (endDateTime) {
      params.append("endDateTime", `${endDateTime}T23:59:59Z`);
    }

    const response = await fetch(`${TICKETMASTER_API_URL}?${params}`);

    if (!response.ok) {
      throw new Error("Failed to fetch data from the Ticketmaster API");
    }

    const data = await response.json();
    const events = data._embedded?.events || [];
    const pagination = {
      size: data.page?.size || 0,
      totalElements: data.page?.totalElements || 0,
      totalPages: data.page?.totalPages || 0,
      number: data.page?.number || 0,
    };

    res.status(200).json({ events, pagination });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ error: errorMessage });
  }
}
