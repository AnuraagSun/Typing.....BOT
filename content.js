// Global variables to track typing state
let isTyping = false;
let enableRandomPauses = true;
let typingInterval = null;
let pauseTimeout = null;

// Function to find the input field based on current site
function findInputField() {
    if (window.location.href.includes('web.whatsapp.com')) {
        return document.querySelector('div[contenteditable="true"][data-tab="10"]');
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
        // Create a text node and insert it at the cursor position
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(letter);
        range.insertNode(textNode);
        
        // Move cursor after inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event to make WhatsApp recognize the typing
        const event = new InputEvent('input', { 
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: letter
        });
        inputField.dispatchEvent(event);
    } 
    // For Discord
    else if (window.location.href.includes('discord.com')) {
        // Insert text at cursor position
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(letter);
        range.insertNode(textNode);
        
        // Move cursor after inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event
        const event = new InputEvent('input', { 
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: letter
        });
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
    // Stop any existing typing first
    stopTyping();
    
    const inputField = findInputField();
    if (!inputField) return;
    
    isTyping = true;
    enableRandomPauses = enablePauses;
    
    // Focus on the input field
    inputField.focus();
    
    // Ensure cursor is at the end of existing text for WhatsApp
    if (window.location.href.includes('web.whatsapp.com')) {
        // Create a range at the end of the content
        const range = document.createRange();
        const selection = window.getSelection();
        
        if (inputField.childNodes.length > 0) {
            const lastChild = inputField.childNodes[inputField.childNodes.length - 1];
            if (lastChild.nodeType === Node.TEXT_NODE) {
                range.setStart(lastChild, lastChild.length);
                range.setEnd(lastChild, lastChild.length);
            } else {
                range.selectNodeContents(inputField);
                range.collapse(false); // Collapse to end
            }
        } else {
            range.selectNodeContents(inputField);
            range.collapse(false); // Collapse to end
        }
        
        // Apply the selection
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // Start typing after ensuring cursor position
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
        
        // Create a range at the start of the input field
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(inputField);
        range.collapse(true); // Collapse to start
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event
        const event = new InputEvent('input', { 
            bubbles: true,
            cancelable: true,
            inputType: 'deleteContent'
        });
        inputField.dispatchEvent(event);
    } 
    // For Discord
    else if (window.location.href.includes('discord.com')) {
        inputField.textContent = '';
        
        // Create a range at the start of the input field
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(inputField);
        range.collapse(true); // Collapse to start
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event
        const event = new InputEvent('input', { 
            bubbles: true,
            cancelable: true,
            inputType: 'deleteContent'
        });
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
