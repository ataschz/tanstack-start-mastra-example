import type { UIMessage } from "@ai-sdk/react";

/**
 * Filters out internal system messages that should not be displayed to the user.
 * This includes:
 * - Completion Check Results (network routing metadata)
 * - Network execution JSON messages
 * - Messages with no displayable content
 */
export function filterDisplayableMessages(
	messages: UIMessage[],
): UIMessage[] {
	return messages.filter((message) => {
		const metadata = message.metadata as Record<string, unknown> | undefined;

		// Filter out "Completion Check" messages from network routing
		if (metadata?.mode === "network" && metadata?.completionResult) {
			return false;
		}

		// Filter out messages that are network execution JSON
		const textPart = message.parts.find((p) => p.type === "text");
		if (textPart && "text" in textPart) {
			const text = (textPart as { text: string }).text;
			if (text.includes('"isNetwork":true')) {
				return false;
			}
		}

		// Check if message has any displayable content
		// Now we display tools, network data, reasoning, and text
		const hasDisplayableContent = message.parts.some((part) => {
			// Text content (non-empty)
			if (part.type === "text" && "text" in part) {
				const text = (part as { text: string }).text;
				return text && text.trim() !== "";
			}
			// Tool calls - now displayable
			if (part.type.startsWith("tool-")) {
				return true;
			}
			// Network execution data - now displayable
			if (part.type === "data-network") {
				return true;
			}
			// Dynamic tool parts (from resolved network messages)
			if (part.type === "dynamic-tool") {
				return true;
			}
			// Reasoning/thinking - now displayable
			if (part.type === "reasoning") {
				return true;
			}
			return false;
		});

		return hasDisplayableContent;
	});
}
