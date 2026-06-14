const SESSION_KEY = 'playarena:session'

export function getStoredSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function persistSession(payload) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
}
