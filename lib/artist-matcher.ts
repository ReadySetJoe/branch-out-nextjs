interface Artist {
  id: string;
  name: string;
  images?: { url: string }[];
}

interface TicketmasterAttraction {
  id: string;
  name: string;
  images?: { url: string }[];
  externalLinks?: {
    spotify?: { url: string }[];
  };
}

interface Event {
  id: string;
  name: string;
  url: string;
  images: { url: string }[];
  dates: { 
    start: { 
      localDate: string;
      localTime?: string;
    };
  };
  priceRanges?: {
    min: number;
    max: number;
    currency: string;
  }[];
  _embedded?: {
    attractions?: TicketmasterAttraction[];
    venues?: { 
      name: string;
      city?: { name: string };
      state?: { name: string; stateCode: string };
    }[];
  };
  classifications?: {
    genre?: { name: string };
    subGenre?: { name: string };
  }[];
}

// Normalize artist names for comparison
function normalizeArtistName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')     // Normalize spaces
    .trim();
}

// Calculate similarity between two strings (Levenshtein distance)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeArtistName(str1);
  const s2 = normalizeArtistName(str2);
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 0;
  
  const editDistance = levenshteinDistance(shorter, longer);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export interface MatchedEvent extends Event {
  matchedArtists: {
    spotifyArtist: Artist;
    ticketmasterArtist: TicketmasterAttraction;
    confidence: number;
  }[];
  matchScore: number;
}

// Match events with user's artists
export function matchEventsWithArtists(
  events: Event[],
  userArtists: Artist[],
  threshold: number = 0.8
): MatchedEvent[] {
  const matchedEvents: MatchedEvent[] = [];
  
  for (const event of events) {
    const attractions = event._embedded?.attractions || [];
    const matchedArtists: MatchedEvent['matchedArtists'] = [];
    
    for (const attraction of attractions) {
      for (const userArtist of userArtists) {
        const similarity = calculateSimilarity(attraction.name, userArtist.name);
        
        if (similarity >= threshold) {
          matchedArtists.push({
            spotifyArtist: userArtist,
            ticketmasterArtist: attraction,
            confidence: similarity
          });
        }
      }
    }
    
    if (matchedArtists.length > 0) {
      const matchScore = matchedArtists.reduce((sum, m) => sum + m.confidence, 0) / matchedArtists.length;
      matchedEvents.push({
        ...event,
        matchedArtists,
        matchScore
      });
    }
  }
  
  // Sort by match score
  return matchedEvents.sort((a, b) => b.matchScore - a.matchScore);
}

export interface EventFilters {
  dateFrom?: Date;
  dateTo?: Date;
  priceMin?: number;
  priceMax?: number;
  genres?: string[];
  venues?: string[];
}

export function filterEvents(events: MatchedEvent[], filters: EventFilters): MatchedEvent[] {
  return events.filter(event => {
    // Date filter
    if (filters.dateFrom || filters.dateTo) {
      const eventDate = new Date(event.dates.start.localDate);
      if (filters.dateFrom && eventDate < filters.dateFrom) return false;
      if (filters.dateTo && eventDate > filters.dateTo) return false;
    }
    
    // Price filter
    if ((filters.priceMin !== undefined || filters.priceMax !== undefined) && event.priceRanges) {
      const minPrice = Math.min(...event.priceRanges.map(p => p.min));
      const maxPrice = Math.max(...event.priceRanges.map(p => p.max));
      
      if (filters.priceMin !== undefined && maxPrice < filters.priceMin) return false;
      if (filters.priceMax !== undefined && minPrice > filters.priceMax) return false;
    }
    
    // Genre filter
    if (filters.genres && filters.genres.length > 0 && event.classifications) {
      const eventGenres = event.classifications
        .map(c => [c.genre?.name, c.subGenre?.name])
        .flat()
        .filter(Boolean)
        .map(g => g!.toLowerCase());
      
      const hasMatchingGenre = filters.genres.some(filterGenre => 
        eventGenres.some(eventGenre => eventGenre.includes(filterGenre.toLowerCase()))
      );
      
      if (!hasMatchingGenre) return false;
    }
    
    // Venue filter
    if (filters.venues && filters.venues.length > 0 && event._embedded?.venues) {
      const eventVenues = event._embedded.venues.map(v => v.name.toLowerCase());
      const hasMatchingVenue = filters.venues.some(filterVenue =>
        eventVenues.some(eventVenue => eventVenue.includes(filterVenue.toLowerCase()))
      );
      
      if (!hasMatchingVenue) return false;
    }
    
    return true;
  });
}

export type SortOption = 'date' | 'match' | 'price' | 'name';

export function sortEvents(events: MatchedEvent[], sortBy: SortOption): MatchedEvent[] {
  const sorted = [...events];
  
  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => 
        new Date(a.dates.start.localDate).getTime() - new Date(b.dates.start.localDate).getTime()
      );
    
    case 'match':
      return sorted.sort((a, b) => b.matchScore - a.matchScore);
    
    case 'price':
      return sorted.sort((a, b) => {
        const aMin = a.priceRanges ? Math.min(...a.priceRanges.map(p => p.min)) : Infinity;
        const bMin = b.priceRanges ? Math.min(...b.priceRanges.map(p => p.min)) : Infinity;
        return aMin - bMin;
      });
    
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    
    default:
      return sorted;
  }
}