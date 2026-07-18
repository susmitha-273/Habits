import test from 'node:test';
import assert from 'node:assert';

// Import AI engine modules
import { aiEngine } from '../js/ai-engine.js';

// Force connection fallback by mocking _callGeminiAPI in the test runner
aiEngine._callGeminiAPI = async () => {
    throw new Error("Mocked CORS/Connection Failure");
};

test("AIEngine - fallback greeting outputs name and record overview", async () => {
    const mockState = {
        profile: { name: "Alex", habit: "screen_time", habitLabel: "Screen Time", habitUnit: "mins", targetLimit: 120, points: 50 },
        logs: [],
        chatHistory: []
    };
    
    const res = await aiEngine.generateResponse("hello", mockState);
    assert.ok(res.includes("Aura"));
    assert.ok(res.includes("Alex"));
});

test("AIEngine - fallback challenge outputs daily CBT challenge template", async () => {
    const mockState = {
        profile: { name: "Alex", habit: "screen_time", habitLabel: "Screen Time", habitUnit: "mins", targetLimit: 120, points: 50 },
        logs: [],
        chatHistory: []
    };
    
    const res = await aiEngine.generateResponse("Give me a challenge", mockState);
    assert.ok(res.includes("Daily Challenge"));
});

test("AIEngine - fallback recovery plan outputs structured 3-phase roadmap", async () => {
    const mockState = {
        profile: { name: "Alex", habit: "screen_time", habitLabel: "Screen Time", habitUnit: "mins", targetLimit: 120, points: 50 },
        logs: [],
        chatHistory: []
    };
    
    const res = await aiEngine.generateResponse("generate a recovery plan", mockState);
    assert.ok(res.includes("Recovery Plan"));
});
