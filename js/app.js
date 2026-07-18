/**
 * Aura Application Bootstrapper
 * Coordinates page transitions, routing, state subscription, and global events.
 */

import { stateManager } from './state.js';
import { renderDashboard } from './components/dashboard.js';
import { renderTracker } from './components/tracker.js';
import { renderCoach } from './components/coach.js';
import { renderSettings } from './components/settings.js';
import { openSOSModal } from './components/sos.js';

// Cache container node
const appContentContainer = document.getElementById('app-main-content');
const navLinks = document.querySelectorAll('[data-tab]');
const sosGlobalBtn = document.getElementById('global-sos-btn');

let currentView = 'dashboard';

// Route Mapping
const routeRenders = {
    dashboard: renderDashboard,
    tracker: renderTracker,
    coach: renderCoach,
    settings: renderSettings
};

/**
 * Transition to a target view panel
 * @param {String} viewName - The view id ('dashboard', 'tracker', 'coach', 'settings')
 */
function navigateTo(viewName) {
    if (!routeRenders[viewName]) return;
    
    currentView = viewName;
    window.location.hash = `#${viewName}`;

    // Update active nav styles and WAI-ARIA tab controls
    navLinks.forEach(link => {
        const isActive = link.getAttribute('data-tab') === viewName;
        if (isActive) {
            link.classList.add('active');
            link.setAttribute('aria-selected', 'true');
        } else {
            link.classList.remove('active');
            link.setAttribute('aria-selected', 'false');
        }
    });

    // Render corresponding screen
    const state = stateManager.getState();
    routeRenders[viewName](appContentContainer, state, navigateTo);
}

/**
 * Global Initializer
 */
function init() {
    // Initial Route check based on hash
    const initialHash = window.location.hash.replace('#', '');
    const defaultRoute = routeRenders[initialHash] ? initialHash : 'dashboard';
    
    // Bind Tab Click Handlers
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.getAttribute('data-tab');
            navigateTo(tabName);
        });
    });

    // Bind global SOS triggers
    if (sosGlobalBtn) {
        sosGlobalBtn.addEventListener('click', () => {
            const state = stateManager.getState();
            openSOSModal(state);
        });
    }

    // Subscribe to state change broadcasts to refresh views reactively
    stateManager.subscribe((newState) => {
        // Redraw only the current view (except coach and when SOS modal is open, as they manage their own DOM updates locally)
        const isSOSOpen = !!document.getElementById('sos-modal');
        if (routeRenders[currentView] && currentView !== 'coach' && !isSOSOpen) {
            routeRenders[currentView](appContentContainer, newState, navigateTo);
        }
        
        // Update global streaks indicator in the navbar header
        updateHeaderStreaks(newState);
    });

    // Handle back/forward navigation
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (routeRenders[hash] && hash !== currentView) {
            navigateTo(hash);
        }
    });

    // First load execution
    const state = stateManager.getState();
    updateHeaderStreaks(state);
    navigateTo(defaultRoute);
}

/**
 * Updates the global streak ticker at the top of the webpage
 * @param {Object} state - The current state object
 */
function updateHeaderStreaks(state) {
    const stats = stateManager.getStreakStats();
    const streakCountNode = document.getElementById('nav-streak-count');
    const pointsCountNode = document.getElementById('nav-points-count');
    
    if (streakCountNode) {
        streakCountNode.textContent = `${stats.currentStreak} 🔥`;
    }
    if (pointsCountNode) {
        pointsCountNode.textContent = `${state.profile.points} AP`;
    }
}

// Bootstrap once the DOM finishes parsing
document.addEventListener('DOMContentLoaded', init);
export { navigateTo };
