import React from "react";
import { Link } from "react-router-dom";
import { cn } from "./cn";
import Spinner from "./Spinner";

const VARIANTS = {
  primary: "btn-primary",
  secondary: "",
  accent: "btn-accent",
  lagoon: "btn-lagoon",
  danger: "btn-danger",
  ghost: "btn-ghost",
};

const SIZES = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

/**
 * The single button in the product.
 *
 * Renders a `<button>`, a router `<Link>` (`to`) or an `<a>` (`href`) while
 * keeping one set of visuals, so a call to action looks the same whether it
 * navigates or submits.
 */
const Button = React.forwardRef(function Button(
  {
    variant = "secondary",
    size = "md",
    block = false,
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    to,
    href,
    type = "button",
    className = "",
    children,
    ...rest
  },
  ref
) {
  const iconOnly = !children && (Icon || IconRight);

  const classes = cn(
    "btn",
    VARIANTS[variant] ?? "",
    SIZES[size] ?? "",
    block && "btn-block",
    iconOnly && (size === "sm" ? "btn-icon-sm" : "btn-icon"),
    className
  );

  const iconSize = size === "sm" ? 15 : size === "lg" ? 19 : 17;

  const content = (
    <>
      {loading ? (
        <Spinner size={size === "lg" ? "lg" : "sm"} />
      ) : (
        Icon && <Icon size={iconSize} strokeWidth={2.1} aria-hidden="true" />
      )}
      {children}
      {IconRight && !loading && (
        <IconRight size={iconSize} strokeWidth={2.1} aria-hidden="true" />
      )}
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !disabled && !loading) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});

export default Button;

/**
 * Icon-only control. `label` is mandatory because there is no visible text to
 * announce.
 */
export const IconButton = React.forwardRef(function IconButton(
  { icon: Icon, label, size = "md", className = "", ...rest },
  ref
) {
  return (
    <Button
      ref={ref}
      size={size}
      icon={Icon}
      aria-label={label}
      title={label}
      className={className}
      {...rest}
    />
  );
});
