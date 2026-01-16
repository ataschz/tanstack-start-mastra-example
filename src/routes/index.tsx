import type { HistoryState } from '@tanstack/react-router';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { GlobeIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';

interface ChatNavigationState extends HistoryState {
	initialMessage?: string;
}

export const Route = createFileRoute('/')({
	loader: () => {
		return { threadId: uuidv4() };
	},
	component: HomePage,
});

const suggestions = [
	'Where can I travel for a beach vacation?',
	"What's the weather like in Tokyo?",
	'Recommend me a mountain destination',
	'Best places to visit in Europe',
];

function HomePage() {
	const navigate = useNavigate();
	const { threadId } = Route.useLoaderData();
	const [inputValue, setInputValue] = useState('');

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!inputValue.trim()) return;

			// Navegar a la URL con threadId y pasar el mensaje como estado
			navigate({
				to: '/chat/$threadId',
				params: { threadId },
				replace: true,
				search: { new: true },
				state: {
					initialMessage: inputValue,
				} as ChatNavigationState,
			});
		},
		[inputValue, navigate, threadId]
	);

	const handleSuggestionClick = useCallback(
		(suggestion: string) => {
			// Navegar a la URL con threadId y pasar la sugerencia como estado
			navigate({
				to: '/chat/$threadId',
				params: { threadId },
				replace: true,
				search: { new: true },
				state: {
					initialMessage: suggestion,
				} as ChatNavigationState,
			});
		},
		[navigate, threadId]
	);

	return (
		<div className="relative flex h-full w-full flex-col overflow-hidden">
			<div className="mx-auto flex size-full max-w-4xl flex-col p-6">
				<div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
					<h2 className="text-2xl font-semibold text-foreground">Travel Assistant</h2>
					<p className="text-muted-foreground">
						Ask me about destinations, weather, and travel recommendations
					</p>
				</div>

				<div className="grid shrink-0 gap-4 pt-4">
					<Suggestions>
						{suggestions.map((suggestion) => (
							<Suggestion
								key={suggestion}
								onClick={() => handleSuggestionClick(suggestion)}
								suggestion={suggestion}
							/>
						))}
					</Suggestions>

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
								<PromptInputSubmit disabled={!inputValue.trim()} />
							</PromptInputFooter>
						</PromptInput>
					</form>
				</div>
			</div>
		</div>
	);
}
