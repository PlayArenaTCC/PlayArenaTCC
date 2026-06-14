export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
export const ACCOUNT_ACCESS_EVENT = 'playarena:account-access-changed'
export const DATA_CHANGED_EVENT = 'playarena:data-changed'

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function notifyDataChanged(detail = {}) {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail }))
}

export function notifyAccountAccessChanged(detail = {}) {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(ACCOUNT_ACCESS_EVENT, { detail }))
}

export function subscribeToServerDataChanges() {
  if (typeof EventSource === 'undefined') {
    return () => {}
  }

  const eventSource = new EventSource(`${API_BASE}/events`)

  function handleDataChange(event) {
    let detail = { source: 'server' }

    try {
      detail = { ...detail, ...JSON.parse(event.data) }
    } catch {
      // The event is only an invalidation signal, so malformed metadata can be ignored.
    }

    notifyDataChanged(detail)
  }

  function handleAccountAccessChange(event) {
    let detail = { source: 'server' }

    try {
      detail = { ...detail, ...JSON.parse(event.data) }
    } catch {
      // Consumers ignore events that do not match the current session.
    }

    notifyAccountAccessChanged(detail)
  }

  eventSource.addEventListener('data-changed', handleDataChange)
  eventSource.addEventListener('account-access-changed', handleAccountAccessChange)

  return () => {
    eventSource.removeEventListener('data-changed', handleDataChange)
    eventSource.removeEventListener('account-access-changed', handleAccountAccessChange)
    eventSource.close()
  }
}

export async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const normalizedMethod = method.toUpperCase()
  const response = await fetch(`${API_BASE}${path}`, {
    method: normalizedMethod,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (data.code === 'ACCOUNT_TEMPORARILY_BLOCKED' || data.code === 'ACCOUNT_BANNED') {
      notifyAccountAccessChanged({
        source: 'api',
        accountId: data.accountId,
        perfil: data.perfil,
        type: data.code,
        message: data.message,
      })
    }

    const error = new Error(data.message || 'Não foi possível concluir a operação.')
    error.status = response.status
    error.code = data.code
    throw error
  }

  if (!READ_ONLY_METHODS.has(normalizedMethod)) {
    notifyDataChanged({ source: 'local' })
  }

  return data
}
