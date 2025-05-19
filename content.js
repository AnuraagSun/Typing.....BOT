// Global variables to track typing state
let isTyping = false;
let enableRandomPauses = true;
let typingInterval = null;
let pauseTimeout = null;
let lastActiveElement = null;

// Function to find the input field based on current site
function findInputField() {
    if (window.location.href.includes('web.whatsapp.com')) {
        // Try multiple possible selectors for WhatsApp
        return document.querySelector('div[contenteditable="true"][data-tab="10"]') || 
               document.querySelector('div[contenteditable="true"][spellcheck="true"]') ||
               document.querySelector('div[contenteditable="true"]');
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

// Simulate keyboard event
function simulateKeyboardEvent(element, letter) {
    // Create and dispatch keydown event
    const keydownEvent = new KeyboardEvent('keydown', {
        key: letter,
        code: 'Key' + letter.toUpperCase(),
        keyCode: letter.charCodeAt(0),
        which: letter.charCodeAt(0),
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(keydownEvent);
    
    // Create and dispatch keypress event
    const keypressEvent = new KeyboardEvent('keypress', {
        key: letter,
        code: 'Key' + letter.toUpperCase(),
        keyCode: letter.charCodeAt(0),
        which: letter.charCodeAt(0),
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(keypressEvent);
    
    // Create and dispatch keyup event
    const keyupEvent = new KeyboardEvent('keyup', {
        key: letter,
        code: 'Key' + letter.toUpperCase(),
        keyCode: letter.charCodeAt(0),
        which: letter.charCodeAt(0),
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(keyupEvent);
    
    // Create and dispatch input event
    const inputEvent = new InputEvent('input', {
        data: letter,
        inputType: 'insertText',
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(inputEvent);
}

// Type a single character into the input field
function typeCharacter() {
    // Get the currently focused element or find the input field
    const inputField = document.activeElement.isContentEditable ? 
                      document.activeElement : findInputField();
                      
    // Save reference to active element
    lastActiveElement = document.activeElement;
    
    if (!inputField) {
        stopTyping();
        return;
    }

    // Type a random letter
    const letter = getRandomLetter();
    
    try {
        // For WhatsApp
        if (window.location.href.includes('web.whatsapp.com')) {
            // Use execCommand for more reliable typing
            document.execCommand('insertText', false, letter);
            simulateKeyboardEvent(inputField, letter);
        } 
        // For Discord
        else if (window.location.href.includes('discord.com')) {
            // Use execCommand for more reliable typing
            document.execCommand('insertText', false, letter);
            simulateKeyboardEvent(inputField, letter);
        }
    } catch (e) {
        console.error("Error typing:", e);
        // Fallback method
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(letter);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
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
    // Stop any existing typing first
    stopTyping();
    
    // Get the currently focused element or find the input field
    const inputField = document.activeElement.isContentEditable ? 
                      document.activeElement : findInputField();
                      
    if (!inputField) return;
    
    isTyping = true;
    enableRandomPauses = enablePauses;
    
    // Focus on the input field
    inputField.focus();
    
    // Start typing after a short delay
    setTimeout(typeCharacter, 100);
    
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
            // Refocus if needed
            if (lastActiveElement && document.activeElement !== lastActiveElement) {
                lastActiveElement.focus();
            }
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
    // Get the currently focused element or find the input field
    const inputField = document.activeElement.isContentEditable ? 
                      document.activeElement : findInputField();
                      
    if (!inputField) return;
    
    // Focus on the input field
    inputField.focus();
    
    // Select all text
    document.execCommand('selectAll', false, null);
    
    // Delete selected text
    document.execCommand('delete', false, null);
    
    // Trigger input event
    const event = new InputEvent('input', { 
        bubbles: true,
        cancelable: true,
        inputType: 'deleteContent'
    });
    inputField.dispatchEvent(event);
}

// Monitor focus changes to track the active input field
document.addEventListener('focusin', function(e) {
    if (e.target.isContentEditable) {
        lastActiveElement = e.target;
    }
});

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
