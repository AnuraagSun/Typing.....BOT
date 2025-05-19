// Initialize typing status when extension is installed
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({typingStatus: 'ready'});
});
