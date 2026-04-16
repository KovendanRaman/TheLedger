import {
  setDate,
  addMonths,
  subMonths,
  endOfMonth,
  startOfDay,
  endOfDay,
} from "date-fns";

/**
 * Returns the start and end Date of the current billing cycle.
 *
 * @param currentDate  - The reference date (usually today)
 * @param resetDay     - The day of month the cycle resets (1–28)
 *
 * Logic:
 *   If today >= resetDay  → cycle started THIS month on resetDay,
 *                           ends NEXT month on (resetDay − 1), or end of this month if resetDay = 1.
 *   If today <  resetDay  → cycle started LAST month on resetDay,
 *                           ends THIS month on (resetDay − 1).
 */
export function getBillingCycle(
  currentDate: Date,
  resetDay: number
): { startDate: Date; endDate: Date } {
  const day = currentDate.getDate();

  if (day >= resetDay) {
    // Cycle started this month
    const startDate = startOfDay(setDate(currentDate, resetDay));
    const endDate =
      resetDay === 1
        ? endOfDay(endOfMonth(currentDate))
        : endOfDay(setDate(addMonths(currentDate, 1), resetDay - 1));
    return { startDate, endDate };
  } else {
    // Cycle started last month
    const lastMonth = subMonths(currentDate, 1);
    const startDate = startOfDay(setDate(lastMonth, resetDay));
    const endDate =
      resetDay === 1
        ? endOfDay(endOfMonth(lastMonth))
        : endOfDay(setDate(currentDate, resetDay - 1));
    return { startDate, endDate };
  }
}
