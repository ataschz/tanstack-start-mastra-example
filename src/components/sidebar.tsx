import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquareIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeleteThread } from '@/hooks/use-delete-thread';
import { useThreads } from '@/hooks/use-threads';
import { cn } from '@/lib/utils';

export function Sidebar() {
	const navigate = useNavigate();
	const params = useParams({ strict: false });

	// Obtener threadId actual de la ruta (si existe)
	const currentThreadId = 'threadId' in params ? params.threadId : undefined;

	// useSuspenseQuery: los datos siempre están disponibles (prefetch en loader)
	const { data: threads } = useThreads();

	// Eliminar thread
	const deleteThread = useDeleteThread();

	const handleNewChat = useCallback(() => {
		navigate({ to: '/' });
	}, [navigate]);

	const handleDelete = useCallback(
		(e: React.MouseEvent, threadId: string) => {
			e.preventDefault(); // Prevenir navegación del Link
			e.stopPropagation();
			// Si estamos eliminando el thread actual, redirigir a home
			if (threadId === currentThreadId) {
				navigate({ to: '/' });
			}
			deleteThread.mutate(threadId);
		},
		[deleteThread, currentThreadId, navigate]
	);

	return (
		<aside className="flex h-full w-64 flex-col border-r bg-background">
			{/* Header */}
			<div className="border-b p-4">
				<Button className="w-full justify-start" onClick={handleNewChat} variant="outline">
					<PlusIcon className="mr-2 size-4" />
					New Chat
				</Button>
			</div>

			{/* Lista de threads */}
			<ScrollArea className="flex-1">
				<div className="flex flex-col gap-1 p-2">
					{threads && threads.length > 0 ? (
						threads.map((thread: { id: string; title?: string; createdAt?: string }) => (
							<Link
								className={cn(
									'group flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
									currentThreadId === thread.id && 'bg-accent text-accent-foreground'
								)}
								key={thread.id}
								params={{ threadId: thread.id }}
								to="/chat/$threadId"
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
									className="size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
									disabled={deleteThread.isPending}
									onClick={(e) => handleDelete(e, thread.id)}
									size="icon"
									variant="ghost"
								>
									<Trash2Icon className="size-3" />
								</Button>
							</Link>
						))
					) : (
						<div className="py-8 text-center text-sm text-muted-foreground">
							No conversations yet
						</div>
					)}
				</div>
			</ScrollArea>
		</aside>
	);
}
