#!/usr/bin/env node

/**
 * Gamma MCP Server (HTTP mode with JSON-RPC)
 * Complete implementation of Gamma API via MCP
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

// Define all MCP tools (complete Gamma API coverage)
const TOOLS = [
  {
    name: 'gamma_generate',
    description: 'Generate a new Gamma presentation, document, webpage, or social post. Returns a generation ID that can be polled for status and final URL.',
    inputSchema: {
      type: 'object',
      properties: {
        inputText: {
          type: 'string',
          description: 'Content for the gamma. Can be a brief prompt or detailed text with image URLs.',
        },
        textMode: {
          type: 'string',
          enum: ['generate', 'condense', 'preserve'],
          description: 'How to modify inputText: generate (expand), condense (summarize), preserve (keep as-is)',
        },
        format: {
          type: 'string',
          enum: ['presentation', 'document', 'webpage', 'social'],
          description: 'Type of artifact to create',
        },
        themeId: {
          type: 'string',
          description: 'Theme ID (use gamma_list_themes to get available themes)',
        },
        numCards: {
          type: 'number',
          description: 'Number of cards (1-60 for Pro, 1-75 for Ultra)',
        },
        cardSplit: {
          type: 'string',
          enum: ['auto', 'inputTextBreaks'],
          description: 'How to divide content into cards',
        },
        additionalInstructions: {
          type: 'string',
          description: 'Extra specifications (1-2000 chars)',
        },
        folderIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Folder IDs to store gamma in',
        },
        exportAs: {
          type: 'string',
          enum: ['pdf', 'pptx'],
          description: 'Export format in addition to gamma URL',
        },
        textOptions: {
          type: 'object',
          properties: {
            amount: {
              type: 'string',
              enum: ['brief', 'medium', 'detailed', 'extensive'],
            },
            tone: { type: 'string' },
            audience: { type: 'string' },
            language: { type: 'string' },
          },
        },
        imageOptions: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              enum: ['aiGenerated', 'pictographic', 'unsplash', 'webAllImages',
                     'webFreeToUse', 'webFreeToUseCommercially', 'giphy', 'placeholder', 'noImages'],
            },
            model: { type: 'string' },
            style: { type: 'string' },
          },
        },
        cardOptions: {
          type: 'object',
          properties: {
            dimensions: {
              type: 'string',
              enum: ['fluid', '16x9', '4x3', 'pageless', 'letter', 'a4', '1x1', '4x5', '9x16'],
            },
            headerFooter: { type: 'object' },
          },
        },
        sharingOptions: {
          type: 'object',
          properties: {
            workspaceAccess: {
              type: 'string',
              enum: ['noAccess', 'view', 'comment', 'edit', 'fullAccess'],
            },
            externalAccess: {
              type: 'string',
              enum: ['noAccess', 'view', 'comment', 'edit'],
            },
            emailOptions: { type: 'object' },
          },
        },
      },
      required: ['inputText', 'textMode'],
    },
  },
  {
    name: 'gamma_create_from_template',
    description: 'Create a new gamma based on an existing template. Adapts template to new content while preserving structure.',
    inputSchema: {
      type: 'object',
      properties: {
        gammaId: {
          type: 'string',
          description: 'ID of the template gamma to base this on',
        },
        prompt: {
          type: 'string',
          description: 'Text content, image URLs, and instructions for adapting the template',
        },
        themeId: {
          type: 'string',
          description: 'Override template theme',
        },
        folderIds: {
          type: 'array',
          items: { type: 'string' },
        },
        exportAs: {
          type: 'string',
          enum: ['pdf', 'pptx'],
        },
        imageOptions: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            style: { type: 'string' },
          },
        },
        sharingOptions: { type: 'object' },
      },
      required: ['gammaId', 'prompt'],
    },
  },
  {
    name: 'gamma_get_generation',
    description: 'Get status and URL of a previously generated gamma. Poll this endpoint until status is "completed".',
    inputSchema: {
      type: 'object',
      properties: {
        generationId: {
          type: 'string',
          description: 'Generation ID returned from gamma_generate or gamma_create_from_template',
        },
      },
      required: ['generationId'],
    },
  },
  {
    name: 'gamma_list_themes',
    description: 'List available themes in your Gamma workspace. Use theme IDs in gamma_generate calls.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search themes by name (case-insensitive)',
        },
        limit: {
          type: 'number',
          description: 'Number of themes to return (max 50)',
        },
        after: {
          type: 'string',
          description: 'Cursor for pagination',
        },
      },
    },
  },
  {
    name: 'gamma_list_folders',
    description: 'List folders in your Gamma workspace. Use folder IDs to organize generated gammas.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search folders by name',
        },
        limit: {
          type: 'number',
          description: 'Number of folders to return (max 50)',
        },
        after: {
          type: 'string',
          description: 'Cursor for pagination',
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
    version: '2.0.0',
    tools: TOOLS.length,
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
              inputText: args.inputText,
              textMode: args.textMode,
              format: args.format,
              themeId: args.themeId,
              numCards: args.numCards,
              cardSplit: args.cardSplit,
              additionalInstructions: args.additionalInstructions,
              folderIds: args.folderIds,
              exportAs: args.exportAs,
              textOptions: args.textOptions,
              imageOptions: args.imageOptions,
              cardOptions: args.cardOptions,
              sharingOptions: args.sharingOptions,
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

          case 'gamma_create_from_template': {
            const gammaResult = await gammaClient.createFromTemplate({
              gammaId: args.gammaId,
              prompt: args.prompt,
              themeId: args.themeId,
              folderIds: args.folderIds,
              exportAs: args.exportAs,
              imageOptions: args.imageOptions,
              sharingOptions: args.sharingOptions,
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
            const gammaResult = await gammaClient.getGeneration(args.generationId);

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

          case 'gamma_list_themes': {
            const gammaResult = await gammaClient.listThemes({
              query: args.query,
              limit: args.limit,
              after: args.after,
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

          case 'gamma_list_folders': {
            const gammaResult = await gammaClient.listFolders({
              query: args.query,
              limit: args.limit,
              after: args.after,
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
  console.log(`✅ Gamma MCP Server v2.0.0 running on http://${HOST}:${PORT}`);
  console.log(`📡 MCP endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`💚 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔧 Tools: ${TOOLS.length} (generate, from-template, get, list-themes, list-folders)`);
});
