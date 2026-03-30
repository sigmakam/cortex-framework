"use client";

import { useEffect, useCallback } from "react";
import { useDataLayer } from "@/components/DataLayerProvider";

const COOKIE_TTL_YEARS = 1;

function hasCookie(name: string): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(name + "="));
}

function setCookie(name: string): void {
  const d = new Date();
  d.setFullYear(d.getFullYear() + COOKIE_TTL_YEARS);
  document.cookie = `${name}=1; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Hook for tracking page engagement events.
 *
 * Auto-fires timed events (page_view_1s, 2s, 30s, 120s) on mount.
 * Each event fires ONCE per user (cookie-guarded, 1 year TTL).
 *
 * Manual methods:
 * - trackContactPageView() — call on /contact page
 * - trackPageCount() — call on every navigation to count pages visited
 */
export function useEngagement() {
  const { pushEvent } = useDataLayer();

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const schedule = (
      ms: number,
      cookieName: string,
      eventName: string,
    ) => {
      timers.push(
        setTimeout(() => {
          if (!hasCookie(cookieName)) {
            pushEvent({ event: eventName });
            setCookie(cookieName);
          }
        }, ms),
      );
    };

    schedule(1_000, "cortex_pv_1s", "page_view_1s");
    schedule(2_000, "cortex_pv_2s", "page_view_2s");
    schedule(30_000, "cortex_pv_30s", "page_view_30s");
    schedule(120_000, "cortex_pv_120s", "page_view_120s");

    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [pushEvent]);

  const trackContactPageView = useCallback((): void => {
    if (!hasCookie("cortex_pv_contact")) {
      pushEvent({ event: "page_view_contact" });
      setCookie("cortex_pv_contact");
    }
  }, [pushEvent]);

  const trackPageCount = useCallback((): void => {
    if (typeof sessionStorage === "undefined") return;
    const count =
      parseInt(sessionStorage.getItem("cortex_page_count") || "0") + 1;
    sessionStorage.setItem("cortex_page_count", String(count));

    if (count >= 5 && !hasCookie("cortex_pv_count5")) {
      pushEvent({ event: "page_view_count_5" });
      setCookie("cortex_pv_count5");
    }
  }, [pushEvent]);

  return { trackContactPageView, trackPageCount };
}
