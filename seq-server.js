"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var zod_1 = require("zod");
// Configuration and constants
var SEQ_BASE_URL = process.env.SEQ_BASE_URL || 'http://localhost:8080';
var SEQ_API_KEY = process.env.SEQ_API_KEY;
if (!SEQ_API_KEY) {
    throw new Error('SEQ_API_KEY environment variable is required');
}
// Create the MCP server
var server = new mcp_js_1.McpServer({
    name: "seq-server",
    version: "1.0.0"
});
// Helper function for SEQ API requests
function makeSeqRequest(endpoint_1) {
    return __awaiter(this, arguments, void 0, function (endpoint, params) {
        var url, response;
        if (params === void 0) { params = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = new URL("".concat(SEQ_BASE_URL).concat(endpoint));
                    // Add API key as query parameter if not in headers
                    url.searchParams.append('apiKey', SEQ_API_KEY);
                    // Add additional query parameters
                    Object.entries(params).forEach(function (_a) {
                        var key = _a[0], value = _a[1];
                        if (value !== undefined && value !== null) {
                            url.searchParams.append(key, value);
                        }
                    });
                    return [4 /*yield*/, fetch(url.toString(), {
                            headers: {
                                'Accept': 'application/json',
                                'X-Seq-ApiKey': SEQ_API_KEY
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("SEQ API error: ".concat(response.statusText));
                    }
                    return [2 /*return*/, response.json()];
            }
        });
    });
}
// Resource for listing signals
server.resource("signals", "seq://signals", function () { return __awaiter(void 0, void 0, void 0, function () {
    var signals, formattedSignals, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, makeSeqRequest('/api/signals')];
            case 1:
                signals = _a.sent();
                formattedSignals = signals.map(function (signal) { return ({
                    id: signal.id,
                    title: signal.title,
                    description: signal.description || 'No description provided',
                    shared: signal.shared,
                    ownerId: signal.ownerId
                }); });
                return [2 /*return*/, {
                        contents: [{
                                uri: 'seq://signals',
                                text: JSON.stringify(formattedSignals, null, 2)
                            }]
                    }];
            case 2:
                error_1 = _a.sent();
                console.error('Error fetching signals:', error_1);
                throw error_1;
            case 3: return [2 /*return*/];
        }
    });
}); });
// Tool for fetching signals with filters
server.tool("get-signals", {
    ownerId: zod_1.z.string().optional(),
    shared: zod_1.z.boolean().optional(),
    partial: zod_1.z.boolean().optional()
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var params, signals, error_2, err;
    var ownerId = _b.ownerId, shared = _b.shared, partial = _b.partial;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                params = {};
                if (ownerId)
                    params.ownerId = ownerId;
                if (shared !== undefined)
                    params.shared = shared.toString();
                if (partial !== undefined)
                    params.partial = partial.toString();
                return [4 /*yield*/, makeSeqRequest('/api/signals', params)];
            case 1:
                signals = _c.sent();
                return [2 /*return*/, {
                        content: [{
                                type: "text",
                                text: JSON.stringify(signals, null, 2)
                            }]
                    }];
            case 2:
                error_2 = _c.sent();
                err = error_2;
                return [2 /*return*/, {
                        content: [{
                                type: "text",
                                text: "Error fetching signals: ".concat(err.message)
                            }],
                        isError: true
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Helper function to format message template tokens for better readability
function formatMessageTemplateTokens(tokens) {
    if (!tokens)
        return '';
    return tokens.map(function (token) {
        if ('Text' in token)
            return String(token.Text);
        if ('PropertyName' in token)
            return "{".concat(String(token.PropertyName), "}");
        return '';
    }).join('');
}
// Tool for fetching events
server.tool("get-events", {
    signalId: zod_1.z.string().optional(),
    count: zod_1.z.number().min(1).max(1000).optional(),
    fromDateUtc: zod_1.z.string(),
    toDateUtc: zod_1.z.string()
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var params, events, formattedEvents, error_3, err;
    var signalId = _b.signalId, count = _b.count, fromDateUtc = _b.fromDateUtc, toDateUtc = _b.toDateUtc;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                params = {
                    fromDateUtc: fromDateUtc,
                    toDateUtc: toDateUtc
                };
                if (signalId)
                    params.signalId = signalId;
                if (count)
                    params.count = count.toString();
                return [4 /*yield*/, makeSeqRequest('/api/events', params)];
            case 1:
                events = _c.sent();
                formattedEvents = events.map(function (event) { return ({
                    timestamp: event.timestamp,
                    level: event.level,
                    message: event.message,
                    messageTemplate: formatMessageTemplateTokens(event.messageTemplateTokens),
                    messageTemplateTokens: event.messageTemplateTokens,
                    properties: event.properties
                }); });
                return [2 /*return*/, {
                        content: [{
                                type: "text",
                                text: JSON.stringify(formattedEvents, null, 2)
                            }]
                    }];
            case 2:
                error_3 = _c.sent();
                err = error_3;
                return [2 /*return*/, {
                        content: [{
                                type: "text",
                                text: "Error fetching events: ".concat(err.message)
                            }],
                        isError: true
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Start the server with stdio transport
if (require.main === module) {
    var transport = new stdio_js_1.StdioServerTransport();
    server.connect(transport).catch(function (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
exports.default = server;
