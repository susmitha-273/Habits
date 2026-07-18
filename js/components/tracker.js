/**
 * Aura Habit Tracker Log Component
 * Manages habit tracking submissions, daily logs, notes, and trigger selection.
 */

import { stateManager, getLocalDateString } from '../state.js';

export function renderTracker(container, state, navigateTo) {
    const { profile, logs } = state;
    const todayStr = getLocalDateString();
    
    // Check if user already logged today to prefill
    const todayLog = logs.find(l => l.date === todayStr);

    // List of common trigger options
    const triggerOptions = ["boredom", "stress", "fatigue", "loneliness", "social_pressure", "anxiety", "habit_routine"];

    // Compile logs history HTML (newest first)
    const logsHistoryHTML = [...logs]
        .reverse()
        .map(log => {
            const dateObj = new Date(log.date);
            const formattedDate = dateObj.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                timeZone: 'UTC'
            });
            const isTargetMet = log.value <= profile.targetLimit;

            const triggerBadges = log.triggers.map(t => 
                `<span class="badge trigger-badge-mini">${t}</span>`
            ).join(' ') || '<span class="text-muted">None</span>';

            return `
                <div class="glass-card history-row ${isTargetMet ? 'status-met' : 'status-exceeded'}">
                    <div class="history-date">
                        <span class="day-text">${formattedDate}</span>
                        <span class="status-indicator-dot"></span>
                    </div>
                    <div class="history-metrics">
                        <div class="metric-item">
                            <span class="metric-val">${log.value} ${profile.habitUnit}</span>
                            <span class="metric-lbl">Usage</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-val craving-color-${Math.ceil(log.cravingLevel / 2)}">🔥 ${log.cravingLevel}/10</span>
                            <span class="metric-lbl">Craving</span>
                        </div>
                    </div>
                    <div class="history-triggers">
                        <span class="section-title-mini">Triggers:</span>
                        <div class="trigger-mini-container">
                            ${triggerBadges}
                        </div>
                    </div>
                    <div class="history-notes">
                        <span class="section-title-mini">Notes:</span>
                        <p class="notes-text">${log.notes || '<em>No notes recorded.</em>'}</p>
                    </div>
                </div>
            `;
        })
        .join('');

    const trackerHTML = `
        <div class="tracker-container slide-up-animation">
            
            <div class="tracker-header">
                <h1>Habit Tracking Log</h1>
                <p class="subtitle">Commit to daily accountability. Every log generates AI coaching insights.</p>
            </div>

            <div class="tracker-grid">
                <!-- Log Entry Form Card -->
                <div class="glass-card log-form-card">
                    <h2>${todayLog ? 'Update Today\'s Entry' : 'Log Daily Progress'}</h2>
                    <form id="habit-log-form">
                        
                        <!-- Habit Value Input -->
                        <div class="form-group">
                            <label for="habit-value">
                                Today's ${profile.habitLabel} (${profile.habitUnit})
                                <span class="label-info">Target Limit: ${profile.targetLimit} ${profile.habitUnit}</span>
                            </label>
                            <input 
                                type="number" 
                                id="habit-value" 
                                class="form-control" 
                                min="0" 
                                value="${todayLog ? todayLog.value : ''}" 
                                placeholder="Enter value in ${profile.habitUnit}" 
                                required
                            />
                        </div>

                        <!-- Craving Intensity Slider -->
                        <div class="form-group">
                            <label for="craving-range">
                                Craving Intensity: <span id="craving-val-display" class="craving-color-3">5/10</span>
                            </label>
                            <input 
                                type="range" 
                                id="craving-range" 
                                class="form-range" 
                                min="1" 
                                max="10" 
                                value="${todayLog ? todayLog.cravingLevel : '5'}"
                            />
                            <div class="range-labels">
                                <span>Calm</span>
                                <span>Moderate</span>
                                <span>Intense Urges</span>
                            </div>
                        </div>

                        <!-- Triggers Selector -->
                        <div class="form-group">
                            <label>Identify Cravings Triggers</label>
                            <div class="trigger-chips-grid">
                                ${triggerOptions.map(trigger => {
                                    const isChecked = todayLog && todayLog.triggers.includes(trigger);
                                    return `
                                        <button 
                                            type="button" 
                                            class="trigger-chip-btn ${isChecked ? 'active' : ''}" 
                                            data-trigger="${trigger}"
                                            aria-pressed="${isChecked ? 'true' : 'false'}"
                                        >
                                            ${trigger.replace('_', ' ')}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Notes -->
                        <div class="form-group">
                            <label for="log-notes">Reflection / Context Notes</label>
                            <textarea 
                                id="log-notes" 
                                class="form-control" 
                                rows="3" 
                                placeholder="What feelings preceded the cravings? What actions helped you cope?"
                            >${todayLog ? todayLog.notes : ''}</textarea>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="btn btn-primary btn-block">
                            ${todayLog ? 'Save Updates' : 'Confirm Check-in (+20 AP)'}
                        </button>
                    </form>
                </div>

                <!-- History Column -->
                <div class="history-column">
                    <h2>Historical Records</h2>
                    <div class="history-list scrollbar-custom">
                        ${logsHistoryHTML || `
                            <div class="glass-card empty-history">
                                <p>No tracking logs found. Your progress history will populate here.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>

        </div>
    `;

    container.innerHTML = trackerHTML;

    // Grab elements
    const form = document.getElementById('habit-log-form');
    const cravingRange = document.getElementById('craving-range');
    const cravingDisplay = document.getElementById('craving-val-display');
    const chipButtons = document.querySelectorAll('.trigger-chip-btn');

    // Update craving display color/value reactively
    const updateCravingDisplay = (val) => {
        cravingDisplay.textContent = `${val}/10`;
        // Remove old classes
        cravingDisplay.className = '';
        // Map to corresponding color range (1-10 mapped to 1-5 level)
        const colorLevel = Math.ceil(val / 2);
        cravingDisplay.classList.add(`craving-color-${colorLevel}`);
    };

    updateCravingDisplay(cravingRange.value);
    
    cravingRange.addEventListener('input', (e) => {
        updateCravingDisplay(e.target.value);
    });

    // Toggle trigger chips
    chipButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
        });
    });

    // Handle Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const value = document.getElementById('habit-value').value;
        const cravingLevel = cravingRange.value;
        const notes = document.getElementById('log-notes').value;
        
        // Collate active triggers
        const triggers = [];
        document.querySelectorAll('.trigger-chip-btn.active').forEach(btn => {
            triggers.push(btn.getAttribute('data-trigger'));
        });

        // Write to State
        stateManager.logHabit(value, cravingLevel, triggers, notes);

        // Flash message or navigate back to dashboard
        showSuccessMessage(todayLog ? "Log Updated Successfully!" : "Habit Logged! +20 AP Earned.");
        
        setTimeout(() => {
            navigateTo('dashboard');
        }, 1000);
    });
}

function showSuccessMessage(text) {
    const toast = document.createElement('div');
    toast.className = 'toast-alert slide-up-animation';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">✨</span>
            <span class="toast-text">${text}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}
