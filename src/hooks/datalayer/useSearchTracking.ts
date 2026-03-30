"use client";

import { useDataLayer } from "@/components/DataLayerProvider";

/**
 * Hook for tracking internal site search.
 */
export function useSearchTracking() {
  const { pushEvent } = useDataLayer();

  return {
    /** Track search query submitted by user */
    trackSearch(searchTerm: string): void {
      if (!searchTerm.trim()) return;
      pushEvent({
        event: "search",
        search_term: searchTerm.trim(),
      });
    },
  };
}
