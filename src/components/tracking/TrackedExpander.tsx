"use client";

import { useState, type ReactNode } from "react";
import { useButtonTracking } from "@/hooks/datalayer/useButtonTracking";

interface TrackedExpanderProps {
  /** Title of the accordion item (used as tracking name) */
  title: string;
  /** Page section, e.g. "faq", "product" */
  section: string;
  children: ReactNode;
  /** Optional: control open state externally */
  defaultOpen?: boolean;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

/**
 * Accordion/expander component with automatic show_expander tracking.
 * Fires ONLY on expand, NOT on collapse.
 */
export function TrackedExpander({
  title,
  section,
  children,
  defaultOpen = false,
  className,
  titleClassName,
  contentClassName,
}: TrackedExpanderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { trackExpander } = useButtonTracking();

  const toggle = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen) {
      trackExpander(title, section);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        className={titleClassName}
        aria-expanded={isOpen}
      >
        {title}
      </button>
      {isOpen && <div className={contentClassName}>{children}</div>}
    </div>
  );
}
