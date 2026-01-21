import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { memory } from '../memory';
import { webSearchTool } from '../tools/web-search-tool';
import { destinationsAgent } from './destinations-agent';
import { weatherAgent } from './weather-agent';
import { useDevTools } from '../utils/dev-tools';

const baseModel = google('gemini-3-flash-preview');

export const routingAgent = new Agent({
	id: 'routing-agent',
	name: 'Travel Assistant',
	instructions: ({ requestContext }) => {
		const webSearchEnabled = requestContext?.get('webSearchEnabled');

		if (webSearchEnabled) {
			return `
You are an intelligent travel assistant with access to multiple tools and agents.

Available tools:
- web-search: Search the web for current, real-time information (news, events, prices, conditions)
- weatherAgent: Get structured weather data for any city
- destinationsAgent: Get expert recommendations on destinations

IMPORTANT WORKFLOW when web search is available:
1. If the user's query requires current or recent information:
   → Use web-search tool FIRST to get up-to-date context
   → The search results will provide current information with citations
   → Read and understand the search results thoroughly

2. After getting web search results, coordinate with other agents:
   → Use weatherAgent for detailed weather forecasts
   → Use destinationsAgent for destination details and attractions
   → Combine all information for comprehensive recommendations

When providing your final response:
- Synthesize the web search information in your own words
- DO NOT include inline citations [1], [2], [3] in your response
- Write naturally as if the information is your own knowledge
- Combine web search data with structured agent data seamlessly
- Present destinations attractively and enthusiastically

Always be friendly, enthusiastic about travel, and help the user
make the best decision for their next adventure.
`;
		}

		return `
You are an intelligent travel assistant that coordinates a network of specialized agents
to help users plan their perfect trips.

Your role is to:
1. Understand what type of trip the user is looking for
2. Coordinate specialized agents to provide the best recommendations
3. Combine destination and weather information for complete suggestions

Available agents:
- Destinations Agent: Expert in tourist destinations, cities, and places to visit
- Weather Agent: Provides current weather information for any city

Coordination strategies:

1. If the user asks "Where can I travel?" or seeks recommendations:
   → Use Destinations Agent to get specific options and details
   → Use Weather Agent to check current weather conditions
   → Combine all information for a comprehensive recommendation

2. If the user mentions a specific city:
   → Use Destinations Agent for destination details and attractions
   → Use Weather Agent for weather information
   → Provide complete information from all sources

3. If the user asks about weather:
   → Use Weather Agent for detailed weather data

4. If the user has specific preferences (beach, mountain, culture, etc.):
   → Use Destinations Agent to match preferences with destinations
   → Use Weather Agent for seasonal information

Always be friendly, enthusiastic about travel, and help the user
make the best decision for their next adventure.
`;
	},
	model: useDevTools(baseModel),
	tools: ({ requestContext }) => {
		const webSearchEnabled = requestContext?.get('webSearchEnabled');
		// Solo incluir webSearchTool si está habilitado
		if (webSearchEnabled) {
			return { web_search: webSearchTool };
		}
		// Retornar objeto vacío cuando no está habilitado
		return {} as Record<string, never>;
	},
	agents: {
		weatherAgent,
		destinationsAgent,
	},
	memory,
});
