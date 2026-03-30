"use client";

import { useEffect } from "react";
import { useEngagement } from "@/hooks/datalayer/useEngagement";

interface EngagementTrackerProps {
  /** Set to true if this is the /contact page */
  isContactPage?: boolean;
  /** Set to true to track page count for page_view_count_5 */
  trackPageViews?: boolean;
}

/**
 * Mount-and-forget component that activates engagement tracking.
 *
 * On mount:
 * - Auto-starts timed page_view events (1s, 2s, 30s, 120s) via useEngagement
 * - If isContactPage=true, fires page_view_contact
 * - If trackPageViews=true, increments page counter for page_view_count_5
 *
 * Place in layout or page — renders nothing.
 */
export function EngagementTracker({
  isContactPage = false,
  trackPageViews = true,
}: EngagementTrackerProps) {
  const { trackContactPageView, trackPageCount } = useEngagement();

  useEffect(() => {
    if (isContactPage) {
      trackContactPageView();
    }
  }, [isContactPage, trackContactPageView]);

  useEffect(() => {
    if (trackPageViews) {
      trackPageCount();
    }
  }, [trackPageViews, trackPageCount]);

  return null;
}
