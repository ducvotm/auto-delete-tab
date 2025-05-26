// Create and add the floating button
function createFloatingButton() {
  const button = document.createElement("button");
  button.id = "youtube-focus-button";
  button.innerHTML = "🎯 Focus Mode";
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    padding: 10px 20px;
    background-color: #ff0000;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    user-select: none;
    transition: background-color 0.2s;
  `;

  button.addEventListener("mouseover", () => {
    button.style.backgroundColor = "#cc0000";
  });

  button.addEventListener("mouseout", () => {
    button.style.backgroundColor = "#ff0000";
  });

  button.addEventListener("click", () => {
    isFocused = !isFocused;
    document.body.classList.toggle("youtube-focus-mode", isFocused);
    button.innerHTML = isFocused ? "❌ Exit Focus" : "🎯 Focus Mode";
    chrome.storage.local.set({ focusMode: isFocused });
  });

  document.body.appendChild(button);
}

// Initialize focus mode state
let isFocused = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleFocus") {
    isFocused = !isFocused;
    document.body.classList.toggle("youtube-focus-mode", isFocused);

    // Save state
    chrome.storage.local.set({ focusMode: isFocused });

    // Send response back to popup
    sendResponse({ isFocused });
  }
  return true;
});

// Check if focus mode was previously enabled
chrome.storage.local.get(["focusMode"], function (result) {
  if (result.focusMode) {
    isFocused = true;
    document.body.classList.add("youtube-focus-mode");
  }
});

// Wait for YouTube to be ready
function waitForYouTube() {
  if (window.location.href.includes("youtube.com/watch")) {
    if (document.body) {
      createFloatingButton();
    } else {
      setTimeout(waitForYouTube, 100);
    }
  }
}

// Start watching for YouTube
waitForYouTube();
