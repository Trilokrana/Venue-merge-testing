export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return ""

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date))
  } catch (_err) {
    return ""
  }
}
export function formatDateTime(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return ""
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
      hour: opts.hour ?? "numeric",
      minute: opts.minute ?? "numeric",
      second: opts.second ?? "numeric",
    }).format(new Date(date))
  } catch (_err) {
    return ""
  }
}

export function formatTime(time: string) {
  if (!time) return ""

  const [hourStr, minute] = time.split(":")
  let hour = parseInt(hourStr)

  const ampm = hour >= 12 ? "PM" : "AM"
  hour = hour % 12 || 12

  return `${hour}:${minute}${ampm}`
}

export function to24Hour(time?: string) {
  if (!time) return ""

  const match = time.match(/(\d+):(\d+)(AM|PM)/)
  if (!match) return ""

  const [_, h, m, period] = match
  let hour = parseInt(h)

  if (period === "PM" && hour !== 12) hour += 12
  if (period === "AM" && hour === 12) hour = 0

  return `${hour.toString().padStart(2, "0")}:${m}`
}

export function togglePeriod(time: string) {
  if (time.includes("AM")) {
    return time.replace("AM", "PM")
  }

  if (time.includes("PM")) {
    return time.replace("PM", "AM")
  }

  return time
}

export function formatCurrencyINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

type FormatCurrencyOptions = {
  locale?: string
  currency?: string
} & Intl.NumberFormatOptions

export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
) {
  const {
    locale = "en-US",
    currency = "USD",
    ...rest
  } = options

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...rest,
  }).format(amount)
}

export function capitalizeFirstLetter(input: string): string {
  if (!input) return ""

  return input
    .split(/[_\-\s]+/) // split on underscores, hyphens, or whitespace
    .filter(Boolean) // drop empty segments from consecutive separators
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export const getDayRange = (timestamp: string) => {
  const start = new Date(parseInt(timestamp))
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export const getDayRangeUTC = (date: Date) => {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}
