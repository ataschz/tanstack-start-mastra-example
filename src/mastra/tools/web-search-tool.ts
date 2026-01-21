import { perplexity } from '@ai-sdk/perplexity';
import { createTool } from '@mastra/core/tools';
import { generateText } from 'ai';
import { z } from 'zod';
import { useDevTools } from '../utils/dev-tools';

const baseModel = perplexity('sonar');

export const webSearchTool = createTool({
	id: 'web-search',
	description:
		'Search the web for current, real-time information using Perplexity Sonar. Use this for recent news, events, prices, availability, or any time-sensitive information about travel destinations.',
	inputSchema: z.object({
		query: z.string().describe('The search query for current information'),
	}),
	outputSchema: z.object({
		text: z.string().describe('Search results with inline citations [1], [2], etc.'),
		sources: z
			.array(
				z.object({
					url: z.string().describe('Source URL'),
					title: z.string().describe('Source title'),
					description: z.string().optional().describe('Source snippet/description'),
					lastUpdated: z.string().optional().describe('When the source was last updated'),
				})
			)
			.describe('Web sources used for the information'),
	}),
	execute: async ({ query }) => {
		const result = await generateText({
			model: useDevTools(baseModel),
			prompt: query,
		});

		// Extraer información rica de search_results en lugar de sources básicas
		const searchResults = (result.response?.body as any)?.search_results || [];
		const sources = searchResults.map((searchResult: any) => ({
			url: searchResult.url,
			title: searchResult.title || extractDomainFromUrl(searchResult.url),
			description: searchResult.snippet,
			lastUpdated: searchResult.last_updated,
		}));

		return {
			text: result.text,
			sources,
		};
	},
});

function extractDomainFromUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname.replace('www.', '');
	} catch {
		return url;
	}
}
