# YouTube Focus Mode Extension

A Chrome extension that helps you focus on YouTube videos by hiding distractions and providing a clean viewing experience.

## Recent Fixes (Latest Update)

### 🔧 Performance Improvements
- **Fixed non-passive event listeners**: Added `{ passive: true }` to all event listeners to eliminate console warnings
- **Added throttling**: Implemented throttling for navigation detection and tab updates to reduce CPU usage
- **Optimized CSS**: Added `will-change` properties and hardware acceleration for smoother animations
- **Reduced DOM observation scope**: Limited MutationObserver to only necessary elements

### 🐛 Bug Fixes
- **Prevented duplicate buttons**: Added better duplicate detection and state management
- **Improved initialization timing**: Added proper delays and checks to ensure YouTube is fully loaded
- **Enhanced error handling**: Better error recovery and state management
- **Console noise filtering**: Added filtering for YouTube's internal errors and warnings

### 🚀 Features
- **Focus Mode Toggle**: Click the floating button to hide all distractions
- **State Persistence**: Remembers your focus mode preference across page reloads
- **Responsive Design**: Works on desktop and mobile YouTube
- **Clean Fullscreen**: Shows only the video player when focus mode is active

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this folder
4. Navigate to any YouTube video page
5. Click the "🎯 Focus Mode" button to toggle focus mode

## How It Works (Simple Explanation)

Think of this extension like a magic remote control for YouTube:

1. **The Button**: A red button appears on YouTube video pages
2. **Focus Mode**: Click it to hide everything except the video (like comments, suggestions, etc.)
3. **Exit Focus**: Click again to bring everything back
4. **Memory**: It remembers if you had focus mode on when you reload the page

## Files Structure

- `manifest.json` - Extension configuration
- `contentScript.js` - Main logic that runs on YouTube pages
- `background.js` - Background service worker
- `styles.css` - Styling for focus mode and button

## Technical Details

- Uses Manifest V3 for modern Chrome extensions
- Implements passive event listeners for better performance
- Uses throttling and debouncing for optimal resource usage
- Hardware-accelerated CSS animations for smooth interactions
