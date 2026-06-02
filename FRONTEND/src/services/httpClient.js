const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'

export async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Não foi possível concluir a operação.')
  }

  return data
}
