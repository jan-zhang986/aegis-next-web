"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { DayPicker, useDayPicker } from "react-day-picker";
import { format, addYears } from "date-fns";
import { zhCN } from "date-fns/locale";

import { cn } from "@/utils/cn";
import { buttonVariants } from "./button";

type MonthCaptionProps = {
  calendarMonth: { date: Date };
  displayIndex: number;
} & React.HTMLAttributes<HTMLDivElement>;

/** 自定义月份标题：<< 上一年 | < 上一月 | 2026年 2月 | 下一月 > | 下一年 >> */
function MonthCaptionWithYearNav({
  calendarMonth,
  displayIndex,
  className,
  ...rest
}: MonthCaptionProps) {
  const { goToMonth, previousMonth, nextMonth, classNames } = useDayPicker();
  const caption = format(calendarMonth.date, "yyyy年 M月", { locale: zhCN });
  const navButtonClass = cn(
    buttonVariants({ variant: "outline" }),
    "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 shrink-0"
  );
  return (
    <div className={cn("flex justify-center pt-1 relative items-center w-full gap-1", className)} {...rest}>
      <button
        type="button"
        aria-label="上一年"
        className={navButtonClass}
        onClick={() => goToMonth(addYears(calendarMonth.date, -1))}
      >
        <ChevronsLeft className="size-4" />
      </button>
      <button
        type="button"
        aria-label="上一月"
        className={navButtonClass}
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm font-medium px-2 min-w-[7rem] text-center">
        {caption}
      </span>
      <button
        type="button"
        aria-label="下一月"
        className={navButtonClass}
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
      >
        <ChevronRight className="size-4" />
      </button>
      <button
        type="button"
        aria-label="下一年"
        className={navButtonClass}
        onClick={() => goToMonth(addYears(calendarMonth.date, 1))}
      >
        <ChevronsRight className="size-4" />
      </button>
    </div>
  );
}

type DayPickerProps = React.ComponentProps<typeof DayPicker>;

/** Calendar 组件 props：DayPicker 的 props + 可选 showYearNav */
export type CalendarProps = DayPickerProps & {
  /** 为 true 时显示 << >> 年切换与 < > 月切换，并隐藏默认单条 Nav */
  showYearNav?: boolean;
};

const Calendar = ({
  className,
  classNames,
  showOutsideDays = true,
  showYearNav = false,
  components: propsComponents,
  ...restProps
}: CalendarProps) => {
  const isRange = restProps.mode === "range";
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      hideNavigation={showYearNav}
      className={cn("p-3", className)}
      classNames={{
        // v9 keys
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday:
          "flex-1 min-w-0 flex justify-center items-center text-muted-foreground rounded-md font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: cn(
          "flex-1 min-w-0 flex justify-center items-center relative p-0 text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].range_end)]:rounded-r-md",
          isRange
            ? "[&:has(>.range_end)]:rounded-r-md [&:has(>.range_start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100 rounded-full",
        ),
        range_start:
          "range_start aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_end:
          "range_end aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected:
          "rounded-full bg-muted text-primary hover:bg-muted hover:text-primary focus:bg-muted focus:text-primary",
        today: "bg-accent text-accent-foreground",
        outside:
          "outside text-muted-foreground aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        ...(showYearNav ? { MonthCaption: MonthCaptionWithYearNav } : {}),
        ...(propsComponents ?? {}),
      } as any}
      {...(restProps as DayPickerProps)}
    />
  );
};

export { Calendar };

/** 带年月导航的日历（<< < 2026年 2月 > >>），用于实际时间等日期选择 */
export function CalendarWithYearNav(props: CalendarProps) {
  return <Calendar {...props} showYearNav />;
}
