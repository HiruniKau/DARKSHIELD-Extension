/**
 * DarkShield Service Worker (background.js)
 * Background orchestrator for screenshot capturing and message routing.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("DarkShield Extension installed and running.");
});

// Listener for runtime messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureVisibleTab") {
    // Capture visible tab screenshot from background context
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({ success: false, error: "No active tab found" });
        return;
      }
      
      const activeTab = tabs[0];
      chrome.tabs.captureVisibleTab(activeTab.windowId, { format: "png" }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, dataUrl: dataUrl });
        }
      });
    });
    return true; // Keep message channel open for async response
  }
});
