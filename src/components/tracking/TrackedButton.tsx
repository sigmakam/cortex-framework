"use client";

import type { ReactNode, ButtonHTMLAttributes } from "react";
import { useButtonTracking } from "@/hooks/datalayer/useButtonTracking";

interface TrackedButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button name for analytics, e.g. "umow_wizyte" */
  trackingName: string;
  /** Page section, e.g. "hero", "header", "footer" */
  section: string;
  children: ReactNode;
}

/**
 * <button> with automatic button_click tracking.
 * Do NOT use for form submit buttons — use TrackedForm instead.
 */
export function TrackedButton({
  trackingName,
  section,
  children,
  onClick,
  ...props
}: TrackedButtonProps) {
  const { trackButtonClick } = useButtonTracking();

  return (
    <button
      {...props}
      onClick={(e) => {
        trackButtonClick(trackingName, section);
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
