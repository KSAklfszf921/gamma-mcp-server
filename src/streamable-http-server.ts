#!/usr/bin/env node

/**
 * Gamma MCP Server (HTTP mode with Streamable HTTP transport)
 * For use with AI Engine and other HTTP-based MCP clients
 */

import express, { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { GammaClient } from './gamma-client.js';

// Load environment variables
dotenv.config();

const GAMMA_API_KEY = process.env.GAMMA_API_KEY;
const GAMMA_API_BASE_URL = process.env.GAMMA_API_BASE_URL || 'https://public-api.gamma.app/v1.0';
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

if (!GAMMA_API_KEY) {
  console.error('Error: GAMMA_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Gamma client
const gammaClient = new GammaClient(GAMMA_API_KEY, GAMMA_API_BASE_URL);

// Define MCP tools (same as stdio version)
const TOOLS: Tool[] = [
  {
    name: 'gamma_generate',
    description: 'Generate a new Gamma presentation, document, or webpage. Returns a generation ID that can be used to check status.',
    inputSchema: {
      type: 'object',
      properties: {
        inputText: {
          type: 'string',
          description: 'The topic or content for the presentation/document',
        },
        format: {
          type: 'string',
          enum: ['presentation', 'document', 'webpage'],
          description: 'Output format (default: presentation)',
        },
        numCards: {
          type: 'number',
          description: 'Number of slides/pages (1-20, default: 10)',
          minimum: 1,
          maximum: 20,
        },
        textTone: {
          type: 'string',
          description: 'Tone of the content (e.g., professional, casual, humorous)',
        },
        textAudience: {
          type: 'string',
          description: 'Target audience (e.g., students, executives, general)',
        },
        textAmount: {
          type: 'string',
          enum: ['short', 'medium', 'long'],
          description: 'Amount of text per slide/page',
        },
        textLanguage: {
          type: 'string',
          description: 'Output language (default: Swedish)',
        },
        themeName: {
          type: 'string',
          description: 'Theme name to use',
        },
        additionalInstructions: {
          type: 'string',
          description: 'Additional instructions for content generation',
        },
      },
      required: ['inputText'],
    },
  },
  {
    name: 'gamma_get_generation',
    description: 'Get the status and URL of a previously generated Gamma presentation/document',
    inputSchema: {
      type: 'object',
      properties: {
        generationId: {
          type: 'string',
          description: 'The generation ID returned from gamma_generate',
        },
      },
      required: ['generationId'],
    },
  },
  {
    name: 'gamma_list_generations',
    description: 'List recent Gamma generations',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of generations to return (default: 10)',
          minimum: 1,
          maximum: 100,
        },
      },
    },
  },
];

// Create Express app
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    server: 'gamma-mcp-server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// MCP endpoint handler
app.post('/mcp', async (req: Request, res: Response) => {
  console.log('[MCP] Incoming request:', req.body);

  // Create a new MCP server instance for this request
  const server = new Server(
    {
      name: 'gamma-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list_tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'gamma_generate': {
          const result = await gammaClient.generate({
            inputText: (args?.inputText || '') as string,
            format: args?.format as any,
            numCards: args?.numCards as number,
            textTone: args?.textTone as string,
            textAudience: args?.textAudience as string,
            textAmount: args?.textAmount as any,
            textLanguage: args?.textLanguage as string,
            themeName: args?.themeName as string,
            additionalInstructions: args?.additionalInstructions as string,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'gamma_get_generation': {
          const result = await gammaClient.getGeneration((args?.generationId || '') as string);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'gamma_list_generations': {
          const result = await gammaClient.listGenerations(
            args?.limit ? Number(args.limit) : 10
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Use SSE transport for streaming
  const transport = new SSEServerTransport('/mcp', res);
  await server.connect(transport);

  // Handle request through transport
  req.on('close', () => {
    console.log('[MCP] Client disconnected');
  });
});

// Start HTTP server
app.listen(PORT, HOST, () => {
  console.log(`✅ Gamma MCP Server running on http://${HOST}:${PORT}`);
  console.log(`📡 MCP endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`💚 Health check: http://${HOST}:${PORT}/health`);
});
