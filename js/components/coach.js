/**
 * Aura Coach Chat Component
 * Handles the conversational chat interface, AI text parsing, quick-reply chips,
 * and text-streaming simulations.
 */

import { stateManager } from '../state.js';
import { aiEngine } from '../ai-engine.js';

export function renderCoach(container, state, navigateTo) {
    const { chatHistory } = state;

    const coachHTML = `
        <div class="coach-container slide-up-animation">
            
            <!-- Coach Info Bar -->
            <div class="coach-header-bar glass-card">
                <div class="coach-profile-info">
                    <div class="coach-status-avatar floating">A</div>
                    <div>
                        <h2>Aura Coach</h2>
                        <p class="status-indicator"><span class="dot-green"></span> Cognitive Behavioral Therapy Guide</p>
                    </div>
                </div>
                <div class="coach-actions">
                    <button class="btn btn-outline btn-xs" id="clear-chat-btn">Reset Conversation</button>
                </div>
            </div>

            <!-- Chat Window -->
            <div class="chat-window-layout">
                
                <!-- Main Conversation Area -->
                <div class="chat-thread-container glass-card">
                    <div class="chat-messages-scroll scrollbar-custom" id="chat-messages-box">
                        <!-- Messages render dynamically here -->
                    </div>

                    <!-- Typing Indicator -->
                    <div class="typing-indicator-box hide" id="typing-indicator">
                        <div class="typing-bubble">
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                        </div>
                    </div>

                    <!-- Quick Suggestions Grid -->
                    <div class="quick-suggestions-row">
                        <button class="suggestion-chip" data-msg="Generate recovery plan">📋 Generate Recovery Plan</button>
                        <button class="suggestion-chip" data-msg="I have a craving right now">🚨 I have a Craving</button>
                        <button class="suggestion-chip" data-msg="Analyze my triggers">📊 Analyze my Triggers</button>
                        <button class="suggestion-chip" data-msg="Give me a daily challenge">🎯 Recommend Challenge</button>
                    </div>

                    <!-- Chat Input Board -->
                    <form class="chat-input-board" id="chat-form">
                        <input 
                            type="text" 
                            id="chat-input" 
                            placeholder="Ask Aura anything about managing your urges..." 
                            autocomplete="off"
                            aria-label="Message to Aura Coach"
                            required
                        />
                        <button type="submit" class="btn btn-primary" id="chat-send-btn" aria-label="Send Message">
                            <span class="send-icon" aria-hidden="true">➔</span>
                        </button>
                    </form>
                </div>

            </div>

        </div>
    `;

    container.innerHTML = coachHTML;

    const messagesBox = document.getElementById('chat-messages-box');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const typingIndicator = document.getElementById('typing-indicator');
    const clearBtn = document.getElementById('clear-chat-btn');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');

    // Helper: Parse basic markdown patterns to HTML with XSS protection
    const parseMarkdown = (text) => {
        // Escape HTML tags to prevent cross-site scripting (XSS)
        let escaped = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        let html = escaped;
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^#### (.*$)/gim, '<h5>$1</h5>');
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Blockquotes
        html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
        // Bullet Lists
        html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
        // Wrap adjacent li elements into ul
        html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
        // Paragraph breaks
        html = html.replace(/\n/g, '<br>');
        return html;
    };

    // Render message log
    const renderMessages = () => {
        messagesBox.innerHTML = chatHistory.map(msg => {
            const isUser = msg.sender === 'user';
            return `
                <div class="message-row ${isUser ? 'msg-user' : 'msg-aura'}">
                    <div class="message-avatar">
                        ${isUser ? '👤' : 'A'}
                    </div>
                    <div class="message-bubble-wrapper">
                        <div class="message-bubble">
                            ${parseMarkdown(msg.text)}
                        </div>
                        <span class="message-time">
                            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        messagesBox.scrollTop = messagesBox.scrollHeight;
    };

    // Initial render
    renderMessages();

    // Send a message
    const sendMessage = async (text) => {
        if (!text.trim()) return;

        // Log user message
        stateManager.addChatMessage('user', text);
        chatInput.value = '';
        renderMessages();

        // Show typing indicator
        typingIndicator.classList.remove('hide');
        messagesBox.scrollTop = messagesBox.scrollHeight;

        // Fetch AI Response
        const currentAppState = stateManager.getState();
        const aiResponse = await aiEngine.generateResponse(text, currentAppState);

        // Hide typing indicator
        typingIndicator.classList.add('hide');

        // Create virtual AI message in DOM first, then stream it character-by-character
        const responseMsgObj = {
            sender: 'aura',
            text: aiResponse,
            timestamp: new Date().toISOString()
        };

        // Add to DOM manually for typewriter animation, then save to state
        const aiMsgRow = document.createElement('div');
        aiMsgRow.className = 'message-row msg-aura';
        aiMsgRow.innerHTML = `
            <div class="message-avatar">A</div>
            <div class="message-bubble-wrapper">
                <div class="message-bubble" id="streaming-bubble"></div>
                <span class="message-time">
                    ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        `;
        messagesBox.appendChild(aiMsgRow);
        messagesBox.scrollTop = messagesBox.scrollHeight;

        const streamingBubble = document.getElementById('streaming-bubble');
        
        // Simulating streaming chunks
        let currentText = '';
        const words = aiResponse.split(' ');
        let wordIndex = 0;

        const streamInterval = setInterval(() => {
            if (wordIndex < words.length) {
                currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
                streamingBubble.innerHTML = parseMarkdown(currentText);
                messagesBox.scrollTop = messagesBox.scrollHeight;
                wordIndex++;
            } else {
                clearInterval(streamInterval);
                streamingBubble.removeAttribute('id'); // remove reference
                
                // Commit to state database
                stateManager.addChatMessage('aura', aiResponse);
                
                // Reward user if they accepted a challenge
                if (text.toLowerCase().includes("accept") || text.toLowerCase().includes("i accept")) {
                    stateManager.addPoints(30);
                    showPointsToast("+30 AP - Challenge Accepted!");
                }
            }
        }, 30); // fast word stream
    };

    // Chat submit handler
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage(chatInput.value);
    });

    // Chip buttons click handler
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const msg = chip.getAttribute('data-msg');
            sendMessage(msg);
        });
    });

    // Reset Chat history
    clearBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset your conversation with Aura? This will wipe the current chat history.")) {
            stateManager.clearChatHistory();
            renderMessages();
        }
    });
}

function showPointsToast(text) {
    const toast = document.createElement('div');
    toast.className = 'toast-alert points-toast slide-up-animation';
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
