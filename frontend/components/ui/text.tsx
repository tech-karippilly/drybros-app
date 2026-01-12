import React from 'react';
import { cn } from '@/lib/utils';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'subheading' | 'label' | 'error' | 'regular' | 'small' | 'muted';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
    variant?: TextVariant;
    as?: React.ElementType;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
    ({ className, variant = 'regular', as, children, ...props }, ref) => {

        // Determine the default element based on the variant
        const Component = as || (
            variant === 'h1' ? 'h1' :
                variant === 'h2' ? 'h2' :
                    variant === 'h3' ? 'h3' :
                        variant === 'subheading' ? 'h4' :
                            variant === 'label' ? 'label' :
                                'p'
        );

        const styles = {
            h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground",
            h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 text-foreground",
            h3: "scroll-m-20 text-2xl font-semibold tracking-tight text-foreground",
            subheading: "text-xl font-medium text-foreground/90",
            regular: "leading-7 [&:not(:first-child)]:mt-6 text-foreground",
            label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/90",
            error: "text-sm font-medium text-theme-red dark:text-theme-red",
            small: "text-sm font-medium leading-none text-foreground",
            muted: "text-sm text-gray-500",
        };

        return (
            <Component
                ref={ref}
                className={cn(styles[variant], className)}
                {...props}
            >
                {children}
            </Component>
        );
    }
);
Text.displayName = "Text";

export { Text };
