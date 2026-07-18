/**
 * Aura State Management Module
 * Manages LocalStorage persistence, streak tracking, stats calculations, and achievements.
 */

// Mock localStorage for Node.js test environments
if (typeof localStorage === 'undefined') {
    globalThis.localStorage = {
        store: {},
        getItem(key) { return this.store[key] || null; },
        setItem(key, val) { this.store[key] = String(val); },
        removeItem(key) { delete this.store[key]; },
        clear() { this.store = {}; }
    };
}

const STORAGE_KEY = 'aura_habit_coach_state';

// Pre-seeded logs for demonstration to make charts look beautiful right away
const SEED_LOGS = [
    { date: "2026-07-13", value: 190, cravingLevel: 8, triggers: ["boredom", "fatigue"], notes: "Spent too much time scrolling reels before sleeping." },
    { date: "2026-07-14", value: 110, cravingLevel: 4, triggers: ["stress"], notes: "Did a short walk. Helped reduce screen time." },
    { date: "2026-07-15", value: 95, cravingLevel: 3, triggers: ["boredom"], notes: "Had a busy work day, naturally stayed away from social media." },
    { date: "2026-07-16", value: 150, cravingLevel: 7, triggers: ["stress", "loneliness"], notes: "Felt stressed about work and relapsed into gaming." },
    { date: "2026-07-17", value: 105, cravingLevel: 4, triggers: ["boredom"], notes: "Substituted screen time with cooking dinner. Felt rewarding." }
];

const DEFAULT_STATE = {
    profile: {
        name: "Mindful User",
        habit: "screen_time",
        habitLabel: "Excessive Screen Time",
        habitUnit: "mins",
        targetLimit: 120, // 2 hours
        startDate: "2026-07-13",
        points: 150 // Aura Points
    },
    logs: SEED_LOGS,
    chatHistory: [
        {
            sender: "aura",
            text: "Hello! I am Aura, your personal AI Habit Transformation Guide. I am here to help you reshape your relationship with digital screen time. How are you feeling today?",
            timestamp: new Date("2026-07-18T09:00:00").toISOString()
        }
    ],
    achievements: [
        { id: "first_log", title: "First Step", desc: "Logged your first habit entry.", unlocked: true, unlockDate: "2026-07-13", icon: "check-circle" },
        { id: "streak_3", title: "Consistency Spark", desc: "Maintained your limit for 3 consecutive days.", unlocked: false, unlockDate: null, icon: "zap" },
        { id: "streak_7", title: "Habit Hacker", desc: "Maintained your limit for 7 consecutive days.", unlocked: false, unlockDate: null, icon: "award" },
        { id: "sos_survivor", title: "Calm in the Storm", desc: "Completed an SOS breathing session during a craving.", unlocked: false, unlockDate: null, icon: "shield-alert" }
    ]
};

// Get current date string in YYYY-MM-DD local format
export function getLocalDateString(date = new Date()) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

class StateManager {
    constructor() {
        this.listeners = [];
        this.state = this.loadState();
    }

    loadState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            this.saveState(DEFAULT_STATE);
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
        try {
            const parsed = JSON.parse(raw);
            // Quick check to verify schema integrity
            if (!parsed.profile || !parsed.logs) {
                this.saveState(DEFAULT_STATE);
                return JSON.parse(JSON.stringify(DEFAULT_STATE));
            }
            // Schema migration: merge profile with DEFAULT_STATE.profile to restore any missing fields
            parsed.profile = { ...DEFAULT_STATE.profile, ...parsed.profile };
            parsed.achievements = parsed.achievements || DEFAULT_STATE.achievements;
            parsed.chatHistory = parsed.chatHistory || DEFAULT_STATE.chatHistory;
            return parsed;
        } catch (e) {
            console.error("Error loading Aura state, resetting...", e);
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    }

    saveState(state = this.state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    getState() {
        return this.state;
    }

    updateProfile(updatedFields) {
        this.state.profile = { ...this.state.profile, ...updatedFields };
        
        // Dynamic label support
        if (updatedFields.habit) {
            const habitsMap = {
                screen_time: { label: "Excessive Screen Time", unit: "mins" },
                social_media: { label: "Social Media Scroll", unit: "mins" },
                junk_food: { label: "Junk Food Consumption", unit: "calories" },
                smoking: { label: "Smoking Habit", unit: "cigarettes" }
            };
            const mapping = habitsMap[updatedFields.habit] || { label: "Harmful Habit", unit: "times" };
            this.state.profile.habitLabel = mapping.label;
            this.state.profile.habitUnit = mapping.unit;
        }
        
        this.saveState();
        this.notifyListeners();
    }

    logHabit(value, cravingLevel, triggers, notes) {
        const todayStr = getLocalDateString();
        
        // Remove existing entry for today if user is updating it
        this.state.logs = this.state.logs.filter(log => log.date !== todayStr);
        
        const newLog = {
            date: todayStr,
            value: Number(value),
            cravingLevel: Number(cravingLevel),
            triggers: triggers || [],
            notes: notes || ""
        };
        
        this.state.logs.push(newLog);
        
        // Sort logs by date ascending
        this.state.logs.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Reward points for logging
        this.state.profile.points += 20;

        // Check for achievements
        this.checkAchievements();
        
        this.saveState();
        this.notifyListeners();
        return newLog;
    }

    addPoints(pts) {
        this.state.profile.points += pts;
        this.saveState();
        this.notifyListeners();
    }

    addChatMessage(sender, text) {
        this.state.chatHistory.push({
            sender,
            text,
            timestamp: new Date().toISOString()
        });
        // Limit history size to 50
        if (this.state.chatHistory.length > 50) {
            this.state.chatHistory.shift();
        }
        this.saveState();
        this.notifyListeners();
    }

    clearChatHistory() {
        this.state.chatHistory = [
            {
                sender: "aura",
                text: `Hello! I am Aura, your personal AI Habit Transformation Guide. I am here to help you reshape your relationship with ${this.state.profile.habitLabel.toLowerCase()}. How are you feeling today?`,
                timestamp: new Date().toISOString()
            }
        ];
        this.saveState();
        this.notifyListeners();
    }

    getStreakStats() {
        const target = this.state.profile.targetLimit;
        const logsMap = {};
        this.state.logs.forEach(log => {
            logsMap[log.date] = log.value <= target;
        });

        const sortedDates = Object.keys(logsMap).sort();
        if (sortedDates.length === 0) {
            return { currentStreak: 0, longestStreak: 0 };
        }

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Let's compute streaks. For current streak, we count back from today/yesterday.
        const todayStr = getLocalDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);

        const start = new Date(sortedDates[0]);
        const end = new Date(todayStr);
        let checkDate = new Date(start);
        
        while (checkDate <= end) {
            const dateStr = getLocalDateString(checkDate);
            if (logsMap[dateStr] === true) {
                tempStreak++;
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                }
            } else if (logsMap[dateStr] === false) {
                // Logged but failed
                tempStreak = 0;
            } else {
                // Not logged. If checkDate is today, we don't break the tempStreak yet (as user may log later).
                if (dateStr !== todayStr) {
                    tempStreak = 0;
                }
            }
            // Increment checkDate by 1 day
            checkDate.setDate(checkDate.getDate() + 1);
        }

        // Current streak: Count back from today (if met) or yesterday (if today not logged yet but yesterday met)
        let streakCheckDate = new Date();
        const todayMet = logsMap[todayStr];
        const yesterdayMet = logsMap[yesterdayStr];

        if (todayMet === true) {
            // Count backwards from today
            let d = new Date(streakCheckDate);
            while (true) {
                const dStr = getLocalDateString(d);
                if (logsMap[dStr] === true) {
                    currentStreak++;
                } else {
                    break;
                }
                d.setDate(d.getDate() - 1);
            }
        } else if (todayMet === undefined && yesterdayMet === true) {
            // Today not logged yet, but yesterday was a success. Count back starting from yesterday
            let d = new Date(yesterday);
            while (true) {
                const dStr = getLocalDateString(d);
                if (logsMap[dStr] === true) {
                    currentStreak++;
                } else {
                    break;
                }
                d.setDate(d.getDate() - 1);
            }
        } else {
            currentStreak = 0;
        }

        return { currentStreak, longestStreak };
    }

    checkAchievements() {
        const stats = this.getStreakStats();
        let changed = false;

        this.state.achievements.forEach(ach => {
            if (!ach.unlocked) {
                if (ach.id === 'first_log' && this.state.logs.length >= 1) {
                    ach.unlocked = true;
                    ach.unlockDate = getLocalDateString();
                    this.state.profile.points += 50;
                    changed = true;
                }
                if (ach.id === 'streak_3' && stats.longestStreak >= 3) {
                    ach.unlocked = true;
                    ach.unlockDate = getLocalDateString();
                    this.state.profile.points += 100;
                    changed = true;
                }
                if (ach.id === 'streak_7' && stats.longestStreak >= 7) {
                    ach.unlocked = true;
                    ach.unlockDate = getLocalDateString();
                    this.state.profile.points += 200;
                    changed = true;
                }
            }
        });

        return changed;
    }

    unlockSOSAchievement() {
        const sosAch = this.state.achievements.find(ach => ach.id === 'sos_survivor');
        if (sosAch && !sosAch.unlocked) {
            sosAch.unlocked = true;
            sosAch.unlockDate = getLocalDateString();
            this.state.profile.points += 80;
            this.saveState();
            this.notifyListeners();
            return true;
        }
        return false;
    }

    resetDatabase() {
        localStorage.removeItem(STORAGE_KEY);
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.saveState();
        this.notifyListeners();
    }

    // Observer pattern
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.state));
    }
}

export const stateManager = new StateManager();
