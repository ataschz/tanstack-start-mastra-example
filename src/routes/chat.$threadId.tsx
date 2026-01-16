import { useChat } from '@ai-sdk/react';
import type { NetworkDataPart } from '@mastra/ai-sdk';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate, useRouterState } from '@tanstack/react-router';
import type { ToolUIPart } from 'ai';
import { DefaultChatTransport } from 'ai';
import { CopyIcon, GlobeIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import {
	Message,
	MessageAction,
	MessageActions,
	MessageContent,
	MessageResponse,
} from '@/components/ai-elements/message';
import { NetworkExecution } from '@/components/ai-elements/network-execution';
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from '@/components/ai-elements/tool';
import { MASTRA_BASE_URL, RESOURCE_ID } from '@/lib/constants';
import { threadMessagesQueryOptions, threadsQueryOptions } from '@/lib/mastra-queries';

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
				// biome-ignore lint/suspicious/noExplicitAny: Empty messages array for new chat
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
			// biome-ignore lint/suspicious/noExplicitAny: AppUIMessage type is compatible at runtime
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
	const initialMessages = loaderData.initialMessages;
	const routerState = useRouterState();
	const [inputValue, setInputValue] = useState('');
	const queryClient = useQueryClient();
	const initialMessageSentRef = useRef(false);
	const navigate = useNavigate();

	// Obtener el mensaje inicial del estado de navegación
	const initialMessage = (routerState.location.state as { initialMessage?: string })
		?.initialMessage;

	const { messages, sendMessage, status } = useChat({
		id: threadId,
		messages: initialMessages,
		generateId: () => uuidv4(),
		transport: new DefaultChatTransport({
			api: `${MASTRA_BASE_URL}/chat`,
			prepareSendMessagesRequest({ messages, id }) {
				const body = {
					id,
					messages: messages.length > 0 ? [messages[messages.length - 1]] : [],
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
	});

	// Enviar mensaje inicial si viene del estado de navegación
	useEffect(() => {
		if (isNewChat && initialMessage && !initialMessageSentRef.current && status !== 'streaming') {
			initialMessageSentRef.current = true;
			sendMessage({ text: initialMessage });

			// Limpiar el param ?new de la URL
			navigate({
				to: '/chat/$threadId',
				params: { threadId },
				search: {}, // Sin el param new
				replace: true,
			});

			// Invalidar threads después de enviar mensaje
			setTimeout(() => {
				queryClient.invalidateQueries({
					queryKey: threadsQueryOptions().queryKey,
				});
			}, 1000);
		}
	}, [isNewChat, initialMessage, status, sendMessage, navigate, threadId, queryClient]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || status === 'streaming') return;

		sendMessage({ text: inputValue });
		setInputValue('');

		// Invalidate threads after sending message
		setTimeout(() => {
			queryClient.invalidateQueries({
				queryKey: threadsQueryOptions().queryKey,
			});
		}, 1000);
	};

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	// Get text content from message parts for copying
	const getMessageText = (message: (typeof messages)[0]) => {
		return message.parts
			.filter((part): part is { type: 'text'; text: string } => part.type === 'text')
			.map((part) => part.text)
			.join('');
	};

	// Render a single message part based on its type
	const renderPart = (part: (typeof messages)[0]['parts'][0], partIndex: number) => {
		// Text content
		if (part.type === 'text' && 'text' in part) {
			const text = part.text as string;
			if (!text || text.trim() === '') return null;
			return <MessageResponse key={partIndex}>{text}</MessageResponse>;
		}

		// Reasoning/thinking content
		if (part.type === 'reasoning' && 'text' in part) {
			const text = part.text as string;
			return (
				<Reasoning isStreaming={status === 'streaming'} key={partIndex}>
					<ReasoningTrigger />
					<ReasoningContent>{text}</ReasoningContent>
				</Reasoning>
			);
		}

		// Network execution (agent networks)
		if (part.type === 'data-network' && 'data' in part) {
			const networkPart = part as NetworkDataPart;
			return (
				<NetworkExecution
					data={networkPart.data}
					isStreaming={status === 'streaming'}
					key={partIndex}
				/>
			);
		}

		// Dynamic tool (network execution results from memory)
		if (part.type === 'dynamic-tool' && 'output' in part) {
			const dynamicPart = part as {
				type: 'dynamic-tool';
				toolCallId: string;
				toolName: string;
				state: string;
				input: unknown;
				output: {
					childMessages?: Array<{
						type: 'tool' | 'text';
						toolCallId?: string;
						toolName?: string;
						args?: Record<string, unknown>;
						toolOutput?: Record<string, unknown>;
						content?: string;
					}>;
					result?: string;
				};
			};

			return (
				<div className="space-y-2" key={partIndex}>
					{dynamicPart.output?.childMessages?.map((child, childIndex) => {
						if (child.type === 'tool') {
							return (
								<Tool key={childIndex}>
									<ToolHeader
										state="output-available"
										title={child.toolName || 'Tool'}
										type={`tool-${child.toolName}`}
									/>
									<ToolContent>
										{child.args && <ToolInput input={child.args} />}
										{child.toolOutput && (
											<ToolOutput errorText={undefined} output={child.toolOutput} />
										)}
									</ToolContent>
								</Tool>
							);
						}
						if (child.type === 'text' && child.content) {
							return <MessageResponse key={childIndex}>{child.content}</MessageResponse>;
						}
						return null;
					})}
				</div>
			);
		}

		// Tool calls (tool-{toolKey})
		if (part.type.startsWith('tool-')) {
			const toolPart = part as ToolUIPart;
			return (
				<Tool key={partIndex}>
					<ToolHeader
						state={toolPart.state}
						title={toolPart.type.replace('tool-', '')}
						type={toolPart.type}
					/>
					<ToolContent>
						{toolPart.input !== undefined && toolPart.input !== null && (
							// biome-ignore lint/suspicious/noExplicitAny: ToolUIPart type compatibility
							<ToolInput input={toolPart.input as any} />
						)}
						{(toolPart.output || toolPart.errorText) && (
							<ToolOutput
								// biome-ignore lint/suspicious/noExplicitAny: ToolUIPart type compatibility
								errorText={toolPart.errorText}
								output={toolPart.output as any}
							/>
						)}
					</ToolContent>
				</Tool>
			);
		}

		return null;
	};

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden">
			<div className="mx-auto flex size-full max-w-4xl flex-col p-6">
				<Conversation className="flex-1">
					<ConversationContent>
						{messages.length === 0 ? (
							<div className="flex size-full flex-col items-center justify-center gap-4 text-center">
								<h2 className="text-2xl font-semibold text-foreground">Travel Assistant</h2>
								<p className="text-muted-foreground">
									Ask me about destinations, weather, and travel recommendations
								</p>
							</div>
						) : (
							messages.map((message, index) => {
								// Check if message has any renderable content
								const hasContent = message.parts.some((part) => {
									if (part.type === 'text' && 'text' in part) {
										const text = part.text as string;
										return text && text.trim() !== '';
									}
									return (
										part.type === 'reasoning' ||
										part.type === 'data-network' ||
										part.type === 'dynamic-tool' ||
										part.type.startsWith('tool-')
									);
								});

								if (!hasContent) return null;

								return (
									<Message from={message.role} key={message.id}>
										<MessageContent>
											{message.parts.map((part, partIndex) => renderPart(part, partIndex))}
										</MessageContent>
										{message.role === 'assistant' &&
											status === 'ready' &&
											index === messages.length - 1 && (
												<MessageActions>
													<MessageAction
														onClick={() => handleCopy(getMessageText(message))}
														tooltip="Copy"
													>
														<CopyIcon className="size-3" />
													</MessageAction>
												</MessageActions>
											)}
									</Message>
								);
							})
						)}
						{status === 'streaming' && (
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Loader size={14} />
								<span>Thinking...</span>
							</div>
						)}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>

				<div className="grid shrink-0 gap-4 pt-4">
					<form onSubmit={handleSubmit}>
						<PromptInput onSubmit={() => {}}>
							<PromptInputBody>
								<PromptInputTextarea
									onChange={(e) => setInputValue(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault();
											handleSubmit(e);
										}
									}}
									placeholder="Ask about travel destinations..."
									value={inputValue}
								/>
							</PromptInputBody>
							<PromptInputFooter>
								<PromptInputTools>
									<PromptInputActionMenu>
										<PromptInputActionMenuTrigger />
										<PromptInputActionMenuContent>
											<PromptInputActionAddAttachments />
										</PromptInputActionMenuContent>
									</PromptInputActionMenu>
									<PromptInputButton>
										<GlobeIcon size={16} />
										<span>Search</span>
									</PromptInputButton>
								</PromptInputTools>
								<PromptInputSubmit
									disabled={!inputValue.trim() || status === 'streaming'}
									status={status}
								/>
							</PromptInputFooter>
						</PromptInput>
					</form>
				</div>
			</div>
		</div>
	);
}
