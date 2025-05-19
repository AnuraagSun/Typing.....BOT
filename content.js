// Global variables to track typing state
let isTyping = false;
let enableRandomPauses = true;
let typingInterval = null;
let pauseTimeout = null;

// Function to find the input field based on current site
function findInputField() {
    if (window.location.href.includes('web.whatsapp.com')) {
        return document.querySelector('div[contenteditable="true"]');
    } else if (window.location.href.includes('discord.com')) {
        return document.querySelector('div[role="textbox"]');
    }
    return null;
}

// Generate a random letter (a-z, A-Z)
function getRandomLetter() {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters.charAt(Math.floor(Math.random() * letters.length));
}

// Get random typing delay (100-200ms)
function getRandomTypingDelay() {
    return Math.floor(Math.random() * 100) + 100;
}

// Get random pause duration (1-5 seconds)
function getRandomPauseDuration() {
    return (Math.floor(Math.random() * 4) + 1) * 1000;
}

// Decide if we should pause (roughly every 5-15 characters)
function shouldPause() {
    const pauseChance = Math.floor(Math.random() * 15) + 5;
    return Math.random() * 100 < pauseChance;
}

// Type a single character into the input field
function typeCharacter() {
    const inputField = findInputField();
    if (!inputField) {
        stopTyping();
        return;
    }

    // Type a random letter
    const letter = getRandomLetter();
    
    // For WhatsApp
    if (window.location.href.includes('web.whatsapp.com')) {
        inputField.textContent += letter;
        // Trigger input event to make WhatsApp recognize the typing
        const event = new Event('input', { bubbles: true });
        inputField.dispatchEvent(event);
    } 
    // For Discord
    else if (window.location.href.includes('discord.com')) {
        // Insert text at cursor position
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(letter);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event
        const event = new Event('input', { bubbles: true });
        inputField.dispatchEvent(event);
    }

    // Check if we should pause
    if (enableRandomPauses && shouldPause()) {
        pauseTyping();
    } else {
        // Schedule next character
        typingInterval = setTimeout(typeCharacter, getRandomTypingDelay());
    }
}

// Start the typing process
function startTyping(enablePauses = true) {
    if (isTyping) return;
    
    const inputField = findInputField();
    if (!inputField) return;
    
    isTyping = true;
    enableRandomPauses = enablePauses;
    
    // Focus on the input field
    inputField.focus();
    
    // Start typing
    typeCharacter();
    
    // Update status
    chrome.storage.local.set({typingStatus: 'typing'});
}

// Pause typing temporarily
function pauseTyping() {
    if (!isTyping) return;
    
    // Clear current typing interval
    clearTimeout(typingInterval);
    
    // Update status
    chrome.storage.local.set({typingStatus: 'paused'});
    
    // Set timeout to resume
    pauseTimeout = setTimeout(() => {
        if (isTyping) {
            typeCharacter();
            chrome.storage.local.set({typingStatus: 'typing'});
        }
    }, getRandomPauseDuration());
}

// Stop typing completely
function stopTyping() {
    isTyping = false;
    
    // Clear all timeouts
    clearTimeout(typingInterval);
    clearTimeout(pauseTimeout);
    
    // Update status
    chrome.storage.local.set({typingStatus: 'stopped'});
}

// Delete all typed text
function deleteTypedText() {
    const inputField = findInputField();
    if (!inputField) return;
    
    // For WhatsApp
    if (window.location.href.includes('web.whatsapp.com')) {
        inputField.textContent = '';
        // Trigger input event
        const event = new Event('input', { bubbles: true });
        inputField.dispatchEvent(event);
    } 
    // For Discord
    else if (window.location.href.includes('discord.com')) {
        inputField.textContent = '';
        // Trigger input event
        const event = new Event('input', { bubbles: true });
        inputField.dispatchEvent(event);
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.action) {
        case 'start':
            startTyping(request.enableRandomPauses);
            break;
        case 'stop':
            stopTyping();
            break;
        case 'delete':
            deleteTypedText();
            break;
    }
    sendResponse({status: 'success'});
    return true;
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    stopTyping();
});
