import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Configuration and constants
const SEQ_BASE_URL = process.env.SEQ_BASE_URL || 'http://localhost:8080';
const SEQ_API_KEY = process.env.SEQ_API_KEY || '';
const MAX_EVENTS = 100;
// Create the MCP server
const server = new McpServer({
    name: "seq-server",
    version: "1.0.0"
});
// Helper function for SEQ API requests
async function makeSeqRequest(endpoint, params = {}) {
    const url = new URL(`${SEQ_BASE_URL}${endpoint}`);
    // Add API key as query parameter
    url.searchParams.append('apiKey', SEQ_API_KEY);
    // Add additional query parameters
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });
    const headers = {
        'Accept': 'application/json',
        'X-Seq-ApiKey': SEQ_API_KEY
    };
    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
        throw new Error(`SEQ API error: ${response.statusText} (${response.status})`);
    }
    return response.json();
}
// Resource for listing signals
server.resource("signals", "seq://signals", async () => {
    try {
        const signals = await makeSeqRequest('/api/signals', { shared: 'true' });
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
    }
    catch (error) {
        console.error('Error fetching signals:', error);
        throw error;
    }
});
// Tool for fetching signals with filters
server.tool("get-signals", {
    ownerId: z.string().optional(),
    shared: z.boolean().optional(),
    partial: z.boolean().optional()
}, async ({ ownerId, shared, partial }) => {
    try {
        const params = {
            // Default to shared=true if no other params provided
            shared: shared?.toString() ?? "true"
        };
        if (ownerId)
            params.ownerId = ownerId;
        if (partial !== undefined)
            params.partial = partial.toString();
        const signals = await makeSeqRequest('/api/signals', params);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(signals, null, 2)
                }]
        };
    }
    catch (error) {
        const err = error;
        return {
            content: [{
                    type: "text",
                    text: `Error fetching signals: ${err.message}`
                }],
            isError: true
        };
    }
});
// Schema for time range validation
const timeRangeSchema = z.enum(['1m', '15m', '30m', '1h', '2h', '6h', '12h', '1d', '7d', '14d', '30d']);
// Tool for fetching events with enhanced parameters
server.tool("get-events", {
    signal: z.string().optional()
        .describe('Comma-separated list of signal IDs'),
    filter: z.string().optional()
        .describe('Filter expression for events'),
    count: z.number().min(1).max(MAX_EVENTS).optional()
        .default(MAX_EVENTS)
        .describe(`Number of events to return (max ${MAX_EVENTS})`),
    fromDateUtc: z.string().optional()
        .describe('Start date/time in UTC'),
    toDateUtc: z.string().optional()
        .describe('End date/time in UTC'),
    range: timeRangeSchema.optional()
        .describe('Time range (e.g., 1m, 15m, 1h, 1d, 7d)')
}, async ({ signal, filter, count, fromDateUtc, toDateUtc, range }) => {
    try {
        const params = {};
        // Handle date range parameters
        if (range) {
            // If range is provided, it takes precedence over fromDateUtc/toDateUtc
            params.range = range;
        }
        else if (fromDateUtc || toDateUtc) {
            // Only add date parameters if they're provided
            if (fromDateUtc)
                params.fromDateUtc = fromDateUtc;
            if (toDateUtc)
                params.toDateUtc = toDateUtc;
        }
        else {
            // Default to last hour if no time parameters provided
            params.range = '1h';
        }
        // Add other optional parameters
        if (signal)
            params.signal = signal;
        if (filter)
            params.filter = filter;
        if (count)
            params.count = count.toString();
        const events = await makeSeqRequest('/api/events', params);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(events, null, 2)
                }]
        };
    }
    catch (error) {
        const err = error;
        return {
            content: [{
                    type: "text",
                    text: `Error fetching events: ${err.message}`
                }],
            isError: true
        };
    }
});
// Start the server with stdio transport
if (import.meta.url === `file://${process.argv[1]}`) {
    const transport = new StdioServerTransport();
    server.connect(transport).catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
export default server;
