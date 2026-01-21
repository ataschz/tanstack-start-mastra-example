import { Link } from '@tanstack/react-router';
import { ModeToggle } from './mode-toggle';

export function Header() {
	return (
		<header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
			<Link className="flex items-center gap-2" to="/">
				<img alt="Logo" className="size-6" src="/logo.svg" />
				<span className="font-semibold text-foreground">AI Chat</span>
			</Link>
			<ModeToggle />
		</header>
	);
}
