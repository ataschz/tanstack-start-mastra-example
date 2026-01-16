import { Link } from '@tanstack/react-router';
import { ModeToggle } from './mode-toggle';

export function Header() {
	return (
		<header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
			<Link to="/" className="flex items-center gap-2">
				<img src="/logo.svg" alt="Logo" className="size-6" />
				<span className="font-semibold text-foreground">Retrip AI Chat</span>
			</Link>
			<ModeToggle />
		</header>
	);
}
