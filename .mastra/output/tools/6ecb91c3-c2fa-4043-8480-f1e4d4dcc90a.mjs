import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const destinationsSearchTool = createTool({
  id: "destinations-search",
  description: `Searches for information about travel destinations, tourist places, and cities to visit.
    Accepts criteria such as type of trip, region, activities, or interests and returns destination recommendations.
    Use this tool when you need to suggest places to travel or tourist information.`,
  inputSchema: z.object({
    query: z.string().describe("Search criteria: type of trip, region, activities, or interests")
  }),
  outputSchema: z.object({
    query: z.string(),
    destinations: z.array(
      z.object({
        city: z.string(),
        country: z.string(),
        description: z.string(),
        highlights: z.array(z.string()),
        bestTimeToVisit: z.string(),
        travelType: z.array(z.string())
      })
    )
  }),
  execute: async ({ query }) => {
    return await searchDestinations(query);
  }
});
async function searchDestinations(query) {
  const lowerQuery = query.toLowerCase();
  const allDestinations = [
    // Europe
    {
      city: "Barcelona",
      country: "Spain",
      description: "Vibrant city with Gaud\xED modernist architecture, Mediterranean beaches, and rich nightlife.",
      highlights: [
        "Sagrada Familia",
        "Park G\xFCell",
        "Las Ramblas",
        "Gothic Quarter",
        "Barceloneta Beach"
      ],
      bestTimeToVisit: "May to June, September to October",
      travelType: ["beach", "culture", "gastronomy", "nightlife", "architecture"]
    },
    {
      city: "Paris",
      country: "France",
      description: "The city of love, famous for its art, fashion, gastronomy, and iconic monuments.",
      highlights: ["Eiffel Tower", "Louvre", "Notre-Dame", "Champs-\xC9lys\xE9es", "Montmartre"],
      bestTimeToVisit: "April to June, September to November",
      travelType: ["romantic", "culture", "art", "gastronomy", "fashion"]
    },
    {
      city: "Rome",
      country: "Italy",
      description: "Eternal city with ancient ruins, Renaissance art, and the best pasta in the world.",
      highlights: ["Colosseum", "Vatican", "Trevi Fountain", "Pantheon", "Trastevere"],
      bestTimeToVisit: "April to May, September to October",
      travelType: ["history", "culture", "gastronomy", "art", "romantic"]
    },
    {
      city: "Amsterdam",
      country: "Netherlands",
      description: "City of canals, world-class museums, unique architecture, and liberal atmosphere.",
      highlights: ["Van Gogh Museum", "Anne Frank House", "Rijksmuseum", "Canals", "Vondelpark"],
      bestTimeToVisit: "April to May (tulips), June to August",
      travelType: ["culture", "art", "cycling", "nightlife", "museums"]
    },
    {
      city: "Prague",
      country: "Czech Republic",
      description: "Fairytale city with medieval architecture, craft beer, and affordable prices.",
      highlights: ["Charles Bridge", "Prague Castle", "Old Town Square", "Astronomical Clock"],
      bestTimeToVisit: "May to September",
      travelType: ["history", "architecture", "budget", "beer", "romantic"]
    },
    // Asia
    {
      city: "Tokyo",
      country: "Japan",
      description: "Futuristic metropolis that combines ancestral tradition with cutting-edge technology.",
      highlights: ["Shibuya", "Senso-ji Temple", "Mount Fuji", "Akihabara", "Shinjuku"],
      bestTimeToVisit: "March to May (sakura), October to November",
      travelType: ["technology", "culture", "gastronomy", "temples", "modern"]
    },
    {
      city: "Bali",
      country: "Indonesia",
      description: "Paradise island with Hindu temples, rice terraces, beaches, and wellness retreats.",
      highlights: [
        "Ubud",
        "Tanah Lot Temple",
        "Tegallalang Rice Terraces",
        "Seminyak",
        "Mount Batur"
      ],
      bestTimeToVisit: "April to October (dry season)",
      travelType: ["beach", "wellness", "yoga", "nature", "spiritual", "budget"]
    },
    {
      city: "Bangkok",
      country: "Thailand",
      description: "Chaotic and fascinating city with golden temples, floating markets, and incredible street food.",
      highlights: ["Grand Palace", "Wat Pho", "Floating Market", "Khao San Road", "Chatuchak"],
      bestTimeToVisit: "November to February",
      travelType: ["culture", "gastronomy", "temples", "budget", "adventure"]
    },
    // Americas
    {
      city: "New York",
      country: "United States",
      description: "The city that never sleeps: iconic skyscrapers, Broadway, art, and cultural diversity.",
      highlights: [
        "Times Square",
        "Central Park",
        "Statue of Liberty",
        "Empire State",
        "Brooklyn Bridge"
      ],
      bestTimeToVisit: "April to June, September to November",
      travelType: ["urban", "culture", "art", "shopping", "gastronomy", "museums"]
    },
    {
      city: "Cancun",
      country: "Mexico",
      description: "Caribbean paradise with white sand beaches, Mayan ruins, and vibrant nightlife.",
      highlights: ["Hotel Zone", "Chichen Itza", "Isla Mujeres", "Xcaret", "Cenotes"],
      bestTimeToVisit: "December to April",
      travelType: ["beach", "resort", "history", "diving", "nightlife"]
    },
    {
      city: "Buenos Aires",
      country: "Argentina",
      description: "Tango capital with European architecture, legendary steaks, and football passion.",
      highlights: ["La Boca", "San Telmo", "Recoleta", "Puerto Madero", "Teatro Col\xF3n"],
      bestTimeToVisit: "March to May, September to November",
      travelType: ["culture", "gastronomy", "tango", "art", "nightlife"]
    },
    {
      city: "Cusco",
      country: "Peru",
      description: "Ancient Inca capital, gateway to Machu Picchu and heart of Andean culture.",
      highlights: [
        "Machu Picchu",
        "Sacred Valley",
        "Plaza de Armas",
        "Sacsayhuaman",
        "San Pedro Market"
      ],
      bestTimeToVisit: "May to September (dry season)",
      travelType: ["history", "adventure", "trekking", "culture", "archaeology"]
    },
    // Oceania
    {
      city: "Sydney",
      country: "Australia",
      description: "Coastal city with the iconic Opera House, surf beaches, and relaxed lifestyle.",
      highlights: [
        "Sydney Opera House",
        "Harbour Bridge",
        "Bondi Beach",
        "The Rocks",
        "Taronga Zoo"
      ],
      bestTimeToVisit: "September to November, March to May",
      travelType: ["beach", "urban", "surf", "nature", "modern"]
    },
    // Africa
    {
      city: "Marrakech",
      country: "Morocco",
      description: "Imperial city with labyrinthine souks, palaces, and the magic of the nearby desert.",
      highlights: ["Jemaa el-Fna Square", "Majorelle Garden", "Medina", "Bahia Palace", "Souks"],
      bestTimeToVisit: "March to May, September to November",
      travelType: ["culture", "exotic", "gastronomy", "shopping", "adventure"]
    },
    {
      city: "Cape Town",
      country: "South Africa",
      description: "Spectacular city between mountains and ocean, with vineyards and African wildlife.",
      highlights: [
        "Table Mountain",
        "Cape of Good Hope",
        "Robben Island",
        "V&A Waterfront",
        "Vineyards"
      ],
      bestTimeToVisit: "November to March",
      travelType: ["nature", "adventure", "wine", "safari", "beach"]
    }
  ];
  const matchedDestinations = allDestinations.filter((dest) => {
    const searchText = `${dest.city} ${dest.country} ${dest.description} ${dest.highlights.join(" ")} ${dest.travelType.join(" ")}`.toLowerCase();
    const keywords = lowerQuery.split(/\s+/);
    return keywords.some((keyword) => keyword.length > 2 && searchText.includes(keyword));
  });
  const results = matchedDestinations.length > 0 ? matchedDestinations.slice(0, 5) : getDefaultDestinations(lowerQuery, allDestinations);
  return {
    query,
    destinations: results
  };
}
function getDefaultDestinations(query, allDestinations) {
  if (query.includes("beach") || query.includes("sea") || query.includes("caribbean")) {
    return allDestinations.filter((d) => d.travelType.includes("beach")).slice(0, 4);
  }
  if (query.includes("culture") || query.includes("history") || query.includes("museum")) {
    return allDestinations.filter((d) => d.travelType.includes("culture") || d.travelType.includes("history")).slice(0, 4);
  }
  if (query.includes("adventure") || query.includes("nature") || query.includes("trekking")) {
    return allDestinations.filter((d) => d.travelType.includes("adventure") || d.travelType.includes("nature")).slice(0, 4);
  }
  if (query.includes("romantic") || query.includes("couple") || query.includes("honeymoon")) {
    return allDestinations.filter((d) => d.travelType.includes("romantic")).slice(0, 4);
  }
  if (query.includes("budget") || query.includes("cheap") || query.includes("affordable")) {
    return allDestinations.filter((d) => d.travelType.includes("budget")).slice(0, 4);
  }
  if (query.includes("europe")) {
    return allDestinations.filter(
      (d) => ["Spain", "France", "Italy", "Netherlands", "Czech Republic"].includes(d.country)
    ).slice(0, 4);
  }
  if (query.includes("asia")) {
    return allDestinations.filter((d) => ["Japan", "Indonesia", "Thailand"].includes(d.country)).slice(0, 4);
  }
  if (query.includes("america")) {
    return allDestinations.filter((d) => ["United States", "Mexico", "Argentina", "Peru"].includes(d.country)).slice(0, 4);
  }
  return [
    allDestinations.find((d) => d.city === "Barcelona"),
    allDestinations.find((d) => d.city === "Tokyo"),
    allDestinations.find((d) => d.city === "New York"),
    allDestinations.find((d) => d.city === "Bali")
  ];
}

export { destinationsSearchTool };
