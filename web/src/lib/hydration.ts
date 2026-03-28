import type { HydrationEntry } from './types'

export type DaySegmentId = 'nightToNoon' | 'noonToFour' | 'fourToEight'

export type DaySegment = {
  id: DaySegmentId
  label: string
  startHour: number
  endHour: number
}

export const SEGMENTS: DaySegment[] = [
  { id: 'nightToNoon', label: '00:00–12:00', startHour: 0, endHour: 12 },
  { id: 'noonToFour', label: '12:00–16:00', startHour: 12, endHour: 16 },
  { id: 'fourToEight', label: '16:00–20:00', startHour: 16, endHour: 20 },
]

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function litersToMl(liters: number) {
  return Math.round(liters * 1000)
}

export function mlToLiters(ml: number) {
  return ml / 1000
}

export function formatMl(ml: number) {
  if (ml >= 1000 && ml % 1000 === 0) return `${ml / 1000} L`
  return `${ml} ml`
}

export function dayKey(ts: number) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function segmentForTimestamp(ts: number): DaySegmentId | null {
  const d = new Date(ts)
  const h = d.getHours()
  const seg = SEGMENTS.find((s) => h >= s.startHour && h < s.endHour)
  return seg ? seg.id : null
}

export function sumMl(entries: HydrationEntry[]) {
  return entries.reduce((acc, e) => acc + e.amountMl, 0)
}

export function entriesForDay(entries: HydrationEntry[], day: string) {
  return entries.filter((e) => dayKey(e.ts) === day)
}

export function entriesForDaySegment(entries: HydrationEntry[], day: string, segment: DaySegmentId) {
  return entries.filter((e) => dayKey(e.ts) === day && segmentForTimestamp(e.ts) === segment)
}

export function segmentProgress(now: Date, segment: DaySegment) {
  const start = new Date(now)
  start.setHours(segment.startHour, 0, 0, 0)
  const end = new Date(now)
  end.setHours(segment.endHour, 0, 0, 0)
  const durationMs = Math.max(1, end.getTime() - start.getTime())
  const elapsedMs = clamp(now.getTime() - start.getTime(), 0, durationMs)
  return elapsedMs / durationMs
}

