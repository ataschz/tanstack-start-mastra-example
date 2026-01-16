import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { GlobeIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
	Message,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
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
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { ChatHistory } from "@/components/chat-history";
import { MASTRA_BASE_URL } from "@/lib/constants";

const AGENT_ID = "routing-agent";
const RESOURCE_ID = "Travel Assistant"; // Mastra usa el nombre del agente como resourceId por defecto

export const Route = createFileRoute("/")({
	component: HomePage,
});

const suggestions = [
	"Where can I travel for a beach vacation?",
	"What's the weather like in Tokyo?",
	"Recommend me a mountain destination",
	"Best places to visit in Europe",
];

function HomePage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [inputValue, setInputValue] = useState("");

	// Generate unique threadId for this session using UUID
	const threadId = useMemo(() => uuidv4(), []);

	const { messages, sendMessage, status } = useChat({
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

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || status === "streaming") return;

		sendMessage({ text: inputValue });
		setInputValue("");

		// Navegar a la URL con threadId después de enviar el primer mensaje
		navigate({
			to: "/chat/$threadId",
			params: { threadId },
			replace: true,
		});

		// Invalidar threads después de enviar mensaje
		setTimeout(() => {
			queryClient.invalidateQueries({
				queryKey: ["memory", "threads", RESOURCE_ID, AGENT_ID],
			});
		}, 1000);
	};

	const handleSuggestionClick = (suggestion: string) => {
		if (status === "streaming") return;

		sendMessage({ text: suggestion });

		// Navegar a la URL con threadId
		navigate({
			to: "/chat/$threadId",
			params: { threadId },
			replace: true,
		});

		// Invalidar threads después de enviar mensaje
		setTimeout(() => {
			queryClient.invalidateQueries({
				queryKey: ["memory", "threads", RESOURCE_ID, AGENT_ID],
			});
		}, 1000);
	};

	const handleNewChat = useCallback(() => {
		// Recargar la página para generar un nuevo threadId
		window.location.href = "/";
	}, []);

	const handleSelectThread = useCallback(
		(selectedThreadId: string) => {
			navigate({
				to: "/chat/$threadId",
				params: { threadId: selectedThreadId },
			});
		},
		[navigate],
	);

	// Get text content from message parts
	const getMessageText = (message: (typeof messages)[0]) => {
		return message.parts
			.filter(
				(part): part is { type: "text"; text: string } => part.type === "text",
			)
			.map((part) => part.text)
			.join("");
	};

	return (
		<div className="relative flex h-[calc(100vh-72px)] w-full flex-col overflow-hidden">
			<div className="mx-auto flex size-full max-w-4xl flex-col p-6">
				{/* Header con historial */}
				<div className="mb-4 flex items-center justify-between">
					<ChatHistory
						resourceId={RESOURCE_ID}
						agentId={AGENT_ID}
						currentThreadId={undefined}
						onSelectThread={handleSelectThread}
						onNewChat={handleNewChat}
					/>
					<div />
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
							messages.map((message) => {
								const textContent = getMessageText(message);
								if (!textContent) return null;

								return (
									<Message key={message.id} from={message.role}>
										<MessageContent>
											<MessageResponse>{textContent}</MessageResponse>
										</MessageContent>
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
					{messages.length === 0 && (
						<Suggestions>
							{suggestions.map((suggestion) => (
								<Suggestion
									key={suggestion}
									suggestion={suggestion}
									onClick={() => handleSuggestionClick(suggestion)}
								/>
							))}
						</Suggestions>
					)}

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
