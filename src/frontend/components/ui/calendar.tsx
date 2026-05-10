"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/backend/lib/utils"
import { buttonVariants } from "@/frontend/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white dark:bg-[#1a1a2e] rounded-2xl relative", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-8 sm:space-y-0",
        month: "space-y-6 relative",
        month_caption: "flex justify-center pt-1 items-center mb-4",
        caption_label: "text-sm font-bold text-foreground",
        nav: "flex items-center justify-between absolute inset-x-0 top-0 h-9 px-1 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 border-border/50 dark:border-white/10 rounded-xl transition-all pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 border-border/50 dark:border-white/10 rounded-xl transition-all pointer-events-auto"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between mb-2",
        weekday: "text-muted-foreground w-10 font-bold text-[0.7rem] uppercase tracking-wider text-center",
        week: "flex w-full mt-1 justify-between",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-medium aria-selected:opacity-100 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all text-center flex items-center justify-center"
        ),
        range_start: "day-range-start bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-l-2xl rounded-r-none",
        range_end: "day-range-end bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-r-2xl rounded-l-none",
        range_middle: "aria-selected:bg-primary/10 aria-selected:text-primary rounded-none",
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "text-primary font-bold underline underline-offset-4 decoration-2",
        outside: "text-muted-foreground opacity-30",
        disabled: "text-muted-foreground opacity-20",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") return <ChevronLeft className="h-4 w-4" />
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
