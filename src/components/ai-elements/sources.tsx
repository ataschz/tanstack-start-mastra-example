import { ChevronDownIcon, LayersIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type SourcesProps = ComponentProps<typeof Collapsible>;

export const Sources = ({ className, ...props }: SourcesProps) => (
	<Collapsible
		className={cn('group not-prose mb-4 w-full rounded-md border bg-card', className)}
		defaultOpen={false}
		{...props}
	/>
);

export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
	count: number;
};

export const SourcesTrigger = ({ className, count, children, ...props }: SourcesTriggerProps) => (
	<CollapsibleTrigger
		className={cn(
			'flex w-full items-center justify-between gap-4 p-3 hover:bg-accent/50 transition-colors',
			className
		)}
		{...props}
	>
		{children ?? (
			<>
				<div className="flex items-center gap-2">
					<LayersIcon className="size-4 text-muted-foreground" />
					<span className="font-medium text-sm">Sources</span>
					<span className="text-sm text-muted-foreground">{count} sources</span>
				</div>
				<ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
			</>
		)}
	</CollapsibleTrigger>
);

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;

export const SourcesContent = ({ className, children, ...props }: SourcesContentProps) => (
	<CollapsibleContent
		className={cn(
			'border-t',
			'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
			className
		)}
		{...props}
	>
		<div className="max-h-[400px] overflow-y-auto">{children}</div>
	</CollapsibleContent>
);

export type SourceProps = ComponentProps<'a'> & {
	title?: string;
	description?: string;
	lastUpdated?: string;
};

export const Source = ({
	href,
	title,
	description,
	lastUpdated,
	className,
	children,
	...props
}: SourceProps) => {
	// Extraer el hostname de la URL para el favicon
	const hostname = href ? new URL(href).hostname : '';
	const faviconUrl = href ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : '';

	// Formatear la fecha de lastUpdated
	const formatDate = (dateString?: string) => {
		if (!dateString) return null;
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('es-ES', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		} catch {
			return dateString;
		}
	};

	return (
		<a
			className={cn(
				'flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors border-b last:border-b-0',
				className
			)}
			href={href}
			rel="noreferrer"
			target="_blank"
			{...props}
		>
			{children ?? (
				<>
					{/* Favicon */}
					{faviconUrl && (
						<img
							alt={`${hostname} favicon`}
							className="size-6 rounded shrink-0 mt-0.5"
							src={faviconUrl}
						/>
					)}
					<div className="flex-1 min-w-0">
						{/* Título */}
						<p className="font-medium text-sm text-foreground truncate">{title || hostname}</p>
						{/* Descripción si existe */}
						{description && (
							<p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
						)}
						{/* URL y fecha */}
						<div className="flex items-center gap-2 mt-1">
							<p className="text-xs text-muted-foreground truncate">{hostname}</p>
							{lastUpdated && (
								<>
									<span className="text-xs text-muted-foreground">•</span>
									<p className="text-xs text-muted-foreground shrink-0">
										{formatDate(lastUpdated)}
									</p>
								</>
							)}
						</div>
					</div>
				</>
			)}
		</a>
	);
};
