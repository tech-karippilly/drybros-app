import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, id, ...props }, ref) => {
        const uniqueId = React.useId();
        // Generate a unique ID if one isn't provided but a label is present
        const elementId = id || (label ? `checkbox-${uniqueId}` : undefined);

        return (
            <div className="flex items-center space-x-2">
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        id={elementId}
                        ref={ref}
                        className={cn(
                            "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-theme-blue checked:border-theme-blue appearance-none dark:border-gray-600 dark:bg-gray-950",
                            className
                        )}
                        {...props}
                    />
                    <Check className="absolute top-0 left-0 h-4 w-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100" strokeWidth={3} />
                </div>

                {label && (
                    <label
                        htmlFor={elementId}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
                    >
                        {label}
                    </label>
                )}
            </div>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
