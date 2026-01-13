import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek,
    subMonths
} from "date-fns"
import { cn } from "@/lib/utils"

export interface CalendarProps {
    className?: string
    value?: Date
    onChange?: (date: Date) => void
}

const Calendar = ({ className, value, onChange }: CalendarProps) => {
    const [currentMonth, setCurrentMonth] = React.useState(new Date())
    const selectedDate = value

    const onPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const onNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    })

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
        <div className={cn("p-3 w-fit border rounded-md bg-background shadow-md", className)}>
            <div className="flex items-center justify-between space-x-4 pb-4">
                <h4 className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</h4>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={onPreviousMonth}
                        className={cn(
                            "h-7 w-7 bg-transparent hover:bg-gray-100 p-0 opacity-50 hover:opacity-100 rounded-md flex items-center justify-center",
                            "dark:hover:bg-gray-800"
                        )}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onNextMonth}
                        className={cn(
                            "h-7 w-7 bg-transparent hover:bg-gray-100 p-0 opacity-50 hover:opacity-100 rounded-md flex items-center justify-center",
                            "dark:hover:bg-gray-800"
                        )}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                {weekDays.map((day) => (
                    <div key={day} className="text-gray-500 font-normal">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                    const isCurrentMonth = isSameMonth(day, currentMonth)

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => onChange?.(day)}
                            className={cn(
                                "h-9 w-9 p-0 font-normal text-sm rounded-md flex items-center justify-center transition-colors",
                                !isCurrentMonth && "text-gray-300 dark:text-gray-600 pointer-events-none",
                                isCurrentMonth && "text-foreground hover:bg-gray-100 dark:hover:bg-gray-800",
                                isSelected && "bg-theme-blue text-white hover:bg-theme-blue dark:bg-theme-blue dark:text-white",
                                isToday(day) && !isSelected && "text-theme-blue font-semibold bg-blue-50 dark:bg-blue-900/30",
                            )}
                        >
                            {format(day, "d")}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export { Calendar }
