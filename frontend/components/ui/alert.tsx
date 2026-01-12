import * as React from "react"
import { cn } from "@/lib/utils"
// import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react" 
// (Not importing icons directly to keep component flexible, but logic can be added easily)

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'success' | 'warning' | 'error' | 'info';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = 'info', children, ...props }, ref) => {

        // Base styles
        const baseStyles = "relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7";

        // Variant styles
        const styles = {
            success: "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10",
            warning: "border-theme-orange/50 text-theme-orange dark:border-theme-orange [&>svg]:text-theme-orange bg-theme-orange/10",
            error: "border-theme-red/50 text-theme-red dark:border-theme-red/50 [&>svg]:text-theme-red bg-theme-red/10",
            info: "border-theme-blue/50 text-theme-blue dark:border-theme-blue [&>svg]:text-theme-blue bg-theme-blue/10",
        };

        return (
            <div
                ref={ref}
                role="alert"
                className={cn(baseStyles, styles[variant], className)}
                {...props}
            >
                {children}
            </div>
        )
    }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none tracking-tight", className)}
        {...props}
    />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed", className)}
        {...props}
    />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
