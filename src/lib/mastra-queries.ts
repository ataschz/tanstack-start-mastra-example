/**
 * Mastra Query Options
 * Query functions reutilizables para SSR con TanStack Query
 * Pueden usarse tanto en servidor (loaders) como en cliente (hooks)
 */

import { toAISdkV5Messages } from '@mastra/ai-sdk/ui';
import { MastraClient } from '@mastra/client-js';
import type { MastraUIMessage } from '@mastra/react';
import { AGENT_ID, MASTRA_BASE_URL, RESOURCE_ID } from '@/lib/constants';
import { filterDisplayableMessages } from '@/lib/filter-displayable-messages';
import { resolveInitialMessages } from '@/lib/resolve-initial-messages';

/**
 * Crear cliente Mastra (singleton pattern)
 */
let mastraClientInstance: MastraClient | null = null;

export function createMastraClient() {
	if (!mastraClientInstance) {
		mastraClientInstance = new MastraClient({ baseUrl: MASTRA_BASE_URL });
	}
	return mastraClientInstance;
}

/**
 * Query options para lista de threads
 * @returns Query options para usar con useQuery, useSuspenseQuery, prefetchQuery o ensureQueryData
 */
export const threadsQueryOptions = () => ({
	queryKey: ['mastra', 'threads', RESOURCE_ID] as const,
	queryFn: async () => {
		const client = createMastraClient();
		const result = await client.listMemoryThreads({
			resourceId: RESOURCE_ID,
			agentId: AGENT_ID,
		});

		return result.threads ?? [];
	},
	staleTime: 0,
	gcTime: 0,
	retry: false,
	refetchOnWindowFocus: false,
});

/**
 * Query options para mensajes de un thread
 * @param threadId - ID del thread
 * @returns Query options para usar con useQuery, useSuspenseQuery, prefetchQuery o ensureQueryData
 */
export const threadMessagesQueryOptions = (threadId: string) => ({
	queryKey: ['mastra', 'messages', threadId] as const,
	queryFn: async () => {
		if (!threadId) return { exists: false, messages: [] };

		try {
			const client = createMastraClient();
			const thread = client.getMemoryThread({
				threadId,
				agentId: AGENT_ID,
			});

			const result = await thread.listMessages();

			if (!result.messages || result.messages.length === 0) {
				return { exists: true, messages: [] };
			}

		// Convertir a formato AI SDK V5
		const uiMessages = toAISdkV5Messages(result.messages) as MastraUIMessage[];
		// Resolver mensajes de network desde memoria
		const resolvedMessages = resolveInitialMessages(uiMessages);
		const displayableMessages = filterDisplayableMessages(resolvedMessages);

		return { exists: true, messages: displayableMessages };
		} catch (error) {
			// Solo devolver exists: false si es un error 404 (thread no existe)
			const is404 =
				(error instanceof Error && error.message.includes('404')) ||
				(typeof error === 'object' &&
					error !== null &&
					'status' in error &&
					(error as { status: number }).status === 404);

			if (is404) {
				return { exists: false, messages: [] };
			}
			throw error;
		}
	},
	staleTime: 0,
	gcTime: 0,
	retry: false,
	refetchOnWindowFocus: false,
});
