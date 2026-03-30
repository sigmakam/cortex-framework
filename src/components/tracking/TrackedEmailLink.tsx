"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useContactTracking } from "@/hooks/datalayer/useContactTracking";

interface TrackedEmailLinkProps {
  email: string;
  section: string;
  children: ReactNode;
  className?: string;
}

/**
 * <a href="mailto:"> with automatic email_click and email_copy tracking.
 * Email is anonymized (only local part before @) before pushing to dataLayer.
 */
export function TrackedEmailLink({
  email,
  section,
  children,
  className,
}: TrackedEmailLinkProps) {
  const { trackEmailClick, trackEmailCopy } = useContactTracking();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => trackEmailCopy(email, section);
    el.addEventListener("copy", handler);
    return () => el.removeEventListener("copy", handler);
  }, [email, section, trackEmailCopy]);

  return (
    <a
      ref={ref}
      href={`mailto:${email}`}
      className={className}
      onClick={() => trackEmailClick(email, section)}
    >
      {children}
    </a>
  );
}
