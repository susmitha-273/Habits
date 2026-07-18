/**
 * Aura Settings Component
 * Renders settings controls for updating targets, resetting data, and profile customization.
 */

import { stateManager } from '../state.js';

export function renderSettings(container, state, navigateTo) {
    const { profile, logs } = state;

    const settingsHTML = `
        <div class="settings-container slide-up-animation">
            
            <div class="settings-header">
                <h1>Settings & Goals Configuration</h1>
                <p class="subtitle">Personalize your targets and control your database profile.</p>
            </div>

            <div class="settings-grid">
                <!-- Profile Settings Card -->
                <div class="glass-card settings-form-card">
                    <h2>Personalization Profile</h2>
                    <form id="settings-form">
                        
                        <!-- Name -->
                        <div class="form-group">
                            <label for="settings-name">Name / Handle</label>
                            <input 
                                type="text" 
                                id="settings-name" 
                                class="form-control" 
                                value="${profile.name}" 
                                required
                            />
                        </div>

                        <!-- API Key -->
                        <div class="form-group">
                            <label for="settings-apikey">Gemini API Key (Optional)</label>
                            <input 
                                type="password" 
                                id="settings-apikey" 
                                class="form-control" 
                                placeholder="Enter custom Gemini API key (defaults to standard key)"
                                value="${profile.apiKey || ''}"
                            />
                            <p class="form-help-text">Saved securely in browser local storage and never shared with other servers.</p>
                        </div>

                        <!-- Habit Category Dropdown -->
                        <div class="form-group">
                            <label for="settings-habit">Active Habit Challenge</label>
                            <select id="settings-habit" class="form-control">
                                <option value="screen_time" ${profile.habit === 'screen_time' ? 'selected' : ''}>Excessive Screen Time (mins)</option>
                                <option value="social_media" ${profile.habit === 'social_media' ? 'selected' : ''}>Social Media Scroll (mins)</option>
                                <option value="junk_food" ${profile.habit === 'junk_food' ? 'selected' : ''}>Junk Food (calories)</option>
                                <option value="smoking" ${profile.habit === 'smoking' ? 'selected' : ''}>Smoking Habit (cigarettes)</option>
                            </select>
                            <p class="form-help-text">Changing this updates labels and measurements across the application.</p>
                        </div>

                        <!-- Target Limit -->
                        <div class="form-group">
                            <label for="settings-limit">Daily Target Limit (<span id="unit-label-settings">${profile.habitUnit}</span>)</label>
                            <input 
                                type="number" 
                                id="settings-limit" 
                                class="form-control" 
                                min="1" 
                                value="${profile.targetLimit}" 
                                required
                            />
                            <p class="form-help-text">Set the maximum daily limit you want to stay under.</p>
                        </div>

                        <button type="submit" class="btn btn-primary btn-block">Apply Settings</button>
                    </form>
                </div>

                <!-- Database Info & Reset Card -->
                <div class="glass-card danger-zone-card">
                    <h2>Platform Integration & Data Control</h2>
                    
                    <div class="data-stats-summary">
                        <div class="data-stat-item">
                            <span class="lbl">Habit Start Date:</span>
                            <span class="val">${profile.startDate}</span>
                        </div>
                        <div class="data-stat-item">
                            <span class="lbl">Total Logs Logged:</span>
                            <span class="val">${logs.length} Entries</span>
                        </div>
                        <div class="data-stat-item">
                            <span class="lbl">Aura Points Balance:</span>
                            <span class="val">${profile.points} AP</span>
                        </div>
                    </div>

                    <div class="danger-zone-divider"></div>

                    <div class="danger-action-box">
                        <h3>Reset Database</h3>
                        <p>This action permanently purges all historical logs, streaks, and reset state back to fresh demonstration defaults.</p>
                        <button class="btn btn-danger btn-block" id="reset-db-btn">Purge & Reset Platform</button>
                    </div>
                </div>
            </div>

        </div>
    `;

    container.innerHTML = settingsHTML;

    const form = document.getElementById('settings-form');
    const habitSelect = document.getElementById('settings-habit');
    const unitLabel = document.getElementById('unit-label-settings');
    const resetBtn = document.getElementById('reset-db-btn');

    // Update unit helper on selection change
    habitSelect.addEventListener('change', (e) => {
        const units = {
            screen_time: "mins",
            social_media: "mins",
            junk_food: "calories",
            smoking: "cigarettes"
        };
        unitLabel.textContent = units[e.target.value] || "times";
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('settings-name').value;
        const apiKey = document.getElementById('settings-apikey').value.trim();
        const habit = habitSelect.value;
        const targetLimit = Number(document.getElementById('settings-limit').value);

        stateManager.updateProfile({
            name,
            apiKey,
            habit,
            targetLimit
        });

        showToast("Settings Updated Successfully!");
        
        setTimeout(() => {
            navigateTo('dashboard');
        }, 1000);
    });

    // Reset Database
    resetBtn.addEventListener('click', () => {
        if (confirm("🚨 WARNING: Are you absolutely sure you want to purge your Aura database? All custom logs, streaks, and settings will be permanently lost.")) {
            stateManager.resetDatabase();
            showToast("Database Purged. Reloading Aura...");
            setTimeout(() => {
                window.location.reload();
            }, 1200);
        }
    });
}

function showToast(text) {
    const toast = document.createElement('div');
    toast.className = 'toast-alert slide-up-animation';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">⚙️</span>
            <span class="toast-text">${text}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}
