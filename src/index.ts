#!/usr/bin/env node
/**
 * Gamma MCP Server (stdio mode)
 * For use with Claude Desktop - HTTP mode recommended for full functionality
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

dotenv.config();

const server = new Server(
  { name: 'gamma-mcp-server', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));
server.setRequestHandler(CallToolRequestSchema, async () => ({
  content: [{ type: 'text', text: 'Use HTTP mode for full functionality' }]
}));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gamma MCP Server stdio mode - use HTTP mode instead');
}

main().catch(console.error);
