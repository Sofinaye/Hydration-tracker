const USERS_KEY = 'hydration.users.v1'
const SESSION_KEY = 'hydration.session.v1'

export type UserRecord = {
  email: string
  salt: string
  passwordHash: string
}

export type Session = {
  email: string
}

function randomSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function loadUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (u): u is UserRecord =>
        typeof u === 'object' &&
        u !== null &&
        typeof (u as UserRecord).email === 'string' &&
        typeof (u as UserRecord).salt === 'string' &&
        typeof (u as UserRecord).passwordHash === 'string',
    )
  } catch {
    return []
  }
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Session>
    if (typeof parsed.email !== 'string' || !parsed.email) return null
    return { email: parsed.email }
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  if (!session) localStorage.removeItem(SESSION_KEY)
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export async function signUp(emailRaw: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = normalizeEmail(emailRaw)
  if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid email address.' }
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }

  const users = loadUsers()
  if (users.some((u) => u.email === email)) return { ok: false, error: 'An account with this email already exists.' }

  const salt = randomSalt()
  const passwordHash = await sha256Hex(salt + password)
  users.push({ email, salt, passwordHash })
  saveUsers(users)
  saveSession({ email })
  return { ok: true }
}

export async function signIn(emailRaw: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = normalizeEmail(emailRaw)
  if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid email address.' }

  const users = loadUsers()
  const user = users.find((u) => u.email === email)
  if (!user) return { ok: false, error: 'Invalid email or password.' }

  const passwordHash = await sha256Hex(user.salt + password)
  if (passwordHash !== user.passwordHash) return { ok: false, error: 'Invalid email or password.' }

  saveSession({ email })
  return { ok: true }
}

export function signOut() {
  saveSession(null)
}
