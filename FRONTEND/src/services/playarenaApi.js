import { demoQuadras, fallbackCourtImage } from '../data/demoData'
import { normalizeCourt } from '../utils/formatters'
import { apiRequest } from './httpClient'

export async function login(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export async function requestPasswordReset(payload) {
  return apiRequest('/auth/password/forgot', {
    method: 'POST',
    body: payload,
  })
}

export async function verifyPasswordResetCode(payload) {
  return apiRequest('/auth/password/verify', {
    method: 'POST',
    body: payload,
  })
}

export async function resetPassword(payload) {
  return apiRequest('/auth/password/reset', {
    method: 'POST',
    body: payload,
  })
}

export async function registerAccount(payload) {
  const path = payload.perfil === 'proprietario' ? '/auth/register/proprietario' : '/auth/register'

  return apiRequest(path, {
    method: 'POST',
    body: payload,
  })
}

export async function confirmRegistrationCode(payload) {
  return apiRequest('/auth/register/confirm', {
    method: 'POST',
    body: payload,
  })
}

export async function resendRegistrationCode(payload) {
  return apiRequest('/auth/register/resend', {
    method: 'POST',
    body: payload,
  })
}

export async function updateProfile(token, payload) {
  const body = new FormData()
  body.append('telefone', payload.telefone || '')

  if (payload.foto_perfil) {
    body.append('foto_perfil', payload.foto_perfil)
  }

  const response = await apiRequest('/auth/profile', {
    method: 'PATCH',
    token,
    body,
  })

  return response.usuario
}

export async function deleteAccount(token) {
  return apiRequest('/auth/profile', {
    method: 'DELETE',
    token,
  })
}

export async function changeAdminPassword(token, payload) {
  return apiRequest('/admin/perfil/senha', {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export async function createAdmin(token, payload) {
  return apiRequest('/admin/administradores', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function fetchCurrentUser(token) {
  const response = await apiRequest('/auth/me', { token })
  return response.usuario
}

export async function fetchAddressByCep(token, cep) {
  const digits = String(cep || '').replace(/\D/g, '')
  const response = await apiRequest(`/localizacao/cep/${digits}`, { token })
  return response.localizacao
}

export async function fetchGeocodedAddress(token, location) {
  const params = new URLSearchParams({
    cep: location.cep || '',
    endereco: location.endereco || '',
    numero: location.numero || '',
    bairro: location.bairro || '',
    cidade: location.cidade || '',
    estado: location.estado || '',
  })
  const response = await apiRequest(`/localizacao/geocodificar?${params}`, { token })
  return response.localizacao
}

export async function fetchQuadras() {
  const response = await apiRequest('/quadras')
  const apiQuadras = (response.quadras || []).map(normalizeCourt)
  return apiQuadras.length ? apiQuadras : demoQuadras.map(normalizeCourt)
}

export async function fetchCourtSchedules(quadraId, data, token) {
  return apiRequest(`/quadras/${quadraId}/horarios?data=${data}`, { token })
}

export async function fetchRoleData(currentSession) {
  if (!currentSession?.token) {
    return null
  }

  if (currentSession.usuario.perfil === 'usuario') {
    const [usuario, response] = await Promise.all([
      fetchCurrentUser(currentSession.token),
      apiRequest('/reservas/minhas', { token: currentSession.token }),
    ])
    return { role: 'usuario', usuario, reservas: response.reservas || [] }
  }

  if (currentSession.usuario.perfil === 'proprietario') {
    const [usuario, quadrasResponse, reservasResponse, documentacoesResponse] = await Promise.all([
      fetchCurrentUser(currentSession.token),
      apiRequest('/quadras/minhas', { token: currentSession.token }),
      apiRequest('/reservas/proprietario', { token: currentSession.token }),
      apiRequest('/quadras/documentacoes/minhas', { token: currentSession.token }),
    ])

    return {
      role: 'proprietario',
      usuario,
      ownerQuadras: (quadrasResponse.quadras || []).map(normalizeCourt),
      ownerReservas: reservasResponse.reservas || [],
      ownerDocumentacoes: documentacoesResponse.documentacoes || [],
    }
  }

  if (currentSession.usuario.perfil === 'admin') {
    const administradoresRequest = currentSession.usuario.nivel_acesso === 'super_admin'
      ? apiRequest('/admin/administradores', { token: currentSession.token })
      : Promise.resolve({ administradores: [] })
    const [usuario, dashboard, usuarios, proprietarios, quadrasResponse, reservasResponse, documentacoesResponse, administradoresResponse] = await Promise.all([
      fetchCurrentUser(currentSession.token),
      apiRequest('/admin/dashboard', { token: currentSession.token }),
      apiRequest('/admin/usuarios', { token: currentSession.token }),
      apiRequest('/admin/proprietarios', { token: currentSession.token }),
      apiRequest('/admin/espacos', { token: currentSession.token }),
      apiRequest('/reservas/todas', { token: currentSession.token }),
      apiRequest('/admin/documentacoes', { token: currentSession.token }),
      administradoresRequest,
    ])

    return {
      role: 'admin',
      usuario,
      adminData: {
        indicadores: dashboard.indicadores,
        usuarios: usuarios.usuarios || [],
        proprietarios: proprietarios.proprietarios || [],
        quadras: (quadrasResponse.espacos || []).map(normalizeCourt),
        reservas: reservasResponse.reservas || [],
        documentacoes: documentacoesResponse.documentacoes || [],
        administradores: administradoresResponse.administradores || [],
      },
    }
  }

  return null
}

export async function createReservation(token, payload) {
  const response = await apiRequest('/reservas', {
    method: 'POST',
    token,
    body: payload,
  })

  return response.reserva
}

export async function cancelReservation(token, reservaId) {
  return apiRequest(`/reservas/${reservaId}/cancelar`, {
    method: 'PATCH',
    token,
  })
}

<<<<<<< Updated upstream
export async function createCourt(token, form) {
  const payload = {
    ...form,
    imagem_url: form.imagem_url || fallbackCourtImage,
    preco_hora: Number(form.preco_hora || 0),
=======
export async function fetchNotifications(token) {
  return apiRequest('/notificacoes', { token })
}

export async function markNotificationRead(token, notificationId) {
  return apiRequest(`/notificacoes/${notificationId}/read`, {
    method: 'PATCH',
    token,
  })
}

export async function markAllNotificationsRead(token) {
  return apiRequest('/notificacoes/read-all', {
    method: 'PATCH',
    token,
  })
}

function isUploadFile(value) {
  return typeof File !== 'undefined' && value instanceof File
}

async function uploadCourtPhotos(token, files) {
  const uploadFiles = files.filter(isUploadFile)

  if (!uploadFiles.length) {
    return []
  }

  const body = new FormData()
  uploadFiles.forEach((file) => {
    body.append('fotos', file)
  })

  const response = await apiRequest('/quadras/fotos', {
    method: 'POST',
    token,
    body,
  })

  return response.fotos || []
}

async function buildAdminSpacePayload(token, form) {
  const photos = Array.isArray(form.fotos) ? form.fotos : []
  const existingPhotos = photos.filter((photo) => typeof photo === 'string' && photo.trim())
  const uploadedPhotos = await uploadCourtPhotos(token, photos)
  const allPhotos = [...existingPhotos, ...uploadedPhotos]
  const modalidades = (form.modalidades || [])
    .map((item) => String(item || '').trim())
    .filter(Boolean)
  const modalidade = form.modalidade || modalidades[0] || 'poliesportiva'

  return {
    ...form,
    modalidade,
    modalidades: [...new Set([modalidade, ...modalidades])],
    preco_hora: Number(form.preco_hora || 0),
    fotos: allPhotos,
    imagem_url: allPhotos[0] || form.imagem_url || null,
  }
}

export async function createAdminSpace(token, form) {
  const body = await buildAdminSpacePayload(token, form)
  const response = await apiRequest('/admin/espacos', {
    method: 'POST',
    token,
    body,
  })

  return {
    ...response,
    espaco: normalizeCourt(response.espaco),
  }
}

export async function updateAdminSpace(token, spaceId, form) {
  const body = await buildAdminSpacePayload(token, form)
  const response = await apiRequest(`/admin/espacos/${spaceId}`, {
    method: 'PUT',
    token,
    body,
  })

  return {
    ...response,
    espaco: normalizeCourt(response.espaco),
  }
}

export async function deactivateAdminSpace(token, spaceId, payload) {
  const response = await apiRequest(`/admin/espacos/${spaceId}/desativacao`, {
    method: 'PATCH',
    token,
    body: payload,
  })

  return {
    ...response,
    espaco: normalizeCourt(response.espaco),
  }
}

export async function clearAdminSpaceDeactivation(token, spaceId) {
  const response = await apiRequest(`/admin/espacos/${spaceId}/desativacao`, {
    method: 'DELETE',
    token,
  })

  return {
    ...response,
    espaco: normalizeCourt(response.espaco),
  }
}

export async function deleteAdminSpace(token, spaceId) {
  return apiRequest(`/admin/espacos/${spaceId}`, {
    method: 'DELETE',
    token,
  })
}

async function uploadCourtDocuments(token, documents = {}) {
  const entries = Object.entries(documents)
    .filter(([, value]) => isUploadFile(value))

  if (!entries.length) {
    return {}
  }

  const body = new FormData()
  entries.forEach(([key, file]) => {
    body.append(key, file)
  })

  const response = await apiRequest('/quadras/documentos', {
    method: 'POST',
    token,
    body,
  })

  return response.documentos || {}
}

async function buildDocumentationPayload(token, form) {
  const source = form.documentacao || {}
  const uploadedDocuments = await uploadCourtDocuments(token, source.documentos || {})

  return {
    tipo_proprietario: source.tipo_proprietario || 'dono_local',
    documentos: {
      ...source.documentos,
      ...uploadedDocuments,
    },
  }
}

async function buildCourtPayloads(token, form) {
  const quantidadeCampos = Math.min(Math.max(Number(form.quantidade_campos || form.campos?.length || 1), 1), 12)
  const documentacao = await buildDocumentationPayload(token, form)

  if (!Array.isArray(form.campos) || !form.campos.length) {
    return [{
      ...form,
      documentacao,
      imagem_url: form.imagem_url || fallbackCourtImage,
      preco_hora: Number(form.preco_hora || 0),
    }]
  }

  const baseName = String(form.nome || '').trim()
  const campos = form.campos.slice(0, quantidadeCampos)
  const payloads = []

  for (const [index, campo] of campos.entries()) {
    const photos = Array.isArray(campo.fotos) ? await uploadCourtPhotos(token, campo.fotos) : []
    const campoName = String(campo.nome || `Campo ${index + 1}`).trim()
    const nome = campos.length > 1 || (campoName && campoName !== 'Campo 1')
      ? `${baseName} - ${campoName}`
      : baseName

    payloads.push({
      nome,
      descricao: form.descricao,
      documentacao,
      modalidade: form.modalidade,
      endereco: form.endereco,
      numero: form.numero,
      bairro: form.bairro,
      cidade: form.cidade,
      estado: form.estado || 'PR',
      cep: form.cep,
      latitude: form.latitude,
      longitude: form.longitude,
      localizacao_confirmada: form.localizacao_confirmada,
      preco_hora: Number(campo.preco_hora || 0),
      imagem_url: campo.imagem_url || photos[0] || fallbackCourtImage,
      fotos: photos,
      horarios_funcionamento: campo.horarios_funcionamento || [],
      horarios_disponiveis: campo.horarios_disponiveis || [],
      amenities: campo.amenities || [],
    })
  }

  return payloads
}

export async function createCourt(token, form) {
  const payloads = await buildCourtPayloads(token, form)
  const quadras = []

  for (const payload of payloads) {
    const response = await apiRequest('/quadras', {
      method: 'POST',
      token,
      body: payload,
    })

    quadras.push(normalizeCourt(response.quadra))
>>>>>>> Stashed changes
  }

  return quadras.length === 1 ? quadras[0] : quadras
}

export async function createSchedule(token, quadra, schedule) {
  const response = await apiRequest(`/quadras/${quadra.id}/horarios`, {
    method: 'POST',
    token,
    body: {
      ...schedule,
      dia_semana: Number(schedule.dia_semana),
      valor: Number(schedule.valor || quadra.preco_hora || 0),
    },
  })

  return response.horario
}

export async function updateReservationStatus(token, reservaId, status) {
  return apiRequest(`/reservas/${reservaId}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  })
}

export async function reviewDocumentation(token, documentationId, payload) {
  const response = await apiRequest(`/admin/documentacoes/${documentationId}/status`, {
    method: 'PATCH',
    token,
    body: payload,
  })

  return response.documentacao
}

export async function blockUserTemporarily(token, userId, payload) {
  return apiRequest(`/admin/usuarios/${userId}/bloqueio-temporario`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export async function clearUserTemporaryBlock(token, userId) {
  return apiRequest(`/admin/usuarios/${userId}/bloqueio-temporario`, {
    method: 'DELETE',
    token,
  })
}

export async function banUser(token, userId, motivo) {
  return apiRequest(`/admin/usuarios/${userId}`, {
    method: 'DELETE',
    token,
    body: { motivo },
  })
}

export async function updateOwnerApproval(token, ownerId, statusAprovacao) {
  return apiRequest(`/admin/proprietarios/${ownerId}/aprovacao`, {
    method: 'PATCH',
    token,
    body: { status_aprovacao: statusAprovacao },
  })
}
