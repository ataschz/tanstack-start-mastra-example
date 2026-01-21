import { GlobeIcon } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface ChatInputProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onStop?: () => void;
	disabled?: boolean;
	status?: 'ready' | 'streaming' | 'submitted' | 'error';
	placeholder?: string;
	contextUsage?: {
		totalTokens: number;
		maxTokens: number;
	};
	messagesCount?: number;
	searchEnabled?: boolean;
	onSearchEnabledChange?: (enabled: boolean) => void;
}

export function ChatInput({
	value,
	onChange,
	onSubmit,
	onStop,
	disabled,
	status = 'ready',
	placeholder = 'Ask about travel destinations...',
	searchEnabled = false,
	onSearchEnabledChange,
}: ChatInputProps) {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSubmit(e as unknown as React.FormEvent);
		}
	};

	return (
		<div className={cn(status === 'streaming' && 'streaming-border')}>
			<form onSubmit={onSubmit}>
				<PromptInput onSubmit={() => {}}>
					<PromptInputBody>
						<PromptInputTextarea
							onChange={(e) => onChange(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder={placeholder}
							value={value}
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
							<PromptInputButton
								onClick={(e) => {
									e.preventDefault();
									onSearchEnabledChange?.(!searchEnabled);
								}}
								variant={searchEnabled ? 'default' : 'ghost'}
							>
								<GlobeIcon size={16} />
								<span>Search</span>
							</PromptInputButton>
						</PromptInputTools>

						<PromptInputSubmit
							disabled={disabled}
							onClick={(e) => {
								if (status === 'streaming' && onStop) {
									e.preventDefault();
									onStop();
								}
							}}
							status={status}
						/>
					</PromptInputFooter>
				</PromptInput>
			</form>
		</div>
	);
}
