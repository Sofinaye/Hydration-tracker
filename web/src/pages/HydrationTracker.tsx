import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import { useAuth } from '../context/AuthContext'
import {
  entriesForDay,
  entriesForDaySegment,
  formatMl,
  litersToMl,
  mlToLiters,
  SEGMENTS,
  segmentProgress,
  sumMl,
} from '../lib/hydration'
import { loadEntries, loadSettings, saveEntries, saveSettings } from '../lib/storage'
import type { HydrationEntry, HydrationSettings } from '../lib/types'

const REMINDER_PREFIX = 'hydration.reminder-marks.v1'

export function HydrationTracker() {
  const { user, logout } = useAuth()
  const email = user!.email

  const [now, setNow] = useState(() => new Date())
  const [settings, setSettings] = useState<HydrationSettings>(() => loadSettings(email))
  const [entries, setEntries] = useState<HydrationEntry[]>(() => loadEntries(email))
  const [customMl, setCustomMl] = useState<number>(250)

  useEffect(() => {
    setSettings(loadSettings(email))
    setEntries(loadEntries(email))
  }, [email])

  const todayKey = useMemo(() => {
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [now])

  const todayEntries = useMemo(() => entriesForDay(entries, todayKey), [entries, todayKey])
  const totalTodayMl = useMemo(() => sumMl(todayEntries), [todayEntries])

  const dailyPlanMl = useMemo(() => litersToMl(settings.dailyPlanLiters), [settings.dailyPlanLiters])
  const segmentTargetMl = useMemo(() => Math.round(dailyPlanMl / 3), [dailyPlanMl])
  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window
  const notificationPermission = notificationSupported ? Notification.permission : 'denied'

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    saveSettings(email, settings)
  }, [email, settings])

  useEffect(() => {
    saveEntries(email, entries)
  }, [email, entries])

  useEffect(() => {
    if (!settings.remindersEnabled || !notificationSupported || notificationPermission !== 'granted') return

    const nowMs = now.getTime()
    const currentMarks = readReminderMarks(email)
    let changed = false

    for (const seg of SEGMENTS) {
      const segEnd = new Date(now)
      segEnd.setHours(seg.endHour, 0, 0, 0)

      if (nowMs < segEnd.getTime()) continue

      const marker = `${todayKey}:${seg.id}`
      if (currentMarks.includes(marker)) continue

      const segMl = sumMl(entriesForDaySegment(entries, todayKey, seg.id))
      const missingMl = Math.max(0, segmentTargetMl - segMl)
      if (missingMl <= 0) {
        currentMarks.push(marker)
        changed = true
        continue
      }

      new Notification('Hydration reminder', {
        body: `You still need ${formatMl(missingMl)} for ${seg.label}.`,
      })
      currentMarks.push(marker)
      changed = true
    }

    if (changed) {
      writeReminderMarks(email, currentMarks)
    }
  }, [email, entries, now, notificationPermission, notificationSupported, segmentTargetMl, settings.remindersEnabled, todayKey])

  function addEntry(amountMl: number) {
    const normalized = Math.round(amountMl)
    if (!Number.isFinite(normalized) || normalized <= 0) return
    const entry: HydrationEntry = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      amountMl: normalized,
    }
    setEntries((prev) => [entry, ...prev])
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function clearToday() {
    setEntries((prev) => prev.filter((e) => entriesForDay([e], todayKey).length === 0))
  }

  async function enableReminders() {
    if (!notificationSupported) return
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setSettings((s) => ({ ...s, remindersEnabled: true }))
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="title">Hydration</div>
        <div className="topbarRight">
          <div className="pill">{todayKey}</div>
          <button type="button" className="btn ghost smallBtn" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>

      <main className="stack mainContent">
        <div className="card stack">
          <div className="row">
            <div>
              <div className="label">Today</div>
              <div className="big">
                {mlToLiters(totalTodayMl).toFixed(2)}{' '}
                <span className="muted">/ {settings.dailyPlanLiters.toFixed(1)} L</span>
              </div>
            </div>
            <button type="button" className="btn btnDanger smallBtn" onClick={clearToday} title="Remove today's entries">
              Clear
            </button>
          </div>
          <div className="progressBar" aria-label="Daily progress">
            <div
              className="progressFill"
              style={{ width: `${Math.min(100, (totalTodayMl / Math.max(1, dailyPlanMl)) * 100)}%` }}
            />
          </div>
        </div>

        <div className="card stack">
          <div className="row">
            <div>
              <div className="label">Daily plan (liters)</div>
              <div className="muted">Each segment target: {formatMl(segmentTargetMl)}</div>
            </div>
          </div>
          <div className="row">
            <div className="label">Segment reminders</div>
            <button
              type="button"
              className="btn smallBtn"
              onClick={() => {
                if (!settings.remindersEnabled && notificationPermission !== 'granted') {
                  void enableReminders()
                  return
                }
                setSettings((s) => ({ ...s, remindersEnabled: !s.remindersEnabled }))
              }}
            >
              {settings.remindersEnabled ? 'On' : 'Off'}
            </button>
          </div>
          {notificationSupported ? (
            <div className="muted">
              Browser notifications: {notificationPermission}
              {notificationPermission !== 'granted' ? ' (tap reminders to allow)' : ''}
            </div>
          ) : (
            <div className="muted">Notifications are not supported in this browser.</div>
          )}
          <div className="inputRow">
            <input
              type="number"
              inputMode="decimal"
              min={0.5}
              step={0.1}
              value={settings.dailyPlanLiters}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  dailyPlanLiters: Number(e.target.value),
                }))
              }
              aria-label="Daily plan in liters"
            />
            <button type="button" className="btn btnPrimary" onClick={() => setSettings((s) => ({ ...s }))}>
              Save
            </button>
          </div>
        </div>

        <div className="card stack">
          <div className="row">
            <div>
              <div className="label">Add water</div>
              <div className="muted">Tap a bottle, or enter a custom amount</div>
            </div>
          </div>
          <div className="grid">
            <button type="button" className="btn btnPrimary tap" onClick={() => addEntry(100)}>
              +100 ml
            </button>
            <button type="button" className="btn btnPrimary tap" onClick={() => addEntry(250)}>
              +250 ml
            </button>
            <button type="button" className="btn btnPrimary tap" onClick={() => addEntry(500)}>
              +500 ml
            </button>
            <button type="button" className="btn btnPrimary tap" onClick={() => addEntry(1000)}>
              +1 L
            </button>
          </div>
          <div className="inputRow">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={10}
              value={customMl}
              onChange={(e) => setCustomMl(Number(e.target.value))}
              aria-label="Custom amount in ml"
            />
            <button type="button" className="btn tap" onClick={() => addEntry(customMl)}>
              Add
            </button>
          </div>
        </div>

        <div className="card stack">
          <div className="row">
            <div>
              <div className="label">Segments</div>
              <div className="muted">Goal: 1/3 of your daily plan each segment</div>
            </div>
          </div>
          <div className="segmentList">
            {SEGMENTS.map((seg) => {
              const segEntries = entriesForDaySegment(entries, todayKey, seg.id)
              const segMl = sumMl(segEntries)
              const pct = Math.min(100, (segMl / Math.max(1, segmentTargetMl)) * 100)
              const timePct = segmentProgress(now, seg) * 100
              return (
                <div key={seg.id} className="segment">
                  <div className="row">
                    <div>
                      <div className="segTitle">{seg.label}</div>
                      <div className="muted">
                        {formatMl(segMl)} / {formatMl(segmentTargetMl)}
                      </div>
                    </div>
                    <div className="pill">
                      {Math.round(pct)}% <span className="muted">({Math.round(timePct)}% of time)</span>
                    </div>
                  </div>
                  <div className="progressBar" aria-label={`${seg.label} progress`}>
                    <div className="progressFill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card stack">
          <div className="row">
            <div>
              <div className="label">Today’s log</div>
              <div className="muted">{todayEntries.length} entries</div>
            </div>
          </div>
          <div className="entries">
            {todayEntries.length === 0 ? (
              <div className="muted">No entries yet. Add your first bottle.</div>
            ) : (
              todayEntries.map((e) => (
                <div key={e.id} className="entry">
                  <div>
                    <div className="entryAmount">{formatMl(e.amountMl)}</div>
                    <div className="entryTime">{new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <button type="button" className="btn smallBtn tap" onClick={() => deleteEntry(e.id)}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function reminderKey(email: string) {
  return `${REMINDER_PREFIX}::${encodeURIComponent(email.trim().toLowerCase())}`
}

function readReminderMarks(email: string): string[] {
  try {
    const raw = localStorage.getItem(reminderKey(email))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((v): v is string => typeof v === 'string')
  } catch {
    return []
  }
}

function writeReminderMarks(email: string, marks: string[]) {
  localStorage.setItem(reminderKey(email), JSON.stringify(marks))
}
