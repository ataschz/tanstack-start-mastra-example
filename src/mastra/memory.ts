import { google } from '@ai-sdk/google';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';

const agentStorage = new LibSQLStore({
	id: 'routing-agent-memory',
	url: 'file:./mastra.db',
});

export const memory = new Memory({
	storage: agentStorage,
	options: {
		generateTitle: {
			model: google('gemini-2.5-flash-lite'),
			instructions:
				'Generate a concise title (max 6 words) based on the user message. Respond only with the title, no quotes or extra text.',
		},
	},
});
