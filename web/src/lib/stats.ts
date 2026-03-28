import type { HydrationEntry } from './types'

export type PeriodStat = {
  id: string
  label: string
  consumedMl: number
  targetMl: number
  sortKey: number
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Week starts Monday (local). */
function startOfWeekMonday(ts: number): Date {
  const d = new Date(ts)
  const day = d.getDay()
  const offset = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + offset)
  d.setHours(0, 0, 0, 0)
  return d
}

function weekId(weekStart: Date): string {
  return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function monthKeyFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Last `weekCount` weeks including the current week (Mon–Sun), newest first.
 * Target per week = 7 × daily plan.
 */
export function buildWeeklyStats(entries: HydrationEntry[], dailyPlanMl: number, weekCount: number): PeriodStat[] {
  const byWeek = new Map<string, number>()
  for (const e of entries) {
    const ws = startOfWeekMonday(e.ts)
    const id = weekId(ws)
    byWeek.set(id, (byWeek.get(id) ?? 0) + e.amountMl)
  }

  const now = new Date()
  const currentWeekStart = startOfWeekMonday(now.getTime())
  const out: PeriodStat[] = []

  for (let i = 0; i < weekCount; i++) {
    const ws = addDays(currentWeekStart, -i * 7)
    const id = weekId(ws)
    const consumedMl = byWeek.get(id) ?? 0
    const we = addDays(ws, 6)
    const label = `${formatShortDate(ws)} – ${formatShortDate(we)}`
    out.push({
      id,
      label,
      consumedMl,
      targetMl: dailyPlanMl * 7,
      sortKey: ws.getTime(),
    })
  }

  return out.sort((a, b) => b.sortKey - a.sortKey)
}

/**
 * Last `monthCount` calendar months including the current month, newest first.
 * Target = days in that month × daily plan.
 */
export function buildMonthlyStats(entries: HydrationEntry[], dailyPlanMl: number, monthCount: number): PeriodStat[] {
  const byMonth = new Map<string, number>()
  for (const e of entries) {
    const d = new Date(e.ts)
    const key = monthKeyFromDate(d)
    byMonth.set(key, (byMonth.get(key) ?? 0) + e.amountMl)
  }

  const now = new Date()
  const out: PeriodStat[] = []

  for (let i = 0; i < monthCount; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = monthKeyFromDate(d)
    const consumedMl = byMonth.get(key) ?? 0
    const dim = daysInMonth(d.getFullYear(), d.getMonth())
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    out.push({
      id: key,
      label,
      consumedMl,
      targetMl: dailyPlanMl * dim,
      sortKey: d.getTime(),
    })
  }

  return out.sort((a, b) => b.sortKey - a.sortKey)
}

export function pctOfTarget(consumedMl: number, targetMl: number) {
  if (targetMl <= 0) return 0
  return Math.min(100, (consumedMl / targetMl) * 100)
}
