import { useMastraClient } from '@mastra/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AGENT_ID, RESOURCE_ID } from '@/lib/constants';

/**
 * Hook para eliminar un thread
 * @returns Mutation para eliminar thread
 */
export const useDeleteThread = () => {
	const client = useMastraClient();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (threadId: string) => {
			const thread = client.getMemoryThread({ threadId, agentId: AGENT_ID });
			return thread.delete();
		},
		onSuccess: () => {
			// Invalidar queries de threads para refrescar la lista
			queryClient.invalidateQueries({
				queryKey: ['mastra', 'threads', RESOURCE_ID],
			});
		},
		onError: (error) => {
			console.error('Failed to delete thread:', error);
		},
	});
};
