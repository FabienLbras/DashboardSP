import type { ButtonHTMLAttributes, FC, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "danger" | "outline";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

const Button: FC<ButtonProps> = ({
  children,
  type = "button",
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  className = "",
  disabled = false,
  ...rest
}) => {
  const baseStyles = "rounded-lg font-medium transition-colors focus:outline-none";

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const variantStyles = {
    primary: "bg-brand-500 text-white hover:bg-brand-600",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-gray-300 text-gray-800 bg-transparent hover:bg-gray-100",
  };

  const disabledStyles =
    "opacity-50 cursor-not-allowed dark:opacity-40 dark:cursor-not-allowed";

  const classes = clsx(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    disabled && disabledStyles,
    className
  );

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};

export default Button;
