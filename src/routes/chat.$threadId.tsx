import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, redirect, useRouterState } from '@tanstack/react-router';
import { DefaultChatTransport } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { ChatEmptyState, ChatInput, ChatLayout, MessagePartRenderer } from '@/components/chat';
import { useInvalidateThreads } from '@/hooks/use-invalidate-threads';
import { hasRenderableContent } from '@/lib/chat-utils';
import { MASTRA_BASE_URL, RESOURCE_ID } from '@/lib/constants';
import { threadMessagesQueryOptions } from '@/lib/mastra-queries';

const chatSearchSchema = z.object({
	new: z.boolean().optional(),
});

export const Route = createFileRoute('/chat/$threadId')({
	validateSearch: chatSearchSchema,
	loaderDeps: ({ search }) => ({ isNew: search.new }),
	loader: async ({ params, context, deps }) => {
		const { threadId } = params;
		const isNewChat = deps.isNew === true;

		// Si es un chat nuevo, no validar existencia (el thread se creará al enviar el primer mensaje)
		if (isNewChat) {
			return {
				initialMessages: [] as any,
				threadExists: true, // Consideramos que "existe" para evitar redirección
			};
		}

		// Prefetch mensajes del thread usando query options
		// Usamos ensureQueryData porque necesitamos los datos para el componente
		const data = await context.queryClient.ensureQueryData(threadMessagesQueryOptions(threadId));

		// Si el thread no existe, redirigir a home
		if (!data.exists) {
			throw redirect({ to: '/' });
		}

		return {
			initialMessages: data.messages as any,
			threadExists: data.exists,
		};
	},
	component: ChatPage,
});

function ChatPage() {
	const { threadId } = Route.useParams();
	const { new: isNewChat } = Route.useSearch();
	const loaderData = Route.useLoaderData();
	const routerState = useRouterState();
	const [inputValue, setInputValue] = useState('');
	const initialMessageSentRef = useRef(false);
	const { invalidateThreads } = useInvalidateThreads();

	// Obtener el mensaje inicial y searchEnabled del estado de navegación
	const navigationState = routerState.location.state as {
		initialMessage?: string;
		searchEnabled?: boolean;
	};
	const initialMessage = navigationState?.initialMessage;
	const initialSearchEnabled = navigationState?.searchEnabled ?? false;

	const [searchEnabled, setSearchEnabled] = useState(initialSearchEnabled);

	// Usar ref para que prepareSendMessagesRequest acceda al valor actual
	// sin necesidad de recrear el transport
	const searchEnabledRef = useRef(searchEnabled);

	// Sincronizar ref con state
	useEffect(() => {
		searchEnabledRef.current = searchEnabled;
	}, [searchEnabled]);

	// Usar mensajes del loader como base
	const loaderMessages = loaderData.initialMessages;

	// Usar useQuery para obtener mensajes frescos al navegar de vuelta
	// Solo habilitar si NO es chat nuevo Y el thread existe
	const { data: freshMessages } = useQuery({
		...threadMessagesQueryOptions(threadId),
		enabled: !isNewChat && loaderData.threadExists,
	});

	// Usar freshMessages si están disponibles, sino usar del loader
	const initialMessages = freshMessages?.messages || loaderMessages;

	// Crear transport una sola vez - usar ref en prepareSendMessagesRequest
	// para acceder al valor actual de searchEnabled sin recrear el transport
	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: `${MASTRA_BASE_URL}/chat`,
				prepareSendMessagesRequest({ messages, id }) {
					const body = {
						id,
						messages: messages.length > 0 ? [messages[messages.length - 1]] : [],
						webSearchEnabled: searchEnabledRef.current, // Usar ref para valor actual
						memory: {
							thread: threadId,
							resource: RESOURCE_ID,
						},
					};

					return {
						body,
					};
				},
			}),
		[threadId] // Solo recrear si cambia threadId
	);

	const { messages, sendMessage, status, stop } = useChat({
		id: threadId,
		messages: initialMessages,
		generateId: () => uuidv4(),
		transport,
	});

	// Enviar mensaje inicial si viene del estado de navegación
	useEffect(() => {
		if (isNewChat && initialMessage && !initialMessageSentRef.current && status !== 'streaming') {
			initialMessageSentRef.current = true;
			sendMessage({ text: initialMessage });
		}
	}, [isNewChat, initialMessage, status, sendMessage]);

	// Invalidar threads/messages cuando el stream finaliza exitosamente
	const prevStatusRef = useRef(status);

	useEffect(() => {
		const prevStatus = prevStatusRef.current;
		const currentStatus = status;

		// Detectar cuando el stream termina (streaming -> ready)
		if (prevStatus === 'streaming' && currentStatus === 'ready') {
			// Validación adicional: verificar que hay al menos 2 mensajes
			// (usuario + asistente) para evitar invalidar si hubo un error
			if (messages.length > 1) {
				console.log('✅ Stream completed successfully, invalidating queries...');

				// Invalidar threads para actualizar la lista en sidebar
				invalidateThreads(0); // Sin delay, el thread ya existe
			} else {
				console.warn('⚠️ Stream ended but only 1 message, possible error - skipping invalidation');
			}
		}

		// Actualizar ref para la próxima comparación
		prevStatusRef.current = currentStatus;
	}, [status, messages.length, invalidateThreads]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || status === 'streaming') return;

		sendMessage({ text: inputValue });
		setInputValue('');

		// Las invalidaciones ahora ocurren cuando el stream termine exitosamente
	};

	return (
		<ChatLayout>
			<Conversation className="flex-1">
				<ConversationContent>
					{messages.length === 0 ? (
						<ChatEmptyState />
					) : (
						messages.map((message, index) => {
							// Check if message has any renderable content
							if (!hasRenderableContent(message as any)) return null;

							return (
								<Message from={message.role} key={message.id}>
									<MessageContent>
										{message.parts.map((part, partIndex) => {
											const hasTextPart = message.parts.some(
												(p) => p.type === 'text' && 'text' in p && (p.text as string)?.trim()
											);
											return (
												<MessagePartRenderer
													allParts={message.parts}
													hasTextPart={hasTextPart}
													isLastMessage={index === messages.length - 1}
													key={partIndex}
													part={part}
													partIndex={partIndex}
													status={status}
												/>
											);
										})}
									</MessageContent>
								</Message>
							);
						})
					)}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			<div className="grid shrink-0 gap-4 pt-4">
				<ChatInput
					disabled={!inputValue.trim() && status !== 'streaming'}
					onChange={setInputValue}
					onSearchEnabledChange={setSearchEnabled}
					onStop={stop}
					onSubmit={handleSubmit}
					searchEnabled={searchEnabled}
					status={status}
					value={inputValue}
				/>
			</div>
		</ChatLayout>
	);
}
