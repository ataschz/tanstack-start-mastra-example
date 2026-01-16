import { useSuspenseQuery } from '@tanstack/react-query';
import { threadMessagesQueryOptions } from '@/lib/mastra-queries';

/**
 * Hook para obtener mensajes de un thread
 * Usa useSuspenseQuery para garantizar que los datos estén disponibles
 * Debe usarse con un loader que precargue los datos
 * @param threadId - ID del thread
 * @returns Query con { exists: boolean, messages: UIMessage[] }
 */
export const useThreadMessages = (threadId: string) => {
	const query = useSuspenseQuery(threadMessagesQueryOptions(threadId));
	return {
		...query,
		exists: query.data?.exists ?? false,
		messages: query.data?.messages ?? [],
	};
};
