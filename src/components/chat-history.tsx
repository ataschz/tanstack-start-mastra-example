import { useMastraClient } from '@mastra/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { HistoryIcon, MessageSquareIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatHistoryProps {
	resourceId: string;
	agentId: string;
	currentThreadId?: string;
	onSelectThread: (threadId: string) => void;
	onNewChat: () => void;
}

export function ChatHistory({
	resourceId,
	agentId,
	currentThreadId,
	onSelectThread,
	onNewChat,
}: ChatHistoryProps) {
	const [open, setOpen] = useState(false);
	const client = useMastraClient();
	const queryClient = useQueryClient();

	// Verificar si la memoria está habilitada
	const { data: memoryStatus } = useQuery({
		queryKey: ['memory', agentId],
		queryFn: () => client.getMemoryStatus(agentId),
		staleTime: 5 * 60 * 1000,
		retry: false,
	});

	const isMemoryEnabled = memoryStatus?.result ?? false;

	// Obtener threads
	const { data: threads, isLoading } = useQuery({
		queryKey: ['memory', 'threads', resourceId, agentId],
		queryFn: async () => {
			const result = await client.listMemoryThreads({ resourceId, agentId });
			return result.threads;
		},
		enabled: isMemoryEnabled,
		staleTime: 0,
		refetchOnWindowFocus: false,
	});

	// Eliminar thread
	const deleteThread = useMutation({
		mutationFn: async (threadId: string) => {
			const thread = client.getMemoryThread({ threadId, agentId });
			return thread.delete();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['memory', 'threads', resourceId, agentId],
			});
		},
	});

	const handleDelete = (e: React.MouseEvent, threadId: string) => {
		e.stopPropagation();
		deleteThread.mutate(threadId);
	};

	const handleSelectThread = (threadId: string) => {
		onSelectThread(threadId);
		setOpen(false);
	};

	const handleNewChat = () => {
		onNewChat();
		setOpen(false);
	};

	if (!isMemoryEnabled) {
		return null;
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="outline" size="sm">
					<HistoryIcon className="mr-2 size-4" />
					History
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-80 p-0">
				<SheetHeader className="border-b p-4">
					<SheetTitle>Conversations</SheetTitle>
				</SheetHeader>

				<div className="p-4">
					<Button variant="outline" className="w-full justify-start" onClick={handleNewChat}>
						<PlusIcon className="mr-2 size-4" />
						New Chat
					</Button>
				</div>

				<ScrollArea className="h-[calc(100vh-140px)]">
					<div className="flex flex-col gap-1 p-4 pt-0">
						{isLoading ? (
							<div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
						) : threads && threads.length > 0 ? (
							threads.map((thread) => (
								<button
									key={thread.id}
									type="button"
									onClick={() => handleSelectThread(thread.id)}
									className={cn(
										'group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
										currentThreadId === thread.id && 'bg-muted'
									)}
								>
									<div className="flex min-w-0 flex-1 items-center gap-2">
										<MessageSquareIcon className="size-4 shrink-0 text-muted-foreground" />
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium">{thread.title || 'Untitled'}</p>
											<p className="text-xs text-muted-foreground">
												{thread.createdAt
													? formatDistanceToNow(new Date(thread.createdAt), {
															addSuffix: true,
															locale: es,
														})
													: ''}
											</p>
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon"
										className="size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
										onClick={(e) => handleDelete(e, thread.id)}
										disabled={deleteThread.isPending}
									>
										<Trash2Icon className="size-3" />
									</Button>
								</button>
							))
						) : (
							<div className="py-8 text-center text-sm text-muted-foreground">
								No conversations yet
							</div>
						)}
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}
