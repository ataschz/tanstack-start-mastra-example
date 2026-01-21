import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Marcador para identificar mensajes de network en el JSON
 */
export const NETWORK_MESSAGE_MARKER = '"isNetwork":true';

/**
 * Verifica si un texto contiene datos de ejecución de network
 * @param text - Texto a verificar
 * @returns true si el texto contiene el marcador de network
 */
export function isNetworkMessage(text: string): boolean {
	return text.includes(NETWORK_MESSAGE_MARKER);
}

/**
 * Type guard para extraer texto de un part de mensaje
 */
export interface TextPart {
	type: 'text';
	text: string;
}

/**
 * Verifica si un part es de tipo texto y extrae el contenido
 * @param part - Part del mensaje a verificar
 * @returns El texto si es un TextPart, undefined si no lo es
 */
export function getTextFromPart(part: unknown): string | undefined {
	if (
		typeof part === 'object' &&
		part !== null &&
		'type' in part &&
		(part as { type: string }).type === 'text' &&
		'text' in part &&
		typeof (part as { text: unknown }).text === 'string'
	) {
		return (part as TextPart).text;
	}
	return undefined;
}
