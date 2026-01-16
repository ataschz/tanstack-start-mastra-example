import { useSuspenseQuery } from '@tanstack/react-query';
import { threadsQueryOptions } from '@/lib/mastra-queries';

/**
 * Hook para listar threads/conversaciones
 * Usa useSuspenseQuery para garantizar que los datos estén disponibles
 * Debe usarse con un loader que precargue los datos
 * @returns Query con lista de threads
 */
export const useThreads = () => {
	return useSuspenseQuery(threadsQueryOptions());
};
