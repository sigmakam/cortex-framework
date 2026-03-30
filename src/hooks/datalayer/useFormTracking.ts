"use client";

import { useRef } from "react";
import { useDataLayer } from "@/components/DataLayerProvider";

/**
 * Hook for tracking form funnel: form_start → form_submit → form_sent_* | form_error
 *
 * CRITICAL:
 * - form_sent_* is a CONVERSION event — push ONLY after HTTP 200 from server
 * - form_error — push separately for EACH validation error
 *
 * @param formName - Human-readable form name, e.g. "contact_form"
 * @param section - Page section where form is located
 */
export function useFormTracking(formName: string, section: string) {
  const { pushEvent } = useDataLayer();
  const hasStarted = useRef(false);

  return {
    /** Call on 'focus' of the first form field (once per form instance) */
    trackStart(): void {
      if (!hasStarted.current) {
        pushEvent({ event: "form_start", form_name: formName, section });
        hasStarted.current = true;
      }
    },

    /** Call when user clicks submit button (BEFORE validation) */
    trackSubmit(): void {
      pushEvent({ event: "form_submit", form_name: formName, section });
    },

    /**
     * Call ONLY after successful server response (HTTP 200).
     * @param suffix - Event name suffix, e.g. 'contact' → form_sent_contact
     */
    trackSent(suffix: string): void {
      pushEvent({
        event: `form_sent_${suffix}`,
        form_name: formName,
        section,
      });
    },

    /**
     * Call for EACH validation error separately.
     * @param errorType - Error message shown to user, e.g. "podaj adres email"
     * @param errorField - Field name, e.g. "email"
     */
    trackError(errorType: string, errorField: string): void {
      pushEvent({
        event: "form_error",
        form_name: formName,
        section,
        error_type: errorType,
        error_field: errorField,
      });
    },

    /** Reset start tracking — call when form is re-opened or re-mounted */
    reset(): void {
      hasStarted.current = false;
    },
  };
}
