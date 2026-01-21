'use client';

import type { NetworkDataPart } from '@mastra/ai-sdk';
import {
	BrainIcon,
	CheckCircleIcon,
	ChevronDownIcon,
	CircleIcon,
	ClockIcon,
	NetworkIcon,
	XCircleIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';
import { Loader } from './loader';

type NetworkData = NetworkDataPart['data'];
type StepResult = NetworkData['steps'][number];
type NetworkStatus = NetworkData['status'];
type StepStatus = StepResult['status'];

export type NetworkExecutionProps = ComponentProps<typeof Collapsible> & {
	data: NetworkData;
	isStreaming?: boolean;
};

const getStatusBadge = (status: NetworkStatus | StepStatus) => {
	const labels: Record<NetworkStatus | StepStatus, string> = {
		running: 'Running',
		finished: 'Completed',
		success: 'Success',
		failed: 'Failed',
		waiting: 'Waiting',
	};

	const icons: Record<NetworkStatus | StepStatus, ReactNode> = {
		running: <Loader size={12} />,
		finished: <CheckCircleIcon className="size-3 text-green-600" />,
		success: <CheckCircleIcon className="size-3 text-green-600" />,
		failed: <XCircleIcon className="size-3 text-red-600" />,
		waiting: <ClockIcon className="size-3 text-muted-foreground" />,
	};

	return (
		<Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
			{icons[status]}
			{labels[status]}
		</Badge>
	);
};

export const NetworkExecution = ({
	className,
	data,
	isStreaming = false,
	...props
}: NetworkExecutionProps) => {
	const isRunning = data.status === 'running' || isStreaming;

	return (
		<Collapsible
			className={cn('group not-prose mb-4 w-full rounded-md border bg-card', className)}
			defaultOpen={isRunning}
			{...props}
		>
			<CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3 hover:bg-accent/50 transition-colors">
				<div className="flex items-center gap-2">
					<NetworkIcon className="size-4 text-muted-foreground" />
					<span className="font-medium text-sm">Agent Network: {data.name}</span>
					{getStatusBadge(data.status)}
				</div>
				<ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
			</CollapsibleTrigger>

			<CollapsibleContent className="data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in">
				<div className="border-t p-4 space-y-3">
					{data.steps.map((step, index) => (
						<NetworkStep
							isLast={index === data.steps.length - 1}
							key={step.id || index}
							step={step}
						/>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};

type NetworkStepProps = {
	step: StepResult;
	isLast: boolean;
};

const NetworkStep = ({ step, isLast }: NetworkStepProps) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="relative">
			<div className="flex items-start gap-3">
				{/* Status indicator */}
				<div className="relative flex flex-col items-center">
					<div
						className={cn(
							'flex size-6 items-center justify-center rounded-full border-2 bg-background',
							step.status === 'success' && 'border-green-600',
							step.status === 'running' && 'border-blue-600',
							step.status === 'failed' && 'border-red-600',
							step.status === 'waiting' && 'border-muted-foreground'
						)}
					>
						{step.status === 'running' && <Loader size={12} />}
						{step.status === 'success' && <CheckCircleIcon className="size-4 text-green-600" />}
						{step.status === 'failed' && <XCircleIcon className="size-4 text-red-600" />}
						{step.status === 'waiting' && <CircleIcon className="size-3 text-muted-foreground" />}
					</div>
					{!isLast && <div className="w-px flex-1 bg-border mt-2 h-full absolute top-6" />}
				</div>

				{/* Step content */}
				<div className="flex-1 space-y-2 pb-4">
					<div className="flex items-center gap-2">
						<span className="font-medium text-sm">{step.name}</span>
						{getStatusBadge(step.status)}
					</div>

					{/* Task reason (for routing decisions) */}
					{step.task && (
						<div className="space-y-1 rounded-md bg-muted/50 p-3">
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<BrainIcon className="size-3" />
								<span className="font-medium">Routing Decision</span>
							</div>
							<p className="text-sm text-foreground">{step.task.reason}</p>
							<div className="flex gap-2 mt-2">
								<Badge className="text-xs" variant="outline">
									Target: {step.task.id}
								</Badge>
								<Badge className="text-xs" variant="outline">
									Type: {step.task.type}
								</Badge>
							</div>
						</div>
					)}

					{/* Expandable details */}
					{(step.input || step.output) && (
						<button
							className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
							onClick={() => setIsExpanded(!isExpanded)}
							type="button"
						>
							<ChevronDownIcon
								className={cn('size-3 transition-transform', isExpanded && 'rotate-180')}
							/>
							{isExpanded ? 'Hide' : 'Show'} details
						</button>
					)}

					{isExpanded && (
						<div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2">
							{step.input && (
								<div className="space-y-1">
									<h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
										Input
									</h4>
									<div className="rounded-md bg-muted/50 overflow-hidden">
										<CodeBlock code={JSON.stringify(step.input, null, 2)} language="json" />
									</div>
								</div>
							)}
							{step.output && (
								<div className="space-y-1">
									<h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
										Output
									</h4>
									<div className="rounded-md bg-muted/50 overflow-hidden">
										{typeof step.output === 'string' ? (
											<p className="p-3 text-sm">{step.output}</p>
										) : (
											<CodeBlock code={JSON.stringify(step.output, null, 2)} language="json" />
										)}
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// Missing import
import { useState } from 'react';
