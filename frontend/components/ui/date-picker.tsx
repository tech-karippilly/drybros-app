"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "./calendar"

export interface DatePickerProps {
    date?: Date
    setDate: (date: Date) => void
    placeholder?: string
    className?: string
}

const DatePicker = ({ date, setDate, placeholder = "Pick a date", className }: DatePickerProps) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleSelect = (newDate: Date) => {
        setDate(newDate)
        setIsOpen(false)
    }

    return (
        <div className={cn("relative w-full", className)} ref={ref}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-10 w-full items-center justify-start rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-theme-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950",
                    !date && "text-gray-500"
                )}
            >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>{placeholder}</span>}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-2">
                    <Calendar
                        value={date}
                        onChange={handleSelect}
                        className="rounded-md border bg-background"
                    />
                </div>
            )}
        </div>
    )
}

export { DatePicker }
