import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";

const agentStorage = new LibSQLStore({
	id: 'routing-agent-memory',
	url: 'file:./mastra.db',
});

export const memory = new Memory({
	storage: agentStorage,
	options: {
		generateTitle: true,
	},
});
