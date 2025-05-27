// YouTube Focus Mode - Enhanced Background Script

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  try {
    // Initialize storage with default values
    chrome.storage.local.set({
      focusMode: false,
      version: chrome.runtime.getManifest().version,
    });
    console.log("YouTube Focus Mode extension installed successfully");
  } catch (error) {
    console.error("Failed to initialize extension:", error);
  }
});

// Throttle function for better performance
const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Listen for tab updates with better error handling and throttling
const handleTabUpdate = throttle((tabId, changeInfo, tab) => {
  try {
    // Only process when page is completely loaded and URL changed
    if (changeInfo.status !== "complete" || !tab.url || !changeInfo.url) {
      return;
    }

    // More robust YouTube URL detection
    const isYouTubeWatch =
      tab.url.includes("youtube.com/watch") ||
      tab.url.includes("youtu.be/") ||
      tab.url.includes("m.youtube.com/watch");

    if (isYouTubeWatch) {
      // Only reset focus mode when navigating to a new video, not on every update
      chrome.storage.local.get(["focusMode"]).then((result) => {
        if (result.focusMode) {
          chrome.storage.local.set({ focusMode: false }).catch((error) => {
            console.error("Failed to reset focus mode:", error);
          });
        }
      });

      // Send message to content script about new video with delay
      setTimeout(() => {
        chrome.tabs
          .sendMessage(tabId, {
            type: "NEW_VIDEO",
            url: tab.url,
          })
          .catch((error) => {
            // Ignore errors if content script isn't ready yet
            console.debug("Content script not ready yet:", error.message);
          });
      }, 1000); // Give YouTube time to load
    }
  } catch (error) {
    console.error("Error in tab update listener:", error);
  }
}, 1000); // Throttle to once per second

chrome.tabs.onUpdated.addListener(handleTabUpdate);

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  try {
    console.log("YouTube Focus Mode extension started");
    // Reset all focus modes on browser startup
    chrome.storage.local.set({ focusMode: false });
  } catch (error) {
    console.error("Error during extension startup:", error);
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.type === "GET_FOCUS_STATE") {
      chrome.storage.local
        .get(["focusMode"])
        .then((result) => {
          sendResponse({ focusMode: result.focusMode || false });
        })
        .catch((error) => {
          console.error("Failed to get focus state:", error);
          sendResponse({ focusMode: false, error: error.message });
        });
      return true; // Keep message channel open
    }
  } catch (error) {
    console.error("Error in message listener:", error);
    sendResponse({ error: error.message });
  }
});

// Clean up on extension suspend (for service worker)
self.addEventListener("beforeunload", () => {
  try {
    console.log("YouTube Focus Mode extension suspending");
  } catch (error) {
    console.error("Error during extension suspend:", error);
  }
});
