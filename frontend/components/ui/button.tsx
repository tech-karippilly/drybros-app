import * as React from "react"
import { cn, FOCUS_RING } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            primary: "bg-theme-blue text-white hover:bg-theme-blue/90 shadow-sm",
            secondary: "bg-theme-orange text-white hover:bg-theme-orange/90 shadow-sm",
            outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-foreground dark:border-gray-700 dark:hover:bg-gray-800",
            ghost: "bg-transparent hover:bg-gray-100 text-foreground dark:hover:bg-gray-800",
            danger: "bg-theme-red text-white hover:bg-theme-red/90 shadow-sm",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2 text-sm",
            lg: "h-12 px-8 text-base",
            icon: "h-10 w-10",
        };

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    FOCUS_RING,
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
