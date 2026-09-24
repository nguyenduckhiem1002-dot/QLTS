export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

export function dateLocaleOf(locale: string) {
  return locale === "vi" ? "vi-VN" : "en-US";
}

// "2 giờ trước" / "2 hours ago", falling back to a date after a week.
export function relativeTime(date: Date, locale: string, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const format = new Intl.RelativeTimeFormat(dateLocaleOf(locale), { numeric: "auto" });
  if (abs < 60) return format.format(0, "minute");
  if (abs < 3600) return format.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return format.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return format.format(Math.round(seconds / 86_400), "day");
  return new Intl.DateTimeFormat(dateLocaleOf(locale), { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

// "1,11 tỷ đ" / "845 triệu đ" in Vietnamese; compact notation otherwise.
export function formatMoneyShort(value: number, locale: string) {
  const number = (digits: number) =>
    new Intl.NumberFormat(dateLocaleOf(locale), { maximumFractionDigits: digits });
  if (locale !== "vi") {
    return `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value)} VND`;
  }
  if (value >= 1e9) return `${number(2).format(value / 1e9)} tỷ đ`;
  if (value >= 1e6) return `${number(1).format(value / 1e6)} triệu đ`;
  return `${number(0).format(value)} đ`;
}
