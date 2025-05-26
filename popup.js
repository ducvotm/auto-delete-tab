document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggleFocus");
  const statusDiv = document.getElementById("status");

  // Check if we're on a YouTube video page
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];
    if (!currentTab.url.includes("youtube.com/watch")) {
      statusDiv.textContent = "Please open a YouTube video to use Focus Mode";
      toggleButton.disabled = true;
      return;
    }

    // Get current focus mode state
    chrome.storage.local.get(["focusMode"], function (result) {
      const isFocused = result.focusMode || false;
      updateButtonState(isFocused);
    });
  });

  // Toggle focus mode
  toggleButton.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "toggleFocus" },
        function (response) {
          if (response && response.isFocused !== undefined) {
            updateButtonState(response.isFocused);
          }
        }
      );
    });
  });

  function updateButtonState(isFocused) {
    toggleButton.textContent = isFocused
      ? "❌ Exit Focus Mode"
      : "🎯 Enter Focus Mode";
    statusDiv.textContent = isFocused
      ? "Focus Mode is ON"
      : "Focus Mode is OFF";
  }
});
