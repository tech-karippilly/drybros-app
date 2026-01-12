import React from 'react';
import { cn } from '@/lib/utils';
import { TEXT_STYLES } from '@/lib/constants/ui';

export type TextVariant = keyof typeof TEXT_STYLES;

interface TextProps extends Omit<React.AllHTMLAttributes<HTMLElement>, 'as'> {
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

        return (
            <Component
                ref={ref}
                className={cn(TEXT_STYLES[variant], className)}
                {...props}
            >
                {children}
            </Component>
        );
    }
);
Text.displayName = "Text";

export { Text };
