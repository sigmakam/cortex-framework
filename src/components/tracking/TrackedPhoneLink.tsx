"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useContactTracking } from "@/hooks/datalayer/useContactTracking";

interface TrackedPhoneLinkProps {
  phone: string;
  section: string;
  children: ReactNode;
  className?: string;
}

/**
 * <a href="tel:"> with automatic phone_click and phone_copy tracking.
 * Phone number is anonymized before being pushed to dataLayer.
 */
export function TrackedPhoneLink({
  phone,
  section,
  children,
  className,
}: TrackedPhoneLinkProps) {
  const { trackPhoneClick, trackPhoneCopy } = useContactTracking();
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => trackPhoneCopy(phone, section);
    el.addEventListener("copy", handler);
    return () => el.removeEventListener("copy", handler);
  }, [phone, section, trackPhoneCopy]);

  return (
    <a
      ref={ref}
      href={`tel:${phone.replace(/\s/g, "")}`}
      className={className}
      onClick={() => trackPhoneClick(phone, section)}
    >
      {children}
    </a>
  );
}
