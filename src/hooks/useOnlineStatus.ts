"use client";

import { useCallback, useEffect, useState } from "react";

interface OnlineStatus {
  isOnline: boolean;
  lastOnline: Date | null;
}

/**
 * Tracks browser online/offline status reactively.
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  const goOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnline(new Date());
  }, []);

  const goOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    // Initialise with actual browser state
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      setLastOnline(new Date());
    }

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [goOnline, goOffline]);

  return { isOnline, lastOnline };
}
