import type { HydrationEntry, HydrationSettings } from './types'

const SETTINGS_KEY = 'hydration.settings.v1'
const ENTRIES_KEY = 'hydration.entries.v1'

const defaultSettings: HydrationSettings = {
  dailyPlanLiters: 2,
  remindersEnabled: false,
}

export function loadSettings(): HydrationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
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

export function saveSettings(settings: HydrationSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadEntries(): HydrationEntry[] {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY)
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

export function saveEntries(entries: HydrationEntry[]) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

