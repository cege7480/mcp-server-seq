import 'dotenv/config';
const SEQ_BASE_URL = process.env.SEQ_BASE_URL || 'http://localhost:8080';
const SEQ_API_KEY = process.env.SEQ_API_KEY || '';
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
// Helper function to format message template tokens (same as in server)
function formatMessageTemplateTokens(tokens) {
    if (!tokens)
        return '';
    return tokens.map(token => {
        if ('Text' in token)
            return String(token.Text);
        if ('PropertyName' in token)
            return `{${String(token.PropertyName)}}`;
        return '';
    }).join('');
}
async function runTests() {
    console.log('Starting SEQ API tests...\n');
    try {
        // Test 1: Get Signals
        console.log('Test 1: Fetching signals...');
        const signals = await makeSeqRequest('/api/signals');
        console.log(`✓ Successfully retrieved ${signals.length} signals`);
        if (signals.length > 0) {
            console.log('Sample signal:', JSON.stringify(signals[0], null, 2));
        }
        console.log();
        // Test 2: Get Events (last hour)
        console.log('Test 2: Fetching recent events...');
        const toDate = new Date().toISOString();
        const fromDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
        const events = await makeSeqRequest('/api/events', {
            count: '5',
            fromDateUtc: fromDate,
            toDateUtc: toDate
        });
        console.log(`✓ Successfully retrieved ${events.length} events`);
        if (events.length > 0) {
            const sampleEvent = events[0];
            console.log('Sample event:', {
                ...sampleEvent,
                messageTemplate: formatMessageTemplateTokens(sampleEvent.messageTemplateTokens),
            });
        }
        console.log();
        // Test 3: Get Events with Signal filter
        if (signals.length > 0) {
            const signalId = signals[0].id;
            console.log(`Test 3: Fetching events for signal ${signalId}...`);
            const signalEvents = await makeSeqRequest('/api/events', {
                signalId,
                count: '5',
                fromDateUtc: fromDate,
                toDateUtc: toDate
            });
            console.log(`✓ Successfully retrieved ${signalEvents.length} events for signal`);
            if (signalEvents.length > 0) {
                const sampleEvent = signalEvents[0];
                console.log('Sample event with signal filter:', {
                    ...sampleEvent,
                    messageTemplate: formatMessageTemplateTokens(sampleEvent.messageTemplateTokens),
                });
            }
            console.log();
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Test failed:', error.message);
        }
        else {
            console.error('Test failed with unknown error');
        }
    }
}
// Use ESM-style main module check
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}
export { runTests };
