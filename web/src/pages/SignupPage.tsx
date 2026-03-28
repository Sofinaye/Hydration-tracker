import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export function SignupPage() {
  const { user, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const result = await register(email, password)
      if (!result.ok) setError(result.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authBrand">Create account</div>
        <div className="authSub">Sign up to save your hydration plan on this device.</div>

        <form className="authForm" onSubmit={onSubmit}>
          {error ? <div className="authError">{error}</div> : null}

          <div className="field">
            <label className="fieldLabel" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
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
            <label className="fieldLabel" htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              className="fieldInput"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="field">
            <label className="fieldLabel" htmlFor="signup-confirm">
              Confirm password
            </label>
            <input
              id="signup-confirm"
              className="fieldInput"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <button className="authSubmit tap" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Sign up'}
          </button>
        </form>

        <div className="authFooter">
          Already have an account?{' '}
          <Link className="authLink" to="/login">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
