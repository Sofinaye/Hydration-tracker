import type { HydrationEntry, HydrationSettings } from './types'

const SETTINGS_PREFIX = 'hydration.settings.v1'
const ENTRIES_PREFIX = 'hydration.entries.v1'

const defaultSettings: HydrationSettings = {
  dailyPlanLiters: 2,
  remindersEnabled: false,
}

function userScope(email: string, prefix: string) {
  return `${prefix}::${encodeURIComponent(email.trim().toLowerCase())}`
}

export function loadSettings(email: string): HydrationSettings {
  try {
    const raw = localStorage.getItem(userScope(email, SETTINGS_PREFIX))
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as Partial<HydrationSettings>
    return {
      dailyPlanLiters:
        typeof parsed.dailyPlanLiters === 'number' && Number.isFinite(parsed.dailyPlanLiters)
          ? parsed.dailyPlanLiters
          : defaultSettings.dailyPlanLiters,
      remindersEnabled:
        typeof parsed.remindersEnabled === 'boolean'
          ? parsed.remindersEnabled
          : defaultSettings.remindersEnabled,
    }
  } catch {
    return defaultSettings
  }
}

export function saveSettings(email: string, settings: HydrationSettings) {
  localStorage.setItem(userScope(email, SETTINGS_PREFIX), JSON.stringify(settings))
}

export function loadEntries(email: string): HydrationEntry[] {
  try {
    const raw = localStorage.getItem(userScope(email, ENTRIES_PREFIX))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((e) => e as Partial<HydrationEntry>)
      .filter(
        (e): e is HydrationEntry =>
          typeof e.id === 'string' &&
          typeof e.ts === 'number' &&
          Number.isFinite(e.ts) &&
          typeof e.amountMl === 'number' &&
          Number.isFinite(e.amountMl),
      )
  } catch {
    return []
  }
}

export function saveEntries(email: string, entries: HydrationEntry[]) {
  localStorage.setItem(userScope(email, ENTRIES_PREFIX), JSON.stringify(entries))
}
