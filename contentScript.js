// YouTube Focus Mode - Improved Content Script
(() => {
  let isFocused = false;
  let focusButton = null;
  let observer = null;
  let isInitialized = false;

  // Filter console noise from YouTube
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = function (...args) {
    const message = args.join(" ");
    // Filter out YouTube's own errors that we can't control
    if (
      message.includes("LegacyDataMixin") ||
      message.includes("dataChanged_") ||
      message.includes("403") ||
      message.includes("requestStorageAccessFor") ||
      message.includes("aria-hidden") ||
      message.includes("non-passive event listener")
    ) {
      return; // Suppress these YouTube errors
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = function (...args) {
    const message = args.join(" ");
    // Filter out YouTube's preload warnings that we can't control
    if (
      message.includes("was preloaded using link preload but not used") ||
      message.includes("generate_204") ||
      message.includes("Please make sure it has an appropriate")
    ) {
      return; // Suppress these YouTube preload warnings
    }
    originalConsoleWarn.apply(console, args);
  };

  // Add our own logging prefix
  const log = (message, type = "info") => {
    const prefix = "🎯 YouTube Focus Mode:";
    if (type === "error") {
      console.error(prefix, message);
    } else {
      console.log(prefix, message);
    }
  };

  // Debounce utility function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Throttle utility function for better performance
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

  // Wait for element with timeout
  const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  };

  const createFloatingButton = async () => {
    try {
      // Prevent duplicate buttons
      const existingButton = document.getElementById("youtube-focus-button");
      if (existingButton) {
        log("Button already exists, updating state");
        focusButton = existingButton;
        updateButtonState();
        return;
      }

      // Wait for body to be ready
      await waitForElement("body");

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
        transition: all 0.2s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      // Use passive event listeners to avoid console warnings
      button.addEventListener(
        "mouseover",
        () => {
          button.style.backgroundColor = "#cc0000";
        },
        { passive: true }
      );

      button.addEventListener(
        "mouseout",
        () => {
          button.style.backgroundColor = "#ff0000";
        },
        { passive: true }
      );

      // Debounced click handler with passive option
      const debouncedToggle = debounce(handleFocusToggle, 300);
      button.addEventListener("click", debouncedToggle, { passive: true });

      document.body.appendChild(button);
      focusButton = button;

      // Update button state based on current focus mode
      updateButtonState();
      log("Focus button created successfully");
    } catch (error) {
      log("Failed to create focus button: " + error.message, "error");
    }
  };

  const handleFocusToggle = async () => {
    try {
      isFocused = !isFocused;
      await updateFocusMode();
      log(`Focus mode ${isFocused ? "enabled" : "disabled"}`);
    } catch (error) {
      log("Failed to toggle focus mode: " + error.message, "error");
      // Revert state on error
      isFocused = !isFocused;
      updateButtonState();
    }
  };

  const toggleFullscreen = async (enable) => {
    try {
      if (enable) {
        // Enter fullscreen mode
        const fullscreenButton = document.querySelector(
          ".ytp-fullscreen-button"
        );
        const videoElement = document.querySelector("video");

        if (fullscreenButton && !document.fullscreenElement) {
          log("Entering fullscreen mode via button");
          fullscreenButton.click();
        } else if (videoElement && !document.fullscreenElement) {
          // Fallback: use video element's requestFullscreen
          if (videoElement.requestFullscreen) {
            await videoElement.requestFullscreen();
          } else if (videoElement.webkitRequestFullscreen) {
            await videoElement.webkitRequestFullscreen();
          } else if (videoElement.mozRequestFullScreen) {
            await videoElement.mozRequestFullScreen();
          }
          log("Entered fullscreen using video element");
        }
      } else {
        // Exit fullscreen mode
        if (document.fullscreenElement) {
          log("Exiting fullscreen mode");
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
          }
        }
      }
    } catch (error) {
      log("Failed to toggle fullscreen: " + error.message, "error");
    }
  };

  const updateFocusMode = async () => {
    try {
      document.body.classList.toggle("youtube-focus-mode", isFocused);
      updateButtonState();
      await chrome.storage.local.set({ focusMode: isFocused });

      // Auto-toggle fullscreen when focus mode changes
      await toggleFullscreen(isFocused);

      // Debug: Log video player elements
      if (isFocused) {
        const videoPlayer = document.querySelector("#movie_player");
        const videoElement = document.querySelector("video");
        log(
          `Video player found: ${!!videoPlayer}, Video element found: ${!!videoElement}`
        );
        log("Focus mode enabled with auto-fullscreen");
      } else {
        log("Focus mode disabled, exiting fullscreen");
      }
    } catch (error) {
      log("Failed to update focus mode: " + error.message, "error");
      throw error;
    }
  };

  const updateButtonState = () => {
    if (focusButton) {
      focusButton.innerHTML = isFocused ? "❌ Exit Focus" : "🎯 Focus Mode";
      focusButton.style.backgroundColor = isFocused ? "#cc0000" : "#ff0000";
    }
  };

  const loadSavedState = async () => {
    try {
      const result = await chrome.storage.local.get(["focusMode"]);
      if (result.focusMode) {
        isFocused = true;
        document.body.classList.add("youtube-focus-mode");
        updateButtonState();

        // Also restore fullscreen if focus mode was saved
        await toggleFullscreen(true);

        log("Restored previous focus mode state with fullscreen");
      }
    } catch (error) {
      log("Failed to load saved state: " + error.message, "error");
    }
  };

  const cleanup = () => {
    if (focusButton && focusButton.parentNode) {
      focusButton.remove();
      focusButton = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    // Remove fullscreen event listeners
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.removeEventListener(
      "webkitfullscreenchange",
      handleFullscreenChange
    );
    document.removeEventListener("mozfullscreenchange", handleFullscreenChange);

    isInitialized = false;
    log("Cleaned up extension resources");
  };

  // Listen for messages from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
      if (request.action === "toggleFocus") {
        handleFocusToggle()
          .then(() => {
            sendResponse({ isFocused });
          })
          .catch((error) => {
            log("Message handler error: " + error.message, "error");
            sendResponse({ error: error.message });
          });
        return true; // Keep message channel open for async response
      }

      if (request.type === "NEW_VIDEO") {
        log("Received new video notification from background");
        // Small delay to let YouTube load
        setTimeout(() => {
          if (!isInitialized) {
            initializeOnYouTube();
          }
        }, 1500);
        sendResponse({ received: true });
      }
    } catch (error) {
      log("Message listener error: " + error.message, "error");
      sendResponse({ error: error.message });
    }
  });

  // Handle fullscreen changes (when user manually exits fullscreen)
  const handleFullscreenChange = () => {
    // If focus mode is on but user manually exited fullscreen, turn off focus mode
    if (isFocused && !document.fullscreenElement) {
      log("User manually exited fullscreen, disabling focus mode");
      isFocused = false;
      document.body.classList.remove("youtube-focus-mode");
      updateButtonState();
      chrome.storage.local.set({ focusMode: false }).catch((error) => {
        log("Failed to save focus mode state: " + error.message, "error");
      });
    }
  };

  // Initialize when YouTube video page is detected
  const initializeOnYouTube = async () => {
    if (isInitialized) {
      log("Already initialized, skipping");
      return;
    }

    if (window.location.href.includes("youtube.com/watch")) {
      log("Initializing on YouTube video page");
      isInitialized = true;
      await loadSavedState();
      await createFloatingButton();

      // Listen for fullscreen changes
      document.addEventListener("fullscreenchange", handleFullscreenChange, {
        passive: true,
      });
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
        { passive: true }
      );
      document.addEventListener("mozfullscreenchange", handleFullscreenChange, {
        passive: true,
      });
    }
  };

  // Watch for navigation changes (YouTube is SPA) with throttling
  const watchForNavigation = () => {
    let currentUrl = window.location.href;

    const handleNavigation = throttle(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;

        if (currentUrl.includes("youtube.com/watch")) {
          // New video loaded, reinitialize
          log("New video detected, reinitializing");
          cleanup();
          setTimeout(initializeOnYouTube, 1000); // Small delay for YouTube to load
        } else {
          // Not on video page, cleanup
          log("Left video page, cleaning up");
          cleanup();
        }
      }
    }, 500); // Throttle to 500ms

    observer = new MutationObserver(handleNavigation);

    observer.observe(document.body, {
      childList: true,
      subtree: false, // Reduced scope for better performance
    });
  };

  // Improved initialization with better timing
  const startExtension = () => {
    log("Starting extension initialization");

    // Check if we're on a YouTube video page
    if (window.location.href.includes("youtube.com/watch")) {
      initializeOnYouTube();
    }

    // Always watch for navigation
    watchForNavigation();
  };

  // Start initialization with proper timing
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startExtension, {
      passive: true,
    });
  } else {
    // DOM already ready, start with a small delay to ensure YouTube is loaded
    setTimeout(startExtension, 500);
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", cleanup, { passive: true });

  log("Extension script loaded successfully");
})();
