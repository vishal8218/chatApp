import { useEffect } from "react";

/**
 * useBadge — Sets the PWA app-icon badge count using the Web App Badging API.
 *
 * @param {number} count  Number to show on the installed PWA app icon.
 *                        Pass 0 to clear the badge.
 *
 * Supported on: Chrome 81+, Edge 81+, Samsung Internet 15+
 * (Android, Windows, macOS when installed as a PWA)
 * Gracefully no-ops on unsupported browsers.
 */
const useBadge = (count) => {
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return; // API not supported

    if (count > 0) {
      navigator.setAppBadge(count).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }

    // Clear badge when component unmounts (e.g. logout)
    return () => {
      navigator.clearAppBadge().catch(() => {});
    };
  }, [count]);
};

export default useBadge;
