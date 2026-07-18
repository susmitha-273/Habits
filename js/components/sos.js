/**
 * Aura SOS Crisis De-escalation Component
 * Renders an overlay containing a visual breathing guide, cognitive distractions roulette,
 * and immediate CBT coach guidance.
 */

import { stateManager } from '../state.js';
import { aiEngine } from '../ai-engine.js';

let breathingInterval = null;
let breathingSeconds = 0;
let totalCyclesCompleted = 0;

export function openSOSModal(state) {
    // If modal already exists, don't duplicate
    if (document.getElementById('sos-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'sos-overlay';
    overlay.className = 'sos-modal-overlay fade-in-animation';

    overlay.innerHTML = `
        <div class="sos-modal-content glass-card slide-up-animation">
            
            <!-- Close Button -->
            <button class="sos-close-btn" id="close-sos-btn">&times;</button>

            <!-- Header -->
            <div class="sos-header">
                <span class="sos-alert-badge">🚨 EMERGENCY CRISIS SPACE</span>
                <h1>Craving SOS De-escalation</h1>
                <p>Cravings peak and fade within 10 minutes. Let's redirect your focus.</p>
            </div>

            <!-- Tab Navigation inside SOS -->
            <div class="sos-tab-nav">
                <button class="sos-tab-btn active" data-target="sos-breathing-tab">🧘 Box Breathing</button>
                <button class="sos-tab-btn" data-target="sos-roulette-tab">🎲 Distraction Roulette</button>
                <button class="sos-tab-btn" data-target="sos-coach-tab">💬 Crisis Coach</button>
            </div>

            <!-- Content Area -->
            <div class="sos-tab-content-container">
                
                <!-- Tab 1: Box Breathing -->
                <div class="sos-tab-pane active" id="sos-breathing-tab">
                    <div class="breathing-workspace">
                        <div class="breathing-circle-container">
                            <div class="breathing-circle" id="breath-node">
                                <span id="breath-prompt">Tap Start</span>
                            </div>
                            <div class="breathing-sub-circle"></div>
                        </div>
                        <div class="breathing-stats">
                            <p id="breath-timer">Duration: 0s</p>
                            <p id="breath-cycles" class="glowing-success-text">Cycles: 0/3 (Complete 3 to unlock achievement)</p>
                        </div>
                        <div class="breathing-actions">
                            <button class="btn btn-primary" id="start-breathing-btn">Begin Box Breathing</button>
                            <button class="btn btn-outline hide" id="pause-breathing-btn">Reset</button>
                        </div>
                    </div>
                </div>

                <!-- Tab 2: Distraction Roulette -->
                <div class="sos-tab-pane" id="sos-roulette-tab">
                    <div class="roulette-workspace text-center">
                        <div class="roulette-display-card glass-card">
                            <span class="dice-icon">🎲</span>
                            <h3 id="roulette-title">Need a distraction?</h3>
                            <p id="roulette-description">Press roll below to get an active, offline substitute challenge designed to shift your sensory focus.</p>
                        </div>
                        <button class="btn btn-primary btn-lg" id="roll-roulette-btn">Roll Distraction</button>
                    </div>
                </div>

                <!-- Tab 3: Crisis Coach -->
                <div class="sos-tab-pane" id="sos-coach-tab">
                    <div class="sos-mini-chat">
                        <div class="sos-chat-history scrollbar-custom" id="sos-chat-box">
                            <div class="message-row msg-aura">
                                <div class="message-avatar">A</div>
                                <div class="message-bubble-wrapper">
                                    <div class="message-bubble">
                                        I am right here with you. An urge is just a sensation; it doesn't represent what you truly want. Take a deep breath. Tell me, what triggered this craving?
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="sos-quick-prompts">
                            <button class="mini-prompt-btn" data-msg="Talk me through a severe urge">Talk me down</button>
                            <button class="mini-prompt-btn" data-msg="I feel stressed and want to relapse">Stress relapse</button>
                            <button class="mini-prompt-btn" data-msg="I am bored and scrolling automatically">Mindless scroll</button>
                        </div>

                        <form class="sos-chat-form" id="sos-chat-input-form">
                            <input type="text" id="sos-chat-input" placeholder="Type what you feel right now..." autocomplete="off" aria-label="Distress message input" required>
                            <button type="submit" class="btn btn-secondary" aria-label="Send distress message">Send</button>
                        </form>
                    </div>
                </div>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    // Setup interactive events
    const closeBtn = document.getElementById('close-sos-btn');
    const tabButtons = document.querySelectorAll('.sos-tab-btn');
    const tabPanes = document.querySelectorAll('.sos-tab-pane');

    // Close Modal
    const closeModal = () => {
        clearInterval(breathingInterval);
        breathingInterval = null;
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 400);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Tab switching logic
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
        });
    });

    // --- Tab 1: Box Breathing Logic ---
    const startBreathingBtn = document.getElementById('start-breathing-btn');
    const pauseBreathingBtn = document.getElementById('pause-breathing-btn');
    const breathNode = document.getElementById('breath-node');
    const breathPrompt = document.getElementById('breath-prompt');
    const breathTimer = document.getElementById('breath-timer');
    const breathCycles = document.getElementById('breath-cycles');


    const runBreathingCycle = () => {
        breathingSeconds++;
        breathTimer.textContent = `Duration: ${breathingSeconds}s`;

        // 4-second box breathing steps
        const step = (breathingSeconds - 1) % 16;
        
        if (step < 4) {
            // Inhale (0-3s)
            breathPrompt.textContent = "Inhale...";
            breathNode.className = "breathing-circle inhale";
        } else if (step < 8) {
            // Hold (4-7s)
            breathPrompt.textContent = "Hold Breath";
            breathNode.className = "breathing-circle hold";
        } else if (step < 12) {
            // Exhale (8-11s)
            breathPrompt.textContent = "Exhale...";
            breathNode.className = "breathing-circle exhale";
        } else {
            // Hold (12-15s)
            breathPrompt.textContent = "Hold Empty";
            breathNode.className = "breathing-circle hold-empty";
        }

        // Cycle completed
        if (step === 15) {
            totalCyclesCompleted++;
            breathCycles.textContent = `Cycles: ${totalCyclesCompleted}/3 (Complete 3 to unlock achievement)`;
            
            if (totalCyclesCompleted === 3) {
                const unlocked = stateManager.unlockSOSAchievement();
                if (unlocked) {
                    breathCycles.innerHTML = `🌟 **Goal Reached! +80 AP Earned!** <br>Achievement 'Calm in the Storm' Unlocked!`;
                }
            }
        }
    };

    startBreathingBtn.addEventListener('click', () => {
        if (breathingInterval) {
            // Pause/Reset
            clearInterval(breathingInterval);
            breathingInterval = null;
            breathingSeconds = 0;
            totalCyclesCompleted = 0;
            startBreathingBtn.textContent = "Begin Box Breathing";
            pauseBreathingBtn.classList.add('hide');
            breathPrompt.textContent = "Tap Start";
            breathNode.className = "breathing-circle";
            breathTimer.textContent = "Duration: 0s";
            breathCycles.textContent = "Cycles: 0/3 (Complete 3 to unlock achievement)";
        } else {
            // Start
            breathingSeconds = 0;
            totalCyclesCompleted = 0;
            startBreathingBtn.textContent = "Reset Exercise";
            pauseBreathingBtn.classList.remove('hide');
            runBreathingCycle(); // immediate run first tick
            breathingInterval = setInterval(runBreathingCycle, 1000);
        }
    });

    // --- Tab 2: Distraction Roulette Logic ---
    const rouletteTitle = document.getElementById('roulette-title');
    const rouletteDesc = document.getElementById('roulette-description');
    const rollBtn = document.getElementById('roll-roulette-btn');

    const offlineDistractions = [
        {
            title: "The Sensory Shock",
            desc: "Go to the bathroom and splash freezing cold water on your face 3 times. Alternatively, grab an ice cube and hold it in your palm until it melts. This shifts your nervous system's immediate sensory focus."
        },
        {
            title: "The 20-20-20 Shift",
            desc: "Step outside or look out a window. Find an object at least 20 feet away and stare at it for 20 seconds. While doing so, name 3 things you can hear and 2 things you can touch."
        },
        {
            title: "Physical Relocation",
            desc: "Perform 15 squats or 10 slow pushups right now. The muscle exertion floods your motor cortex, interrupting the motor habits loop."
        },
        {
            title: "Environment Clean-up",
            desc: "Pick one surface near you—your desk, a drawer, or kitchen sink. Spend exactly 2 minutes cleaning or organizing it. Physical order triggers dopamine release, satisfying the craving safely."
        },
        {
            title: "Hydration Anchor",
            desc: "Pour yourself a tall glass of cold water. Sip it slowly, noticing the cold temperature passing down your throat. Complete the entire glass before returning to your desk."
        }
    ];

    rollBtn.addEventListener('click', () => {
        rollBtn.disabled = true;
        rouletteTitle.textContent = "Rolling challenges...";
        rouletteDesc.textContent = "Disrupting habit pathways in the brain...";
        
        let counter = 0;
        const interval = setInterval(() => {
            const temp = offlineDistractions[counter % offlineDistractions.length];
            rouletteTitle.textContent = temp.title;
            counter++;
            if (counter > 8) {
                clearInterval(interval);
                const finalChoice = offlineDistractions[Math.floor(Math.random() * offlineDistractions.length)];
                rouletteTitle.textContent = finalChoice.title;
                rouletteDesc.textContent = finalChoice.desc;
                rollBtn.disabled = false;
            }
        }, 120);
    });

    // --- Tab 3: Crisis Mini Coach Logic ---
    const sosChatBox = document.getElementById('sos-chat-box');
    const sosChatForm = document.getElementById('sos-chat-input-form');
    const sosChatInput = document.getElementById('sos-chat-input');
    const miniPrompts = document.querySelectorAll('.mini-prompt-btn');

    // Helper to escape HTML tags to prevent cross-site scripting (XSS)
    const escapeHTML = (str) => {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    };

    const handleSOSMessageSubmit = async (text) => {
        if (!text.trim()) return;

        // Render User Message with XSS Protection
        const userMsg = document.createElement('div');
        userMsg.className = 'message-row msg-user';
        userMsg.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">${escapeHTML(text)}</div>
            </div>
        `;
        sosChatBox.appendChild(userMsg);
        sosChatInput.value = '';
        sosChatBox.scrollTop = sosChatBox.scrollHeight;

        // Loading bubble
        const loadBubble = document.createElement('div');
        loadBubble.className = 'message-row msg-aura temp-loading';
        loadBubble.innerHTML = `
            <div class="message-avatar">A</div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">Analyzing distress signals...</div>
            </div>
        `;
        sosChatBox.appendChild(loadBubble);
        sosChatBox.scrollTop = sosChatBox.scrollHeight;

        // Fetch AI Response
        const responseText = await aiEngine.generateResponse(text, stateManager.getState());
        
        // Remove loading
        loadBubble.remove();

        // Render AI Message with XSS Protection
        const aiMsg = document.createElement('div');
        aiMsg.className = 'message-row msg-aura';
        aiMsg.innerHTML = `
            <div class="message-avatar">A</div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble">${escapeHTML(responseText).replace(/\n/g, '<br>')}</div>
            </div>
        `;
        sosChatBox.appendChild(aiMsg);
        sosChatBox.scrollTop = sosChatBox.scrollHeight;
    };

    sosChatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSOSMessageSubmit(sosChatInput.value);
    });

    miniPrompts.forEach(btn => {
        btn.addEventListener('click', () => {
            const msg = btn.getAttribute('data-msg');
            handleSOSMessageSubmit(msg);
        });
    });
}
