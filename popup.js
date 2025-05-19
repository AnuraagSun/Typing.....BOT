document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const deleteBtn = document.getElementById('delete-btn');
  const pauseToggle = document.getElementById('pause-toggle');
  const statusText = document.getElementById('status-text');
  const statusIndicator = document.querySelector('.status-indicator');
  
  // Get current tab to check if we're on a supported site
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    const isSupported = currentUrl.includes('web.whatsapp.com') || 
                        currentUrl.includes('discord.com');
    
    if (!isSupported) {
      statusText.textContent = 'Not on WhatsApp or Discord';
      startBtn.disabled = true;
      stopBtn.disabled = true;
      deleteBtn.disabled = true;
      pauseToggle.disabled = true;
    } else {
      // Get current status from storage
      chrome.storage.local.get(['typingStatus'], function(result) {
        updateStatusUI(result.typingStatus || 'ready');
      });
    }
  });
  
  // Update UI based on typing status
  function updateStatusUI(status) {
    statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusIndicator.className = 'status-indicator';
    
    if (status === 'typing') {
      statusIndicator.classList.add('typing');
    } else if (status === 'paused') {
      statusIndicator.classList.add('paused');
    } else {
      statusIndicator.classList.add('stopped');
    }
  }
  
  // Start typing
  startBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'start',
        enableRandomPauses: pauseToggle.checked
      });
      
      updateStatusUI('typing');
      chrome.storage.local.set({typingStatus: 'typing'});
    });
  });
  
  // Stop typing
  stopBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'stop'
      });
      
      updateStatusUI('stopped');
      chrome.storage.local.set({typingStatus: 'stopped'});
    });
  });
  
  // Delete typed text
  deleteBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'delete'
      });
    });
  });
  
  // Listen for status updates from content script
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.typingStatus) {
      updateStatusUI(changes.typingStatus.newValue);
    }
  });
});
