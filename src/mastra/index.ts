import { networkRoute } from '@mastra/ai-sdk';
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { destinationsAgent } from './agents/destinations-agent';
import { routingAgent } from './agents/routing-agent';
import { weatherAgent } from './agents/weather-agent';
import { weatherWorkflow } from './workflows/weather-workflow';

export const mastra = new Mastra({
	agents: {
		weatherAgent,
		destinationsAgent,
		routingAgent,
	},
	workflows: {
		weatherWorkflow,
	},
	storage: new LibSQLStore({
		id: 'mastra-storage',
		url: 'file:./mastra.db',
	}),
	logger: new PinoLogger({
		name: 'Mastra',
		level: 'info',
	}),
	server: {
		cors: {
			origin: '*',
			allowMethods: ['*'],
			allowHeaders: ['*'],
		},
		apiRoutes: [
			networkRoute({
				path: '/chat',
				agent: 'routingAgent',
			}),
		],
	},
});
