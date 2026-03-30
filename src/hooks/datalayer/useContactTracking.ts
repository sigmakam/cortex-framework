"use client";

import { useDataLayer } from "@/components/DataLayerProvider";
import { anonymizePhone, anonymizeEmail } from "@/core/datalayer/anonymize";

/**
 * Hook for tracking contact interactions: phone clicks/copies, email clicks/copies.
 * Automatically anonymizes phone numbers and emails before pushing to dataLayer.
 */
export function useContactTracking() {
  const { pushEvent } = useDataLayer();

  return {
    /** Track click on <a href="tel:..."> */
    trackPhoneClick(phone: string, section: string): void {
      pushEvent({
        event: "phone_click",
        phone_number: anonymizePhone(phone),
        section,
      });
    },

    /** Track copy event on an element containing a phone number */
    trackPhoneCopy(phone: string, section: string): void {
      pushEvent({
        event: "phone_copy",
        phone_number: anonymizePhone(phone),
        section,
      });
    },

    /** Track click on <a href="mailto:..."> */
    trackEmailClick(email: string, section: string): void {
      pushEvent({
        event: "email_click",
        email: anonymizeEmail(email),
        section,
      });
    },

    /** Track copy event on an element containing an email address */
    trackEmailCopy(email: string, section: string): void {
      pushEvent({
        event: "email_copy",
        email: anonymizeEmail(email),
        section,
      });
    },
  };
}
