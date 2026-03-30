"use client";

import { useDataLayer } from "@/components/DataLayerProvider";

/**
 * Hook for tracking UI interactions: button clicks and expander (accordion) opens.
 */
export function useButtonTracking() {
  const { pushEvent } = useDataLayer();

  return {
    /** Track CTA button click. Do NOT use for form submit buttons (use useFormTracking). */
    trackButtonClick(buttonName: string, section: string): void {
      pushEvent({
        event: "button_click",
        form_name: buttonName,
        section,
      });
    },

    /**
     * Track accordion/expander open.
     * Fire ONLY on expand, NOT on collapse.
     */
    trackExpander(expanderTitle: string, section: string): void {
      pushEvent({
        event: "show_expander",
        form_name: expanderTitle,
        section,
      });
    },
  };
}
