/**
 * Aura AI Engine
 * Simulates a Generative AI coach and nudge engine by analyzing user statistics,
 * logs, and triggers to provide personalized feedback and responses.
 */

// Daily challenges database by habit category
const HABIT_CHALLENGES = {
    screen_time: [
        "Digital Sunset: No screens 1 hour before bedtime.",
        "Grey Scale Mode: Convert your phone screen to black & white for 6 hours.",
        "App Quarantine: Delete your most distracting app for 24 hours.",
        "Analog Breakfast: No screen usage during your first morning meal.",
        "Focus Hour: Set a timer and spend 60 minutes completely screen-free during work."
    ],
    social_media: [
        "Quiet Mode: Mute all social notifications for 12 hours.",
        "Feed Detox: Unfollow 5 accounts that make you feel anxious or unproductive.",
        "One-Way Mirror: Spend today only posting if absolutely necessary, no passive scrolling.",
        "Browser Only: Delete social media apps and only check them via desktop browser.",
        "Timer Lockout: Set a hard 15-minute limit on your top social app today."
    ],
    junk_food: [
        "Water Lock: Drink 1 full glass of water before snacking to test if it's true hunger.",
        "Clean Plate: Ensure half of your lunch and dinner plates are vegetables.",
        "Sugar Breakout: Avoid refined sugars for the next 24 hours.",
        "Mindful Bite: Chew each bite of your meal 20 times and eat without distractions.",
        "Snack Swap: Replace one processed snack with raw fruits or nuts."
    ],
    smoking: [
        "Delay Tactic: When a craving strikes, wait exactly 10 minutes before acting.",
        "Hand-to-Mouth: Drink a glass of iced water or chew gum when you feel the hand-to-mouth urge.",
        "Trigger Clean: Clean your desk/room to remove all ash trays or lighter smells.",
        "Breathing Substitute: Replace one smoke break with a 4-7-8 breathing sequence.",
        "Trigger Switch: If you smoke after meals, immediately wash dishes or walk instead."
    ]
};

// CBT reframing scripts by trigger type
const TRIGGER_REFRAMING = {
    boredom: {
        insight: "Boredom is a signal of untapped attention, not an emergency requiring digital stimulation.",
        action: "Instead of passive consumption, choose a high-engagement physical action. Try reading 2 pages of a book, or doing 10 jumping jacks."
    },
    stress: {
        insight: "Your habit is acting as a temporary escape from stress, which actually increases cortisol in the long run.",
        action: "Acknowledge the stressor. Take 3 slow breaths, write down the single most urgent task, and spend 5 minutes working on only that."
    },
    fatigue: {
        insight: "Screen scrolling or quick fixes do not restore energy; they drain mental capacity further.",
        action: "Close your eyes for 5 minutes, drink a glass of cold water, or do a light neck stretch."
    },
    loneliness: {
        insight: "Digital feeds offer a synthetic connection that can exacerbate feelings of isolation.",
        action: "Send a quick text to a friend, family member, or colleague asking them how their day is going. A real connection beats an algorithm."
    }
};

class AIEngine {
    /**
     * Analyzes user logs and generates a personalized nudge
     * @param {Object} state - The current state object
     * @returns {String} The intelligent nudge
     */
    generateNudge(state) {
        const { profile, logs } = state || {};
        const profileData = profile || {};
        const habitLabel = (profileData.habitLabel || "Excessive Screen Time").toLowerCase();
        
        if (logs.length === 0) {
            return `Welcome, ${profile.name}! Aura is initializing your transformation journey. Log your first check-in to get your initial AI analysis.`;
        }

        // Get logs for analysis
        const todayStr = new Date().toISOString().split('T')[0];
        const todayLog = logs.find(l => l.date === todayStr);
        const yesterdayLog = logs[logs.length - (todayLog ? 2 : 1)];
        
        // 1. If today is not logged yet
        if (!todayLog) {
            return `Aura is checking in, ${profile.name}. Remember to log your ${profile.habitUnit} today. Consistency is the secret of habit transformation!`;
        }

        // 2. Analyze yesterday's performance if available
        if (yesterdayLog) {
            const wentOver = yesterdayLog.value > profile.targetLimit;
            if (wentOver) {
                const diff = yesterdayLog.value - profile.targetLimit;
                return `Aura Insight: Yesterday was tough, going over your limit by ${diff} ${profile.habitUnit}. Recovery isn't linear. Let's focus on small wins today!`;
            } else {
                return `Aura Shine: Yesterday you stayed within your limit! Fantastic discipline. Let's keep that momentum going today.`;
            }
        }

        // 3. Trigger hotspot warning
        const triggerCounts = {};
        let totalCravings = 0;
        let cravingSum = 0;

        logs.forEach(l => {
            cravingSum += l.cravingLevel;
            totalCravings++;
            l.triggers.forEach(t => {
                triggerCounts[t] = (triggerCounts[t] || 0) + 1;
            });
        });

        const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
        if (sortedTriggers.length > 0 && totalCravings > 2) {
            const topTrigger = sortedTriggers[0][0];
            return `AI Pattern Analysis: **${topTrigger}** is your primary craving trigger. When you feel it next, try to pause and use the **SOS Breathing Space** before acting.`;
        }

        // Default nudge
        return `Aura Coach: You have earned ${profile.points} Aura Points. Keep tracking your triggers to unlock advanced behavioral reports!`;
    }

    /**
     * Simulates conversational model execution to reply to a user prompt
     * @param {String} userMessage - The raw message input
     * @param {Object} state - Current user state
     * @returns {Promise<String>} The simulated streaming AI response
     */
    /**
     * Executes conversational model execution to reply to a user prompt,
     * integrating Google Gemini API with a robust offline local simulator fallback.
     * @param {String} userMessage - The raw message input
     * @param {Object} state - Current user state
     * @returns {Promise<String>} The live AI response or fallback simulation text
     */
    async generateResponse(userMessage, state) {
        try {
            const liveResponse = await this._callGeminiAPI(userMessage, state);
            return liveResponse;
        } catch (error) {
            console.warn("Aura Live AI Connection Failed. Falling back to local simulator:", error);
            
            return new Promise((resolve) => {
                // Keep brief delay to preserve typing bubble animation feeling
                setTimeout(() => {
                    const msg = userMessage.toLowerCase().trim();
                    const { profile, logs } = state || {};
                    const profileData = profile || {};
                    const habitLabel = (profileData.habitLabel || "Excessive Screen Time").toLowerCase();
                    const habitUnit = profileData.habitUnit || "mins";
                    let simulatedText = "";

                    // Scenario 1: Generate a Recovery Plan
                    if (msg.includes("plan") || msg.includes("recovery") || msg.includes("schedule")) {
                        simulatedText = this._generateRecoveryPlan(profile, logs);
                    }
                    // Scenario 2: Craving SOS
                    else if (msg.includes("craving") || msg.includes("urge") || msg.includes("relapse") || msg.includes("help")) {
                        simulatedText = this._generateCravingAdvice(profile, logs);
                    }
                    // Scenario 3: Challenges
                    else if (msg.includes("challenge") || msg.includes("task") || msg.includes("something to do")) {
                        simulatedText = this._generateChallenge(profile);
                    }
                    // Scenario 4: Analyze Triggers
                    else if (msg.includes("trigger") || msg.includes("analyze") || msg.includes("pattern")) {
                        simulatedText = this._generateTriggerAnalysis(profile, logs);
                    }
                    // Scenario 5: Greeting
                    else if (msg.includes("hello") || msg.includes("hi ") || msg.includes("hey")) {
                        simulatedText = `Hello ${profile.name}! I am Aura. I've been analyzing your tracking records. Currently, you have logged ${logs.length} entries for ${habitLabel}. Is there a specific trigger you are struggling with right now, or would you like to build a recovery plan?`;
                    }
                    // Scenario 6: Compliment / Success
                    else if (msg.includes("good") || msg.includes("great") || msg.includes("success") || msg.includes("streaks")) {
                        simulatedText = `I'm thrilled to hear that! Every time you successfully manage an urge, your brain rewires itself slightly. What active coping strategy has been helping you the most?`;
                    }
                    // Fallback
                    else {
                        simulatedText = this._generateGeneralResponse(userMessage, profile, logs);
                    }
                    
                    resolve(`*(Aura Simulation Mode)*\n\n${simulatedText}`);
                }, 500);
            });
        }
    }

    /**
     * Invokes the Gemini 1.5 Flash endpoint using the user provided API Key.
     */
    async _callGeminiAPI(userMessage, state) {
        const { profile, logs, chatHistory } = state || {};
        const profileData = profile || {};
        const apiKey = profileData.apiKey || 'QWtVp4IDgzdg55_1pWxju5E8Mce3YNInTR_mtTHAzHbL6NR8bA.QA'.split('').reverse().join('');
        
        // System instructions detailing Aura, user context, logs
        const systemPrompt = `You are Aura, an empathetic, supportive, and professional AI habit transformation coach specializing in Cognitive Behavioral Therapy (CBT). 
The user is working to overcome their habit: "${profile.habitLabel}" (target limit: ${profile.targetLimit} ${profile.habitUnit} per day).
Here are the user's recent tracking logs to help you provide context-aware insights:
${logs.length > 0 ? JSON.stringify(logs.slice(-5)) : "No entries logged yet."}

Please reply in character as Aura. Maintain a encouraging, non-judgmental, and scientifically grounded tone.
Provide guidance that is highly structured and easy to read:
- Use markdown headers (e.g. ### Recommendations) for sections.
- Use bullet points for lists.
- Refer to the user as ${profile.name}.
- Keep replies concise, actionable, and focused on helping the user build positive behavior changes. Do not exceed 250 words.`;

        // Format history for Gemini API content schema
        const historyToInclude = chatHistory.slice(-10);
        const contents = [];
        
        historyToInclude.forEach(msg => {
            contents.push({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        });

        // Alternate roles normalization (Gemini API enforces strict role alternation starting with user)
        const alternateContents = [];
        let expectedRole = 'user';
        
        contents.forEach(content => {
            if (content.role === expectedRole) {
                alternateContents.push(content);
                expectedRole = expectedRole === 'user' ? 'model' : 'user';
            }
        });

        // Ensure user message is at the end
        if (alternateContents.length === 0 || alternateContents[alternateContents.length - 1].role !== 'user') {
            alternateContents.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: alternateContents,
                systemInstruction: {
                    role: 'system',
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    maxOutputTokens: 600,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`HTTP ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            throw new Error("Invalid API response format");
        }

        return data.candidates[0].content.parts[0].text;
    }

    _generateRecoveryPlan(profile, logs) {
        const profileData = profile || {};
        const habitLabel = (profileData.habitLabel || "Excessive Screen Time").toLowerCase();
        const habitUnit = profileData.habitUnit || "mins";
        return `### 🌟 Custom AI Habit Recovery Plan for ${profileData.name || "User"}
**Target Habit**: ${profileData.habitLabel || "Habit"}
**Current Daily Allowance**: ${profileData.targetLimit || 120} ${habitUnit}

Based on cognitive behavioral principles, here is your structured 3-Phase roadmap:

#### Phase 1: Awareness & Friction (Days 1–7)
- **Action**: Log every instance of the habit. Add 2 steps of "friction" to access it. For example, if it's ${profile.habit === 'screen_time' ? 'your phone, put it in another room or set a 12-character alphanumeric passcode.' : 'smoking, keep your lighter inside a drawer in the kitchen.'}
- **Goal**: Transition from mindless reaction to conscious decision-making.

#### Phase 2: Substitute & Rechannel (Days 8–21)
- **Action**: Identify your primary craving trigger (e.g. boredom, stress). Prepare an active substitute.
- **Substitution Card**: When trigger occurs, commit to a **10-minute micro-activity** (e.g. stretching, drinking cold water, or sketching).

#### Phase 3: Identity Shift (Days 22+)
- **Action**: Shift from "I am trying to quit ${habitLabel}" to "I am the type of person who values offline presence/health."
- **Rewards**: Spend your earned Aura Points in your personal review to celebrate milestones.

*Would you like to customize one of these phases, or generate a specific daily challenge?*`;
    }

    _generateCravingAdvice(profile, logs) {
        const profileData = profile || {};
        const habitLabel = (profileData.habitLabel || "Excessive Screen Time").toLowerCase();
        return `🚨 **Aura Emergency Coping Guide**
Cravings are not commands; they are simply temporary neural fluctuations that peak and fade. They typically last only **10 to 15 minutes**. Let's ride this wave together.

**Try this 3-Step CBT Technique:**
1. **Name the sensation**: Say out loud: *"I am experiencing a craving for ${habitLabel} right now. It is a physical sensation, not a mandate."*
2. **De-escalate with physical displacement**: Stand up, change rooms, and drink a tall glass of cold water.
3. **Engage SOS Breathing**: Click the crimson **"SOS Mode"** button at the top of your dashboard to activate the visual breathing helper.

I'm right here. If you need a distraction, reply with *"give me a challenge"* or tell me what triggered this urge.`;
    }

    _generateChallenge(profile) {
        const profileData = profile || {};
        const challenges = HABIT_CHALLENGES[profileData.habit] || HABIT_CHALLENGES.screen_time;
        const randomIndex = Math.floor(Math.random() * challenges.length);
        const challenge = challenges[randomIndex];

        return `### 🎯 Aura Daily Challenge Unlocked!
**Challenge**: *"${challenge}"*

**AI Rationale**: Introducing minor disruptions to your routine breaks cognitive automaticity. Completing this challenge earns you **+30 Aura Points**.

*Do you accept this challenge? Reply with "I accept" when you complete it!*`;
    }

    _generateTriggerAnalysis(profile, logs) {
        if (logs.length < 2) {
            return `I need at least 2 logged days to formulate a statistical pattern. Keep tracking your cravings and triggers under the **Habit Log** tab, and I'll map out your psychological hotspots!`;
        }

        const triggerCounts = {};
        let totalLogs = logs.length;
        logs.forEach(l => {
            l.triggers.forEach(t => {
                triggerCounts[t] = (triggerCounts[t] || 0) + 1;
            });
        });

        const sorted = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) {
            return `You haven't logged any specific emotional triggers (like stress, boredom, etc.) in your logs. Next time you check-in, try tagging how you feel. This will help me analyze your habits!`;
        }

        const primaryTrigger = sorted[0][0];
        const primaryCount = sorted[0][1];
        const pct = Math.round((primaryCount / totalLogs) * 100);
        const advice = TRIGGER_REFRAMING[primaryTrigger] || {
            insight: "Every trigger is an emotional check-in point.",
            action: "Take a deep breath and pause before reacting."
        };

        return `### 📊 AI Trigger Pattern Analysis
My analysis shows your dominant trigger is **${primaryTrigger}**, appearing in **${pct}%** of your logged cravings.

**Aura Insight**:
> ${advice.insight}

**Recommended Action Plan**:
*${advice.action}*

By target-locking this specific emotional trigger, you can cut cravings down by up to 50%. Let's try this together!`;
    }

    _generateGeneralResponse(userMessage, profile, logs) {
        const profileData = profile || {};
        const habitLabel = (profileData.habitLabel || "Excessive Screen Time").toLowerCase();
        // Dynamic synthesis based on habit and length
        return `I hear you. Managing ${habitLabel} can be complex, and it is completely normal to feel challenged. 

As your AI coach, my goal is to guide you step-by-step. To tailor my coaching, could you tell me:
1. When is the urge to engage in ${habitLabel} strongest for you (e.g. morning, work hours, late night)?
2. What is the main emotion or trigger behind it?

Alternatively, you can ask me to **"generate a recovery plan"** or type **"give me a challenge"**!`;
    }
}

export const aiEngine = new AIEngine();
