import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { formatMl, litersToMl, mlToLiters } from '../lib/hydration'
import { loadEntries, loadSettings } from '../lib/storage'
import { buildMonthlyStats, buildWeeklyStats, pctOfTarget, type PeriodStat } from '../lib/stats'
import '../App.css'

function StatBlock({ title, rows }: { title: string; rows: PeriodStat[] }) {
  return (
    <section className="card stack">
      <div className="label">{title}</div>
      <div className="statsList">
        {rows.length === 0 ? (
          <div className="muted">No data yet.</div>
        ) : (
          rows.map((row) => {
            const pct = pctOfTarget(row.consumedMl, row.targetMl)
            return (
              <div key={row.id} className="statRow">
                <div className="statRowTop">
                  <div className="statLabel">{row.label}</div>
                  <div className="statNums">
                    {mlToLiters(row.consumedMl).toFixed(2)} L{' '}
                    <span className="muted">/ {mlToLiters(row.targetMl).toFixed(2)} L</span>
                  </div>
                </div>
                <div className="progressBar" aria-label={`${title} ${row.label}`}>
                  <div className="progressFill" style={{ width: `${pct}%` }} />
                </div>
                <div className="statMeta muted">
                  {formatMl(row.consumedMl)} of {formatMl(row.targetMl)} · {Math.round(pct)}%
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

export function StatsPage() {
  const { user } = useAuth()
  const email = user!.email

  const settings = loadSettings(email)
  const entries = loadEntries(email)
  const dailyPlanMl = litersToMl(settings.dailyPlanLiters)
  const weekly = buildWeeklyStats(entries, dailyPlanMl, 8)
  const monthly = buildMonthlyStats(entries, dailyPlanMl, 6)

  return (
    <div className="app">
      <header className="topbar statsTopbar">
        <div className="topbarLeft">
          <Link className="btn ghost smallBtn tap" to="/">
            ← Back
          </Link>
        </div>
        <div className="statsTitle">Weekly & monthly</div>
        <div />
      </header>

      <main className="stack mainContent">
        <p className="statsIntro muted">
          Goals use your current daily plan ({settings.dailyPlanLiters.toFixed(1)} L/day): weekly = 7× daily, monthly = days in that month × daily.
        </p>

        <StatBlock title="Weekly" rows={weekly} />
        <StatBlock title="Monthly" rows={monthly} />
      </main>
    </div>
  )
}
