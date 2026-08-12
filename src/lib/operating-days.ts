export interface DayOfWeek {
  id: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  label: string;
  short: string;
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  { id: 0, label: "Sunday", short: "Sun" },
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
];

export const DEFAULT_OPEN_DAYS: number[] = [1, 2, 3, 4, 5, 6]; // Monday to Saturday open by default

export function getOpenDays(operatingHours: unknown): number[] {
  if (!operatingHours) return DEFAULT_OPEN_DAYS;

  let days: number[] = [];

  if (typeof operatingHours === "object" && operatingHours !== null) {
    const obj = operatingHours as { openDays?: unknown };
    if (Array.isArray(obj.openDays)) {
      days = obj.openDays.filter(
        (d): d is number => typeof d === "number" && d >= 0 && d <= 6,
      );
    } else if (Array.isArray(operatingHours)) {
      days = (operatingHours as unknown[]).filter(
        (d): d is number => typeof d === "number" && d >= 0 && d <= 6,
      );
    }
  }

  return days.length > 0 ? days : DEFAULT_OPEN_DAYS;
}

export function isDayOpen(
  dateInput: Date | string,
  openDays: number[],
): boolean {
  let dayNum: number;
  if (typeof dateInput === "string") {
    // Treat YYYY-MM-DD strings consistently to avoid timezone shifts
    const parts = dateInput.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      dayNum = new Date(year, month, day).getDay();
    } else {
      dayNum = new Date(dateInput).getDay();
    }
  } else {
    dayNum = dateInput.getDay();
  }

  return openDays.includes(dayNum);
}

export function getDayName(dayIndex: number): string {
  const match = DAYS_OF_WEEK.find((d) => d.id === dayIndex);
  return match ? match.label : "";
}
