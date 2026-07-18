/**
 * Aura Dashboard Component
 * Renders the dashboard landing page with stats, charts, and the AI nudge card.
 */

import { aiEngine } from '../ai-engine.js';
import { getLocalDateString } from '../state.js';

let usageChartInstance = null;
let triggersChartInstance = null;

export function renderDashboard(container, state, navigateTo) {
    const { profile, logs } = state;
    const todayStr = getLocalDateString();
    const todayLog = logs.find(l => l.date === todayStr);
    const todayValue = todayLog ? todayLog.value : 0;
    const target = profile.targetLimit;
    const pct = Math.min(Math.round((todayValue / target) * 100), 100);
    const isOver = todayValue > target;

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateStreaks(logs, target);

    // AI Nudge
    const nudge = aiEngine.generateNudge(state);

    // Calculate triggers for stats
    const triggerStats = {};
    logs.forEach(l => {
        l.triggers.forEach(t => {
            triggerStats[t] = (triggerStats[t] || 0) + 1;
        });
    });
    const topTriggers = Object.entries(triggerStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, val]) => `<span class="badge trigger-badge">${name} (${val})</span>`)
        .join(' ');

    const dashboardHTML = `
        <div class="dashboard-container slide-up-animation">
            
            <!-- Welcome Header -->
            <div class="welcome-header">
                <div>
                    <h1>Welcome back, ${profile.name}</h1>
                    <p class="subtitle">Your recovery path is active. Stay focused, stay mindful.</p>
                </div>
                <div class="points-badge">
                    <span class="points-icon">✨</span>
                    <span class="points-count">${profile.points} AP</span>
                    <span class="points-label">Aura Points</span>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <!-- Streak Card -->
                <div class="glass-card stat-card streak-card">
                    <div class="card-icon streak-icon">🔥</div>
                    <div class="card-info">
                        <h3>Active Streak</h3>
                        <p class="stat-number glow-text">${currentStreak} Days</p>
                        <p class="stat-meta">Longest: ${longestStreak} days</p>
                    </div>
                </div>

                <!-- Daily Target Progress Card -->
                <div class="glass-card stat-card limit-card ${isOver ? 'limit-warning' : ''}">
                    <div class="card-icon limit-icon">${isOver ? '⚠️' : '🎯'}</div>
                    <div class="card-info" style="width: 100%;">
                        <h3>Today's Usage</h3>
                        <p class="stat-number">${todayValue} / ${target} <span class="unit-label">${profile.habitUnit}</span></p>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${pct}%"></div>
                        </div>
                        <p class="stat-meta">${pct}% of daily allowance used</p>
                    </div>
                </div>

                <!-- Checkin Alert / Status -->
                <div class="glass-card stat-card checkin-card">
                    <div class="card-icon checkin-icon">📅</div>
                    <div class="card-info">
                        <h3>Status</h3>
                        <p class="stat-status-text">${todayLog ? 'Daily Log Complete' : 'Log Pending Today'}</p>
                        <button class="btn btn-secondary btn-sm" id="dashboard-log-btn">
                            ${todayLog ? 'Update Log' : 'Log Stats Now'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- AI Coach Nudge Panel -->
            <div class="glass-card ai-nudge-panel">
                <div class="ai-avatar-container">
                    <div class="ai-avatar floating">
                        <span>A</span>
                        <div class="avatar-glow"></div>
                    </div>
                </div>
                <div class="ai-nudge-content">
                    <div class="ai-header">
                        <span class="ai-title">AURA AI COACH</span>
                        <span class="ai-badge">ACTIVE ANALYSIS</span>
                    </div>
                    <p class="ai-nudge-text">${nudge}</p>
                    <div class="ai-actions">
                        <button class="btn btn-primary btn-sm" id="nudge-chat-btn">Consult Aura</button>
                        <button class="btn btn-outline btn-sm" id="nudge-challenge-btn">Get Challenge</button>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="charts-row">
                <div class="glass-card chart-container">
                    <div class="chart-header">
                        <h3>Habit Tracker Trends (Last 7 Logs)</h3>
                        <span class="chart-legend">Target Limit: ${target} ${profile.habitUnit}</span>
                    </div>
                    <div class="canvas-wrapper">
                        <canvas id="usageChart"></canvas>
                    </div>
                </div>

                <div class="glass-card chart-container">
                    <div class="chart-header">
                        <h3>Trigger Frequency</h3>
                    </div>
                    <div class="triggers-info-box">
                        <div class="canvas-wrapper">
                            <canvas id="triggersChart"></canvas>
                        </div>
                        <div class="top-triggers-summary">
                            <h4>Top Triggers Identified:</h4>
                            <div class="triggers-list">
                                ${topTriggers || '<p class="no-data">Log triggers in the Habit Log tab to see results.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Achievements Section -->
            <div class="glass-card achievements-panel" style="margin-top: 20px;">
                <h3 style="font-family: var(--font-heading); font-size: 18px; font-weight: 600; margin-bottom: 20px;">🏆 Unlocked Milestones</h3>
                <div class="achievements-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
                    ${state.achievements.map(ach => `
                        <div class="glass-card achievement-card" style="display: flex; gap: 12px; align-items: center; padding: 14px 18px; border-left: 4px solid ${ach.unlocked ? 'var(--success)' : 'var(--text-dark)'}; background: ${ach.unlocked ? 'rgba(34, 197, 94, 0.04)' : 'rgba(255,255,255,0.01)'}; transition: var(--transition-smooth); ${!ach.unlocked ? 'opacity: 0.65;' : ''}">
                            <div style="font-size: 24px;">${ach.unlocked ? '🌟' : '🔒'}</div>
                            <div>
                                <h4 style="font-family: var(--font-heading); font-size: 14px; font-weight: 600; margin-bottom: 2px; color: ${ach.unlocked ? 'var(--text-main)' : 'var(--text-muted)'}">${ach.title}</h4>
                                <p style="font-size: 11px; color: var(--text-muted);">${ach.desc}</p>
                                ${ach.unlocked ? `<span style="font-size: 9px; color: var(--success); font-weight: 600;">Unlocked</span>` : `<span style="font-size: 9px; color: var(--text-dark); font-weight: 600;">Locked (+${ach.id === 'first_log' ? '50' : ach.id === 'streak_3' ? '100' : ach.id === 'streak_7' ? '200' : '80'} AP)</span>`}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

        </div>
    `;

    container.innerHTML = dashboardHTML;

    // Attach listeners
    document.getElementById('dashboard-log-btn').addEventListener('click', () => {
        navigateTo('tracker');
    });

    document.getElementById('nudge-chat-btn').addEventListener('click', () => {
        navigateTo('coach');
    });

    document.getElementById('nudge-challenge-btn').addEventListener('click', () => {
        navigateTo('coach');
        // We'll pass a message or automatically issue a challenge
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.value = "Give me a daily challenge";
                document.getElementById('chat-send-btn').click();
            }
        }, 150);
    });

    // Initialize Charts after rendering DOM
    setTimeout(() => {
        initCharts(logs, target, profile.habitUnit);
    }, 50);
}

function calculateStreaks(logs, target) {
    const logsMap = {};
    logs.forEach(log => {
        logsMap[log.date] = log.value <= target;
    });

    const sortedDates = Object.keys(logsMap).sort();
    if (sortedDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayStr = getLocalDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    // Longest Streak
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
            tempStreak = 0;
        } else {
            if (dateStr !== todayStr) {
                tempStreak = 0;
            }
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }

    // Current Streak
    const todayMet = logsMap[todayStr];
    const yesterdayMet = logsMap[yesterdayStr];

    if (todayMet === true) {
        let d = new Date();
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

function initCharts(logs, targetLimit, unit) {
    if (usageChartInstance) usageChartInstance.destroy();
    if (triggersChartInstance) triggersChartInstance.destroy();

    const usageCanvas = document.getElementById('usageChart');
    const triggersCanvas = document.getElementById('triggersChart');

    if (!usageCanvas || !triggersCanvas) return;

    // Get last 7 logs
    const recentLogs = [...logs].slice(-7);
    const labels = recentLogs.map(l => {
        // Format date into short month/day e.g., Jul 15
        const d = new Date(l.date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    });
    const values = recentLogs.map(l => l.value);
    const cravingLevels = recentLogs.map(l => l.cravingLevel * 10); // scale up to % for contrast

    // Create Gradient for usage values
    const ctx1 = usageCanvas.getContext('2d');
    const usageGradient = ctx1.createLinearGradient(0, 0, 0, 200);
    usageGradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)'); // purple
    usageGradient.addColorStop(1, 'rgba(124, 58, 237, 0.0)');

    usageChartInstance = new Chart(usageCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Usage (${unit})`,
                    data: values,
                    borderColor: '#9d4edd',
                    backgroundColor: usageGradient,
                    fill: true,
                    tension: 0.35,
                    borderWidth: 3,
                    pointBackgroundColor: '#c77dff',
                    pointHoverRadius: 7
                },
                {
                    label: 'Craving Level (x10)',
                    data: cravingLevels,
                    borderColor: '#f72585',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointStyle: 'rectRot',
                    pointBackgroundColor: '#f72585',
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#e0e1dd', font: { family: 'Inter', size: 11 } }
                },
                tooltip: {
                    padding: 12,
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // Triggers Count
    const triggerCounts = {};
    logs.forEach(l => {
        l.triggers.forEach(t => {
            triggerCounts[t] = (triggerCounts[t] || 0) + 1;
        });
    });

    const triggerLabels = Object.keys(triggerCounts);
    const triggerData = Object.values(triggerCounts);

    const colors = ['#f72585', '#7209b7', '#3f37c9', '#4361ee', '#4cc9f0', '#ffb703'];

    triggersChartInstance = new Chart(triggersCanvas, {
        type: 'doughnut',
        data: {
            labels: triggerLabels.length ? triggerLabels : ['No Triggers logged'],
            datasets: [{
                data: triggerData.length ? triggerData : [1],
                backgroundColor: triggerData.length ? colors.slice(0, triggerLabels.length) : ['rgba(255,255,255,0.08)'],
                borderWidth: 1,
                borderColor: 'rgba(15, 23, 42, 0.9)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#e0e1dd',
                        font: { family: 'Inter', size: 10 }
                    }
                }
            },
            cutout: '65%'
        }
    });
}
