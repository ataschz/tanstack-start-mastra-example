import { useChat } from "@ai-sdk/react";
import type { NetworkDataPart } from "@mastra/ai-sdk";
import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
import { useMastraClient } from "@mastra/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ToolUIPart } from "ai";
import { DefaultChatTransport } from "ai";
import { CopyIcon, GlobeIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
	Message,
	MessageAction,
	MessageActions,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import { NetworkExecution } from "@/components/ai-elements/network-execution";
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
} from "@/components/ai-elements/prompt-input";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "@/components/ai-elements/tool";
import { ChatHistory } from "@/components/chat-history";
import { Button } from "@/components/ui/button";
import { MASTRA_BASE_URL } from "@/lib/constants";
import { filterDisplayableMessages } from "@/lib/filter-displayable-messages";

const AGENT_ID = "routing-agent";
const RESOURCE_ID = "Travel Assistant"; // Mastra uses the agent name as resourceId by default
export const Route = createFileRoute("/chat/$threadId")({
	component: ChatPage,
});

function ChatPage() {
	const { threadId } = Route.useParams();
	const navigate = useNavigate();
	const [inputValue, setInputValue] = useState("");
	const client = useMastraClient();
	const queryClient = useQueryClient();

	// Load existing thread messages
	const { data: existingMessages, isLoading: isLoadingMessages } = useQuery({
		queryKey: ["memory", "messages", threadId, AGENT_ID],
		queryFn: async () => {
			try {
				const result = await client.listThreadMessages(threadId, {
					agentId: AGENT_ID,
				});
				return result.messages || [];
			} catch {
				// Thread doesn't exist yet, it's new
				return [];
			}
		},
		staleTime: 0,
		retry: false,
	});

	const { messages, sendMessage, status, setMessages } = useChat({
		id: threadId,
		// @ts-expect-error experimental_generateId is not in stable types yet
		experimental_generateId: () => uuidv4(), // Generate UUIDs for message IDs
		transport: new DefaultChatTransport({
			api: `${MASTRA_BASE_URL}/chat`,
			body: {
				threadId,
				resourceId: RESOURCE_ID,
			},
		}),
	});

	// Load existing messages when thread changes
	useEffect(() => {
		if (
			existingMessages &&
			existingMessages.length > 0 &&
			messages.length === 0
		) {
			const uiMessages = toAISdkV5Messages(existingMessages);
			const displayableMessages = filterDisplayableMessages(uiMessages);
			setMessages(displayableMessages);
		}
	}, [existingMessages, messages.length, setMessages]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || status === "streaming") return;

		sendMessage({ text: inputValue });
		setInputValue("");

		// Invalidate threads after sending message
		setTimeout(() => {
			queryClient.invalidateQueries({
				queryKey: ["memory", "threads", RESOURCE_ID, AGENT_ID],
			});
		}, 1000);
	};

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const handleNewChat = useCallback(() => {
		navigate({ to: "/" });
	}, [navigate]);

	const handleSelectThread = useCallback(
		(selectedThreadId: string) => {
			navigate({
				to: "/chat/$threadId",
				params: { threadId: selectedThreadId },
			});
		},
		[navigate],
	);

	// Get text content from message parts for copying
	const getMessageText = (message: (typeof messages)[0]) => {
		return message.parts
			.filter(
				(part): part is { type: "text"; text: string } => part.type === "text",
			)
			.map((part) => part.text)
			.join("");
	};

	// Render a single message part based on its type
	const renderPart = (
		part: (typeof messages)[0]["parts"][0],
		partIndex: number,
	) => {
		// Text content
		if (part.type === "text" && "text" in part) {
			const text = part.text as string;
			if (!text || text.trim() === "") return null;
			return <MessageResponse key={partIndex}>{text}</MessageResponse>;
		}

		// Reasoning/thinking content
		if (part.type === "reasoning" && "text" in part) {
			const text = part.text as string;
			return (
				<Reasoning key={partIndex} isStreaming={status === "streaming"}>
					<ReasoningTrigger />
					<ReasoningContent>{text}</ReasoningContent>
				</Reasoning>
			);
		}

		// Network execution (agent networks)
		if (part.type === "data-network" && "data" in part) {
			const networkPart = part as NetworkDataPart;
			return (
				<NetworkExecution
					key={partIndex}
					data={networkPart.data}
					isStreaming={status === "streaming"}
				/>
			);
		}

		// Tool calls (tool-{toolKey})
		if (part.type.startsWith("tool-")) {
			const toolPart = part as ToolUIPart;
			return (
				<Tool key={partIndex}>
					<ToolHeader
						title={toolPart.type.replace("tool-", "")}
						type={toolPart.type}
						state={toolPart.state}
					/>
					<ToolContent>
						{toolPart.input !== undefined && toolPart.input !== null && (
							// biome-ignore lint/suspicious/noExplicitAny: ToolUIPart type compatibility
							<ToolInput input={toolPart.input as any} />
						)}
						{(toolPart.output || toolPart.errorText) && (
							<ToolOutput
								// biome-ignore lint/suspicious/noExplicitAny: ToolUIPart type compatibility
								output={toolPart.output as any}
								errorText={toolPart.errorText}
							/>
						)}
					</ToolContent>
				</Tool>
			);
		}

		return null;
	};

	if (isLoadingMessages) {
		return (
			<div className="flex h-[calc(100vh-72px)] items-center justify-center">
				<Loader size={24} />
			</div>
		);
	}

	return (
		<div className="relative flex h-[calc(100vh-72px)] w-full flex-col overflow-hidden">
			<div className="mx-auto flex size-full max-w-4xl flex-col p-6">
				{/* Header with new chat button and history */}
				<div className="mb-4 flex items-center justify-between">
					<ChatHistory
						resourceId={RESOURCE_ID}
						agentId={AGENT_ID}
						currentThreadId={threadId}
						onSelectThread={handleSelectThread}
						onNewChat={handleNewChat}
					/>
					<Button variant="outline" size="sm" onClick={handleNewChat}>
						<PlusIcon className="mr-2 size-4" />
						New Chat
					</Button>
				</div>

				<Conversation className="flex-1">
					<ConversationContent>
						{messages.length === 0 ? (
							<div className="flex size-full flex-col items-center justify-center gap-4 text-center">
								<h2 className="text-2xl font-semibold text-foreground">
									Travel Assistant
								</h2>
								<p className="text-muted-foreground">
									Ask me about destinations, weather, and travel recommendations
								</p>
							</div>
						) : (
							messages.map((message, index) => {
								// Check if message has any renderable content
								const hasContent = message.parts.some((part) => {
									if (part.type === "text" && "text" in part) {
										const text = part.text as string;
										return text && text.trim() !== "";
									}
									return (
										part.type === "reasoning" ||
										part.type === "data-network" ||
										part.type.startsWith("tool-")
									);
								});

								if (!hasContent) return null;

								return (
									<Message key={message.id} from={message.role}>
										<MessageContent>
											{message.parts.map((part, partIndex) =>
												renderPart(part, partIndex),
											)}
										</MessageContent>
										{message.role === "assistant" &&
											status === "ready" &&
											index === messages.length - 1 && (
												<MessageActions>
													<MessageAction
														tooltip="Copy"
														onClick={() => handleCopy(getMessageText(message))}
													>
														<CopyIcon className="size-3" />
													</MessageAction>
												</MessageActions>
											)}
									</Message>
								);
							})
						)}
						{status === "streaming" && (
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
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									placeholder="Ask about travel destinations..."
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleSubmit(e);
										}
									}}
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
									disabled={!inputValue.trim() || status === "streaming"}
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
