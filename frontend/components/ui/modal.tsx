import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
}

const Modal = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    className,
    ...props
}: ModalProps) => {

    // Close on Escape key
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in cursor-default p-4 sm:p-0">
            <div
                className={cn(
                    "relative grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg animate-in zoom-in-95 duration-200 dark:border-gray-800",
                    className
                )}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking inside
                {...props}
            >
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                    {title && <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>}
                    {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
                </div>

                <button
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>

                <div className="mt-2">
                    {children}
                </div>
            </div>

            {/* Background click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    )
}

export { Modal }
