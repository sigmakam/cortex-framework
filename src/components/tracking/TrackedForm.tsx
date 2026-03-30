"use client";

import type { ReactNode, FormHTMLAttributes } from "react";
import { useFormTracking } from "@/hooks/datalayer/useFormTracking";

interface FormSubmitResult {
  success: boolean;
  errors?: { field: string; message: string }[];
}

interface TrackedFormProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  /** Human-readable form name, e.g. "contact_form" */
  formName: string;
  /** Event suffix for form_sent_*, e.g. "contact" → form_sent_contact */
  eventSuffix: string;
  /** Page section where form is located */
  section: string;
  /** Submit handler — must return success/errors. form_sent fires ONLY on success. */
  onSubmit: (
    data: FormData,
  ) => Promise<FormSubmitResult>;
  children: ReactNode;
}

/**
 * Form wrapper with automatic funnel tracking:
 *   focus first field → form_start
 *   click submit      → form_submit
 *   server success    → form_sent_*
 *   validation errors → form_error (per field)
 *
 * CRITICAL: form_sent_* fires ONLY after onSubmit returns { success: true }.
 */
export function TrackedForm({
  formName,
  eventSuffix,
  section,
  onSubmit,
  children,
  ...props
}: TrackedFormProps) {
  const tracking = useFormTracking(formName, section);

  const handleFocus = () => tracking.trackStart();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    tracking.trackSubmit();

    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);

    if (result.success) {
      tracking.trackSent(eventSuffix);
    } else if (result.errors) {
      for (const err of result.errors) {
        tracking.trackError(err.message, err.field);
      }
    }
  };

  return (
    <form {...props} onSubmit={handleSubmit} onFocus={handleFocus}>
      {children}
    </form>
  );
}
