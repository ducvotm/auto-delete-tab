// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage
  chrome.storage.local.set({ focusMode: false });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url.includes("youtube.com/watch")
  ) {
    // Reset focus mode when navigating to a new video
    chrome.storage.local.set({ focusMode: false });
  }
});
