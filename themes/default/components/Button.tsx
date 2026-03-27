import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonBaseProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

interface ButtonAsButtonProps extends ButtonBaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> {
  href?: undefined;
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  href: string;
  target?: string;
  rel?: string;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const baseStyles =
  "inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variantStyles: Record<NonNullable<ButtonBaseProps["variant"]>, string> = {
  primary:
    "text-white shadow-sm hover:opacity-90 active:opacity-95",
  secondary:
    "text-white shadow-sm hover:opacity-90 active:opacity-95",
  outline:
    "border-2 bg-transparent hover:bg-gray-50 active:bg-gray-100",
  ghost:
    "bg-transparent hover:bg-gray-100 active:bg-gray-200",
};

const sizeStyles: Record<NonNullable<ButtonBaseProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-7 py-3.5 text-base gap-2.5",
};

function getVariantInlineStyles(variant: NonNullable<ButtonBaseProps["variant"]>): React.CSSProperties {
  switch (variant) {
    case "primary":
      return {
        backgroundColor: "var(--color-primary)",
        borderRadius: "var(--radius-md)",
        focusRingColor: "var(--color-primary)",
      } as React.CSSProperties;
    case "secondary":
      return {
        backgroundColor: "var(--color-secondary)",
        borderRadius: "var(--radius-md)",
      } as React.CSSProperties;
    case "outline":
      return {
        borderColor: "var(--color-primary)",
        color: "var(--color-primary)",
        borderRadius: "var(--radius-md)",
      } as React.CSSProperties;
    case "ghost":
      return {
        color: "var(--color-text)",
        borderRadius: "var(--radius-md)",
      } as React.CSSProperties;
  }
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}: ButtonProps) {
  const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  const inlineStyles = getVariantInlineStyles(variant);

  if ("href" in props && props.href) {
    const { href, target, rel, ...rest } = props as ButtonAsLinkProps;
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : rel}
        className={classes}
        style={inlineStyles}
        aria-disabled={disabled || undefined}
        {...rest}
      >
        {children}
      </a>
    );
  }

  const { ...buttonProps } = props as ButtonAsButtonProps;
  return (
    <button
      className={classes}
      style={inlineStyles}
      disabled={disabled}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
