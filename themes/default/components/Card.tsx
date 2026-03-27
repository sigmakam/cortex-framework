import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingStyles: Record<NonNullable<CardProps["padding"]>, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={`
        border border-gray-200
        ${paddingStyles[padding]}
        ${hover ? "transition-shadow duration-200 ease-in-out hover:shadow-lg cursor-pointer" : ""}
        ${className}
      `.trim()}
      style={{
        backgroundColor: "var(--color-background)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}
