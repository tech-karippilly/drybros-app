export const BUTTON_VARIANTS = {
    primary: "bg-theme-blue text-white hover:bg-theme-blue/90 shadow-sm",
    secondary: "bg-theme-orange text-white hover:bg-theme-orange/90 shadow-sm",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-foreground dark:border-gray-700 dark:hover:bg-gray-800",
    ghost: "bg-transparent hover:bg-gray-100 text-foreground dark:hover:bg-gray-800",
    danger: "bg-theme-red text-white hover:bg-theme-red/90 shadow-sm",
} as const;

export const BUTTON_SIZES = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-12 px-8 text-base",
    icon: "h-10 w-10",
} as const;

export const TEXT_STYLES = {
    h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground",
    h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 text-foreground",
    h3: "scroll-m-20 text-2xl font-semibold tracking-tight text-foreground",
    subheading: "text-xl font-medium text-foreground/90",
    regular: "leading-7 [&:not(:first-child)]:mt-6 text-foreground",
    label: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/90",
    error: "text-sm font-medium text-theme-red dark:text-theme-red",
    small: "text-sm font-medium leading-none text-foreground",
    muted: "text-sm text-gray-500",
} as const;
