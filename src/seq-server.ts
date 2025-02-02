import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuration and constants
const SEQ_BASE_URL = process.env.SEQ_BASE_URL || 'http://localhost:8080';
const SEQ_API_KEY = process.env.SEQ_API_KEY || '';

// Types for SEQ API responses
interface Signal {
  id: string;
  title: string;
  description?: string;
  filters: unknown;
  ownerId?: string;
  shared: boolean;
}

interface Event {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  messageTemplateTokens?: Record<string, unknown>[];
  properties: Record<string, unknown>;
}

// Create the MCP server
const server = new McpServer({
  name: "seq-server",
  version: "1.0.0"
});

// Helper function for SEQ API requests
async function makeSeqRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${SEQ_BASE_URL}${endpoint}`);
  
  // Add API key as query parameter if not in headers
  url.searchParams.append('apiKey', SEQ_API_KEY);
  
  // Add additional query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Seq-ApiKey': SEQ_API_KEY
  };
  
  const response = await fetch(url.toString(), {
    headers: headers
  });

  if (!response.ok) {
    throw new Error(`SEQ API error: ${response.statusText}`);
  }

  return response.json();
}

// Resource for listing signals
server.resource(
  "signals",
  "seq://signals",
  async () => {
    try {
      const signals = await makeSeqRequest<Signal[]>('/api/signals');
      const formattedSignals = signals.map(signal => ({
        id: signal.id,
        title: signal.title,
        description: signal.description || 'No description provided',
        shared: signal.shared,
        ownerId: signal.ownerId
      }));

      return {
        contents: [{
          uri: 'seq://signals',
          text: JSON.stringify(formattedSignals, null, 2)
        }]
      };
    } catch (error) {
      console.error('Error fetching signals:', error);
      throw error;
    }
  }
);

// Tool for fetching signals with filters
server.tool(
  "get-signals",
  {
    ownerId: z.string().optional(),
    shared: z.boolean().optional(),
    partial: z.boolean().optional()
  },
  async ({ ownerId, shared, partial }) => {
    try {
      const params: Record<string, string> = {
        // Default to shared=true if no other params provided
        shared: shared?.toString() ?? "true"
      };
      if (ownerId) params.ownerId = ownerId;
      if (partial !== undefined) params.partial = partial.toString();

      const signals = await makeSeqRequest<Signal[]>('/api/signals', params);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(signals, null, 2)
        }]
      };
    } catch (error) {
      const err = error as Error;
      return {
        content: [{
          type: "text",
          text: `Error fetching signals: ${err.message}`
        }],
        isError: true
      };
    }
  }
);

// Helper function to format message template tokens for better readability
function formatMessageTemplateTokens(tokens?: Record<string, unknown>[]): string {
  if (!tokens) return '';
  
  return tokens.map(token => {
    if ('Text' in token) return String(token.Text);
    if ('PropertyName' in token) return `{${String(token.PropertyName)}}`;
    return '';
  }).join('');
}

// Tool for fetching events
server.tool(
  "get-events",
  {
    signalId: z.string().optional(),
    count: z.number().min(1).max(1000).optional(),
    fromDateUtc: z.string(),
    toDateUtc: z.string()
  },
  async ({ signalId, count, fromDateUtc, toDateUtc }) => {
    try {
      const params: Record<string, string> = {
        fromDateUtc,
        toDateUtc
      };

      if (signalId) params.signalId = signalId;
      if (count) params.count = count.toString();

      const events = await makeSeqRequest<Event[]>('/api/events', params);
      
      // Format events for better readability
      const formattedEvents = events.map(event => ({
        timestamp: event.timestamp,
        level: event.level,
        message: event.message,
        messageTemplate: formatMessageTemplateTokens(event.messageTemplateTokens),
        messageTemplateTokens: event.messageTemplateTokens,
        properties: event.properties
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(formattedEvents, null, 2)
        }]
      };
    } catch (error) {
      const err = error as Error;
      return {
        content: [{
          type: "text",
          text: `Error fetching events: ${err.message}`
        }],
        isError: true
      };
    }
  }
);

// Start the server with stdio transport
// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  server.connect(transport).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server;