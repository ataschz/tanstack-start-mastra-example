import type { UIMessage } from '@ai-sdk/react';

/**
 * Tipo para mensajes de UI de nuestra app
 * Compatible con TanStack Router serialization (metadata?: {} en lugar de unknown)
 */
export type AppUIMessage = Omit<UIMessage, 'metadata'> & {
	metadata?: Record<string, unknown>;
};

/**
 * Array de mensajes de UI
 */
export type AppUIMessages = AppUIMessage[];

/**
 * Convierte UIMessage[] a AppUIMessages (cast seguro para serialización)
 */
export function toAppUIMessages(messages: UIMessage[]): AppUIMessages {
	return messages as unknown as AppUIMessages;
}
