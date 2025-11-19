#!/usr/bin/env node

/**
 * Gamma MCP Server (HTTP mode with JSON-RPC)
 * For use with AI Engine and other HTTP-based MCP clients
 */

import express, { Request, Response } from 'express';
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

// Define MCP tools
const TOOLS = [
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

// MCP endpoint - handles JSON-RPC 2.0
app.post('/mcp', async (req: Request, res: Response) => {
  console.log('[MCP] Incoming request:', JSON.stringify(req.body, null, 2));

  const { jsonrpc, id, method, params } = req.body;

  // Validate JSON-RPC request
  if (jsonrpc !== '2.0' || !method) {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code: -32600,
        message: 'Invalid Request',
      },
    });
  }

  try {
    let result: any;

    // Handle different MCP methods
    switch (method) {
      case 'tools/list':
        result = {
          tools: TOOLS,
        };
        break;

      case 'tools/call':
        const { name, arguments: args } = params;

        switch (name) {
          case 'gamma_generate': {
            const gammaResult = await gammaClient.generate({
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

            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(gammaResult, null, 2),
                },
              ],
            };
            break;
          }

          case 'gamma_get_generation': {
            const gammaResult = await gammaClient.getGeneration((args?.generationId || '') as string);

            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(gammaResult, null, 2),
                },
              ],
            };
            break;
          }

          case 'gamma_list_generations': {
            const gammaResult = await gammaClient.listGenerations(
              args?.limit ? Number(args.limit) : 10
            );

            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(gammaResult, null, 2),
                },
              ],
            };
            break;
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        break;

      default:
        throw new Error(`Unknown method: ${method}`);
    }

    // Send JSON-RPC success response
    res.json({
      jsonrpc: '2.0',
      id,
      result,
    });

    console.log('[MCP] Response sent successfully');

  } catch (error) {
    console.error('[MCP] Error:', error);

    // Send JSON-RPC error response
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: errorMessage,
      },
    });
  }
});

// Start HTTP server
app.listen(PORT, HOST, () => {
  console.log(`✅ Gamma MCP Server running on http://${HOST}:${PORT}`);
  console.log(`📡 MCP endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`💚 Health check: http://${HOST}:${PORT}/health`);
});
