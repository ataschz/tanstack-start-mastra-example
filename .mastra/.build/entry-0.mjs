import { networkRoute } from '@mastra/ai-sdk';
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createStep, createWorkflow } from '@mastra/core/workflows';

"use strict";
const agentStorage = new LibSQLStore({
  id: "routing-agent-memory",
  url: "file:./mastra.db"
});
const memory = new Memory({
  storage: agentStorage,
  options: {
    generateTitle: true
  }
});

"use strict";
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

"use strict";
const destinationsAgent = new Agent({
  id: "destinations-agent",
  name: "Destinations Agent",
  description: `This agent is an expert in travel destinations and tourist places.
    It can recommend cities, countries, and places to visit based on user preferences.
    Use it when the user asks about where to travel, tourist destinations, places to visit,
    travel recommendations, or when they need information about cities and countries.`,
  instructions: `
      You are a travel and tourist destinations expert with extensive worldwide knowledge.

      Your main function is to help users discover perfect travel destinations for them.
      
      When responding:
      - Use the destinationsSearchTool to search for relevant destinations
      - Consider user preferences: type of trip, budget, time of year, interests
      - Present destinations in an attractive and organized way
      - Include useful information: highlights, best time to visit, type of experience
      - If the user doesn't specify preferences, ask or suggest varied options
      - Be enthusiastic but honest about each destination
      
      Types of trips you can recommend:
      - Beach and relaxation
      - Culture and history
      - Adventure and nature
      - Gastronomy
      - Romantic / Honeymoon
      - Budget / Backpacking
      - Urban / Cities
      - Exotic / Different
      
      Always consider that the user might want to combine your information with weather data
      to make a better decision.
`,
  model: "google/gemini-2.5-flash",
  tools: { destinationsSearchTool },
  memory
});

"use strict";
const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name")
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string()
  }),
  execute: async (inputData) => {
    return await getWeather(inputData.location);
  }
});
const getWeather = async (location) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = await geocodingResponse.json();
  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }
  const { latitude, longitude, name } = geocodingData.results[0];
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;
  const response = await fetch(weatherUrl);
  const data = await response.json();
  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition$1(data.current.weather_code),
    location: name
  };
};
function getWeatherCondition$1(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return conditions[code] || "Unknown";
}

"use strict";
const weatherAgent = new Agent({
  id: "weather-agent",
  name: "Weather Agent",
  description: `This agent provides accurate weather information for any location.
    It uses real-time data to report on temperature, humidity, wind, and weather conditions.
    Use it when the user asks about weather, atmospheric conditions, or meteorological data for a city or place.`,
  instructions: `
      You are a helpful weather assistant that provides accurate weather information and can help planning activities based on the weather.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative
      - If the user asks for activities and provides the weather forecast, suggest activities based on the weather forecast.
      - If the user asks for activities, respond in the format they request.

      Use the weatherTool to fetch current weather data.
`,
  model: "google/gemini-2.5-flash",
  tools: { weatherTool },
  memory
});

"use strict";
const routingAgent = new Agent({
  id: "routing-agent",
  name: "Travel Assistant",
  instructions: `
      You are an intelligent travel assistant that coordinates a network of specialized agents
      to help users plan their perfect trips.
      
      Your role is:
      1. Understand what type of trip the user is looking for
      2. Coordinate specialized agents to provide the best recommendations
      3. Combine destination and weather information for complete suggestions
      
      Available agents:
      - Destinations Agent: Expert in tourist destinations, cities, and places to visit
      - Weather Agent: Provides current weather information for any city
      
      Coordination strategies:
      
      1. If the user asks "Where can I travel?" or seeks recommendations:
         \u2192 First use Destinations Agent to get options
         \u2192 Then use Weather Agent to check the weather of suggested destinations
         \u2192 Combine the information to give a complete recommendation
      
      2. If the user mentions a specific city:
         \u2192 Use both agents to provide complete destination and weather information
      
      3. If the user only asks about weather:
         \u2192 Use Weather Agent directly
      
      4. If the user has specific preferences (beach, mountain, culture, etc.):
         \u2192 Use Destinations Agent with those preferences
         \u2192 Complement with Weather Agent for the best times to visit
      
      Ideal response format:
      - Present destinations attractively
      - Include current or expected weather
      - Give personalized recommendations
      - Suggest the best time to visit if relevant
      
      Always be friendly, enthusiastic about travel, and help the user
      make the best decision for their next adventure.
`,
  model: "google/gemini-2.5-flash",
  agents: {
    weatherAgent,
    destinationsAgent
  },
  memory
});

"use strict";
const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string()
});
function getWeatherCondition(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    95: "Thunderstorm"
  };
  return conditions[code] || "Unknown";
}
const fetchWeather = createStep({
  id: "fetch-weather",
  description: "Fetches weather forecast for a given city",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputData.city)}&count=1`;
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = await geocodingResponse.json();
    if (!geocodingData.results?.[0]) {
      throw new Error(`Location '${inputData.city}' not found`);
    }
    const { latitude, longitude, name } = geocodingData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto,&hourly=precipitation_probability,temperature_2m`;
    const response = await fetch(weatherUrl);
    const data = await response.json();
    const forecast = {
      date: (/* @__PURE__ */ new Date()).toISOString(),
      maxTemp: Math.max(...data.hourly.temperature_2m),
      minTemp: Math.min(...data.hourly.temperature_2m),
      condition: getWeatherCondition(data.current.weathercode),
      precipitationChance: data.hourly.precipitation_probability.reduce(
        (acc, curr) => Math.max(acc, curr),
        0
      ),
      location: name
    };
    return forecast;
  }
});
const planActivities = createStep({
  id: "plan-activities",
  description: "Suggests activities based on weather conditions",
  inputSchema: forecastSchema,
  outputSchema: z.object({
    activities: z.string()
  }),
  execute: async ({ inputData, mastra }) => {
    const forecast = inputData;
    if (!forecast) {
      throw new Error("Forecast data not found");
    }
    const agent = mastra?.getAgent("weatherAgent");
    if (!agent) {
      throw new Error("Weather agent not found");
    }
    const prompt = `Based on the following weather forecast for ${forecast.location}, suggest appropriate activities:
      ${JSON.stringify(forecast, null, 2)}
      For each day in the forecast, structure your response exactly as follows:

      \u{1F4C5} [Day, Month Date, Year]
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      \u{1F321}\uFE0F WEATHER SUMMARY
      \u2022 Conditions: [brief description]
      \u2022 Temperature: [X\xB0C/Y\xB0F to A\xB0C/B\xB0F]
      \u2022 Precipitation: [X% chance]

      \u{1F305} MORNING ACTIVITIES
      Outdoor:
      \u2022 [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      \u{1F31E} AFTERNOON ACTIVITIES
      Outdoor:
      \u2022 [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      \u{1F3E0} INDOOR ALTERNATIVES
      \u2022 [Activity Name] - [Brief description including specific venue]
        Ideal for: [weather condition that would trigger this alternative]

      \u26A0\uFE0F SPECIAL CONSIDERATIONS
      \u2022 [Any relevant weather warnings, UV index, wind conditions, etc.]

      Guidelines:
      - Suggest 2-3 time-specific outdoor activities per day
      - Include 1-2 indoor backup options
      - For precipitation >50%, lead with indoor activities
      - All activities must be specific to the location
      - Include specific venues, trails, or locations
      - Consider activity intensity based on temperature
      - Keep descriptions concise but informative

      Maintain this exact formatting for consistency, using the emoji and section headers as shown.`;
    const response = await agent.stream([
      {
        role: "user",
        content: prompt
      }
    ]);
    let activitiesText = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      activitiesText += chunk;
    }
    return {
      activities: activitiesText
    };
  }
});
const weatherWorkflow = createWorkflow({
  id: "weather-workflow",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: z.object({
    activities: z.string()
  })
}).then(fetchWeather).then(planActivities);
weatherWorkflow.commit();

"use strict";
const mastra = new Mastra({
  agents: {
    weatherAgent,
    destinationsAgent,
    routingAgent
  },
  workflows: {
    weatherWorkflow
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: "file:./mastra.db"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  }),
  server: {
    cors: {
      origin: "*",
      allowMethods: ["*"],
      allowHeaders: ["*"]
    },
    apiRoutes: [networkRoute({
      path: "/chat",
      agent: "routingAgent"
    })]
  }
});

export { mastra };
