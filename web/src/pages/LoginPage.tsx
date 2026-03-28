import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLastUsedEmail, getRegisteredEmails } from '../lib/auth'
import './AuthPages.css'

export function LoginPage() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState(() => getLastUsedEmail())
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const savedEmails = getRegisteredEmails()

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await login(email, password)
      if (!result.ok) setError(result.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authBrand">Welcome back</div>
        <div className="authSub">Log in to track today’s hydration.</div>

        {savedEmails.length > 0 ? (
          <div className="savedAccounts">
            <div className="savedAccountsLabel">Saved accounts on this device</div>
            <div className="accountChips" role="list">
              {savedEmails.map((addr) => (
                <button
                  key={addr}
                  type="button"
                  className="accountChip tap"
                  role="listitem"
                  onClick={() => setEmail(addr)}
                >
                  {addr}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <form className="authForm" onSubmit={onSubmit}>
          {error ? <div className="authError">{error}</div> : null}

          <div className="field">
            <label className="fieldLabel" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="fieldInput"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="fieldLabel" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="fieldInput"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="authSubmit tap" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <div className="authFooter">
          No account?{' '}
          <Link className="authLink" to="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
