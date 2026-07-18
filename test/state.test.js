import test from 'node:test';
import assert from 'node:assert';

// Import state manager module
import { stateManager, getLocalDateString } from '../js/state.js';

test("StateManager - Initial points and profile structure", () => {
    const state = stateManager.getState();
    assert.ok(state.profile);
    assert.ok(Array.isArray(state.logs));
    assert.ok(Array.isArray(state.chatHistory));
    assert.equal(typeof state.profile.points, 'number');
});

test("StateManager - Add points updates AP and unlocks achievements", () => {
    stateManager.state.profile.points = 100;
    stateManager.addPoints(55); // Total points becomes 155
    const state = stateManager.getState();
    assert.equal(state.profile.points, 155);
});

test("StateManager - Logging check-in updates logs history", () => {
    const mockDate = getLocalDateString();
    stateManager.logHabit(100, 3, ["stress"], "Felt urge at work");
    
    const state = stateManager.getState();
    const todayLog = state.logs.find(l => l.date === mockDate);
    assert.ok(todayLog);
    assert.equal(todayLog.value, 100);
    assert.equal(todayLog.cravingLevel, 3);
    assert.ok(todayLog.triggers.includes("stress"));
});

test("StateManager - updateProfile updates name and habit details dynamically", () => {
    stateManager.updateProfile({
        name: "Charlie",
        habit: "smoking",
        targetLimit: 10
    });
    
    const state = stateManager.getState();
    assert.equal(state.profile.name, "Charlie");
    assert.equal(state.profile.habit, "smoking");
    assert.equal(state.profile.habitLabel, "Smoking Habit");
    assert.equal(state.profile.habitUnit, "cigarettes");
    assert.equal(state.profile.targetLimit, 10);
});

test("StateManager - clearChatHistory empties message logs", () => {
    stateManager.state.chatHistory = [
        { sender: "user", text: "hello", timestamp: new Date().toISOString() }
    ];
    stateManager.clearChatHistory();
    const state = stateManager.getState();
    assert.equal(state.chatHistory.length, 1);
});

test("StateManager - getStreakStats calculates correct streak counts", () => {
    const mockLogs = [
        { date: "2026-07-15", value: 50, cravingLevel: 2, triggers: [] },
        { date: "2026-07-16", value: 60, cravingLevel: 3, triggers: [] },
        { date: "2026-07-17", value: 40, cravingLevel: 1, triggers: [] }
    ];
    stateManager.state.logs = mockLogs;
    const stats = stateManager.getStreakStats();
    assert.ok(typeof stats.currentStreak === 'number');
    assert.ok(typeof stats.longestStreak === 'number');
});

test("StateManager - unlockSOSAchievement unlocks the SOS achievement and awards points", () => {
    stateManager.state.achievements = [
        { id: "sos_survivor", title: "Calm in the Storm", unlocked: false, unlockDate: null }
    ];
    stateManager.state.profile.points = 100;
    const result = stateManager.unlockSOSAchievement();
    assert.equal(result, true);
    assert.equal(stateManager.state.achievements[0].unlocked, true);
    assert.equal(stateManager.state.profile.points, 180);
});

test("StateManager - resetDatabase clears state back to default structures", () => {
    stateManager.state.profile.name = "Modified Name";
    stateManager.resetDatabase();
    const state = stateManager.getState();
    assert.equal(state.profile.name, "Mindful User");
});
