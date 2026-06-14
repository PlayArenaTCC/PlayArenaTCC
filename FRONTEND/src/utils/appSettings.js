export const settingsStorageKey = 'playarena-settings'
export const settingsChangedEvent = 'playarena-settings-changed'

export const languageOptions = [
  { value: 'pt-BR', label: 'Português (BR)', locale: 'pt-BR' },
  { value: 'en-US', label: 'English (US)', locale: 'en-US' },
  { value: 'es-ES', label: 'Español', locale: 'es-ES' },
]

export const currencyOptions = [
  { value: 'BRL', label: 'Real (R$)', rateFromBRL: 1 },
  { value: 'USD', label: 'Dólar (US$)', rateFromBRL: 0.19 },
  { value: 'EUR', label: 'Euro (EUR)', rateFromBRL: 0.17 },
]

export const accessibilityOptions = [
  { key: 'largerText', labelKey: 'largerText' },
  { key: 'highContrast', labelKey: 'highContrast' },
  { key: 'reducedMotion', labelKey: 'reducedMotion' },
]

export const defaultAppSettings = {
  accessibility: {
    highContrast: false,
    largerText: false,
    reducedMotion: false,
  },
  currency: 'BRL',
  language: 'pt-BR',
}

const translations = {
  'pt-BR': {
    accessibility: 'Acessibilidade',
    accessibilityDescription: 'Ajuste a visualizacao da plataforma',
    buscar: 'Buscar',
    configuracoes: 'Configurações',
    currency: 'Moeda',
    dashboard: 'Dashboard',
    documentos: 'Documentos',
    espacos: 'Meus Espaços',
    highContrast: 'Alto contraste',
    home: 'Inicio',
    language: 'Idioma',
    languageRegion: 'Idioma e Região',
    languageRegionDescription: 'Personalize sua experiência',
    largerText: 'Texto maior',
    mapa: 'Mapa',
    minhasReservas: 'Minhas Reservas',
    notificationEmail: 'Notificações por e-mail',
    notificationReservations: 'Lembretes de reservas',
    notificationPromotions: 'Promoções e novidades',
    notifications: 'Notificações',
    notificationsDescription: 'Gerencie como você recebe notificações',
    painelAdmin: 'Painel Admin',
    perfil: 'Perfil',
    reducedMotion: 'Reduzir animações',
    reservas: 'Reservas',
    suporte: 'Suporte',
    usuarios: 'Usuários',
  },
  'en-US': {
    accessibility: 'Accessibility',
    accessibilityDescription: 'Adjust how the platform is displayed',
    buscar: 'Search',
    configuracoes: 'Settings',
    currency: 'Currency',
    dashboard: 'Dashboard',
    documentos: 'Documents',
    espacos: 'My Spaces',
    highContrast: 'High contrast',
    home: 'Home',
    language: 'Language',
    languageRegion: 'Language and Region',
    languageRegionDescription: 'Customize your experience',
    largerText: 'Larger text',
    mapa: 'Map',
    minhasReservas: 'My Reservations',
    notificationEmail: 'Email notifications',
    notificationReservations: 'Reservation reminders',
    notificationPromotions: 'Promotions and news',
    notifications: 'Notifications',
    notificationsDescription: 'Manage how you receive notifications',
    painelAdmin: 'Admin Panel',
    perfil: 'Profile',
    reducedMotion: 'Reduce motion',
    reservas: 'Reservations',
    suporte: 'Support',
    usuarios: 'Users',
  },
  'es-ES': {
    accessibility: 'Accesibilidad',
    accessibilityDescription: 'Ajusta la visualizacion de la plataforma',
    buscar: 'Buscar',
    configuracoes: 'Configuración',
    currency: 'Moneda',
    dashboard: 'Panel',
    documentos: 'Documentos',
    espacos: 'Mis Espacios',
    highContrast: 'Alto contraste',
    home: 'Inicio',
    language: 'Idioma',
    languageRegion: 'Idioma y Región',
    languageRegionDescription: 'Personaliza tu experiencia',
    largerText: 'Texto mas grande',
    mapa: 'Mapa',
    minhasReservas: 'Mis Reservas',
    notificationEmail: 'Notificaciones por email',
    notificationReservations: 'Recordatorios de reservas',
    notificationPromotions: 'Promociones y novedades',
    notifications: 'Notificaciones',
    notificationsDescription: 'Gestiona como recibes notificaciones',
    painelAdmin: 'Panel Admin',
    perfil: 'Perfil',
    reducedMotion: 'Reducir animaciones',
    reservas: 'Reservas',
    suporte: 'Soporte',
    usuarios: 'Usuarios',
  },
}

const navTranslationKeys = {
  buscar: 'buscar',
  configuracoes: 'configuracoes',
  dashboard: 'dashboard',
  documentos: 'documentos',
  espacos: 'espacos',
  home: 'home',
  mapa: 'mapa',
  'minhas-reservas': 'minhasReservas',
  perfil: 'perfil',
  reservas: 'reservas',
  suporte: 'suporte',
  usuarios: 'usuarios',
}

const textEntry = (pt, en, es, variants = []) => ({
  'pt-BR': pt,
  'en-US': en,
  'es-ES': es,
  variants,
})

const portugueseCorrections = [
  [/\bPortugues\b/g, 'Português'],
  [/\bEspanol\b/g, 'Español'],
  [/\bDolar\b/g, 'Dólar'],
  [/\bInicio\b/g, 'Início'],
  [/\bvisualizacao\b/g, 'visualização'],
  [/\bRegiao\b/g, 'Região'],
  [/\bexperiencia\b/g, 'experiência'],
  [/\bNotificacoes\b/g, 'Notificações'],
  [/\bPromocoes\b/g, 'Promoções'],
  [/\bpromocoes\b/g, 'promoções'],
  [/\bvoce\b/g, 'você'],
  [/\bVoce\b/g, 'Você'],
  [/\bnao\b/g, 'não'],
  [/\bNao\b/g, 'Não'],
  [/\bUsuario\b/g, 'Usuário'],
  [/\busuario\b/g, 'usuário'],
  [/\bUsuarios\b/g, 'Usuários'],
  [/\busuarios\b/g, 'usuários'],
  [/\bProprietario\b/g, 'Proprietário'],
  [/\bproprietario\b/g, 'proprietário'],
  [/\bProprietarios\b/g, 'Proprietários'],
  [/\bproprietarios\b/g, 'proprietários'],
  [/\bEspaco\b/g, 'Espaço'],
  [/\bespaco\b/g, 'espaço'],
  [/\bEspacos\b/g, 'Espaços'],
  [/\bespacos\b/g, 'espaços'],
  [/\bHorario\b/g, 'Horário'],
  [/\bhorario\b/g, 'horário'],
  [/\bHorarios\b/g, 'Horários'],
  [/\bhorarios\b/g, 'horários'],
  [/\bEndereco\b/g, 'Endereço'],
  [/\bendereco\b/g, 'endereço'],
  [/\bInformacoes\b/g, 'Informações'],
  [/\bBasicas\b/g, 'Básicas'],
  [/\bLocalizacao\b/g, 'Localização'],
  [/\bDescricao\b/g, 'Descrição'],
  [/\bDocumentacao\b/g, 'Documentação'],
  [/\bdocumentacao\b/g, 'documentação'],
  [/\bAnalise\b/g, 'Análise'],
  [/\banalise\b/g, 'análise'],
  [/\bValidacao\b/g, 'Validação'],
  [/\bvalidacao\b/g, 'validação'],
  [/\bAutorizacao\b/g, 'Autorização'],
  [/\bautorizacao\b/g, 'autorização'],
  [/\bPreco\b/g, 'Preço'],
  [/\bpreco\b/g, 'preço'],
  [/\bPromocao\b/g, 'Promoção'],
  [/\bpromocao\b/g, 'promoção'],
  [/\bacao\b/g, 'ação'],
  [/\bacoes\b/g, 'ações'],
  [/\bAcoes\b/g, 'Ações'],
  [/\bdisponiveis\b/g, 'disponíveis'],
  [/\bdisponivel\b/g, 'disponível'],
  [/\bproxima\b/g, 'próxima'],
  [/\bproximo\b/g, 'próximo'],
  [/\bobservacao\b/g, 'observação'],
  [/\boperacao\b/g, 'operação'],
  [/\bedicao\b/g, 'edição'],
  [/\bexclusao\b/g, 'exclusão'],
  [/\brecuperacao\b/g, 'recuperação'],
  [/\bverificacao\b/g, 'verificação'],
  [/\bSolicitacao\b/g, 'Solicitação'],
  [/\bsolicitacao\b/g, 'solicitação'],
  [/\bcodigo\b/g, 'código'],
  [/\bCodigo\b/g, 'Código'],
  [/\bnumerico\b/g, 'numérico'],
  [/\bdigitos\b/g, 'dígitos'],
  [/\bsao\b/g, 'são'],
  [/\bnumero\b/g, 'número'],
  [/\bmaiuscula\b/g, 'maiúscula'],
  [/\bpossivel\b/g, 'possível'],
  [/\bPossivel\b/g, 'Possível'],
  [/\bformulario\b/g, 'formulário'],
  [/\barea\b/g, 'área'],
  [/\baprovacao\b/g, 'aprovação'],
  [/\bcodigos\b/g, 'códigos'],
  [/\bNotificacao\b/g, 'Notificação'],
  [/\bnotificacao\b/g, 'notificação'],
  [/\bindisponivel\b/g, 'indisponível'],
  [/\bmaximo\b/g, 'máximo'],
  [/\bminimo\b/g, 'mínimo'],
  [/\bobrigatoria\b/g, 'obrigatória'],
  [/\bObrigatoria\b/g, 'Obrigatória'],
  [/\bliberacao\b/g, 'liberação'],
  [/\bja\b/g, 'já'],
  [/\bJa\b/g, 'Já'],
  [/\bsera\b/g, 'será'],
  [/\bSera\b/g, 'Será'],
  [/\bate\b/g, 'até'],
  [/\bAte\b/g, 'Até'],
  [/\besta ativo\b/g, 'está ativo'],
  [/\besta cadastrado\b/g, 'está cadastrado'],
  [/\besta confirmada\b/g, 'está confirmada'],
]

const uiTextEntries = [
  textEntry('Início', 'Home', 'Inicio', ['Inicio']),
  textEntry('Buscar', 'Search', 'Buscar'),
  textEntry('Minhas Reservas', 'My Reservations', 'Mis Reservas'),
  textEntry('Mapa', 'Map', 'Mapa'),
  textEntry('Suporte', 'Support', 'Soporte'),
  textEntry('Configurações', 'Settings', 'Configuración'),
  textEntry('Dashboard', 'Dashboard', 'Panel'),
  textEntry('Documentos', 'Documents', 'Documentos'),
  textEntry('Meus Espaços', 'My Spaces', 'Mis Espacios', ['Meus Espacos']),
  textEntry('Perfil', 'Profile', 'Perfil'),
  textEntry('Reservas', 'Reservations', 'Reservas'),
  textEntry('Usuários', 'Users', 'Usuarios', ['Usuarios']),
  textEntry('Painel Admin', 'Admin Panel', 'Panel Admin'),
  textEntry('Notificações', 'Notifications', 'Notificaciones', ['Notificacoes']),
  textEntry('Gerencie como você recebe notificações', 'Manage how you receive notifications', 'Gestiona cómo recibes notificaciones', ['Gerencie como voce recebe notificacoes']),
  textEntry('Notificações por e-mail', 'Email notifications', 'Notificaciones por email', ['Notificações por email', 'Notificacoes por email']),
  textEntry('Lembretes de reservas', 'Reservation reminders', 'Recordatorios de reservas'),
  textEntry('Promoções e novidades', 'Promotions and news', 'Promociones y novedades', ['Promocoes e novidades']),
  textEntry('Idioma e Região', 'Language and Region', 'Idioma y Región', ['Idioma e Regiao']),
  textEntry('Personalize sua experiência', 'Customize your experience', 'Personaliza tu experiencia', ['Personalize sua experiencia']),
  textEntry('Idioma', 'Language', 'Idioma'),
  textEntry('Moeda', 'Currency', 'Moneda'),
  textEntry('Acessibilidade', 'Accessibility', 'Accesibilidad'),
  textEntry('Ajuste a visualização da plataforma', 'Adjust how the platform is displayed', 'Ajusta la visualización de la plataforma', ['Ajuste a visualizacao da plataforma']),
  textEntry('Alto contraste', 'High contrast', 'Alto contraste'),
  textEntry('Texto maior', 'Larger text', 'Texto más grande', ['Texto mas grande']),
  textEntry('Reduzir animações', 'Reduce motion', 'Reducir animaciones', ['Reduzir animacoes']),
  textEntry('Filtros', 'Filters', 'Filtros'),
  textEntry('Tipo de Esporte', 'Sport Type', 'Tipo de deporte'),
  textEntry('Todos os esportes', 'All sports', 'Todos los deportes'),
  textEntry('Faixa de Preço', 'Price Range', 'Rango de precio', ['Faixa de Preco']),
  textEntry('Limpar Filtros', 'Clear Filters', 'Limpiar filtros'),
  textEntry('Buscar Espaços', 'Search Spaces', 'Buscar espacios', ['Buscar Espacos']),
  textEntry('espaço encontrado', 'space found', 'espacio encontrado', ['espaco encontrado']),
  textEntry('espaços encontrados', 'spaces found', 'espacios encontrados', ['espacos encontrados']),
  textEntry('Nome ou localização...', 'Name or location...', 'Nombre o ubicación...', ['Nome ou localizacao...']),
  textEntry('Entrar', 'Sign in', 'Entrar'),
  textEntry('Cadastre-se', 'Sign up', 'Registrarse'),
  textEntry('Faça seu login', 'Sign in to your account', 'Inicia sesión', ['Faca seu login']),
  textEntry('Crie sua conta', 'Create your account', 'Crea tu cuenta'),
  textEntry('Recupere sua senha', 'Recover your password', 'Recupera tu contraseña'),
  textEntry('Verifique seu e-mail', 'Verify your email', 'Verifica tu email'),
  textEntry('Esqueci minha senha', 'I forgot my password', 'Olvidé mi contraseña'),
  textEntry('Ainda não tenho uma conta?', 'I do not have an account yet?', '¿Aún no tengo una cuenta?', ['Ainda nao tenho uma conta?']),
  textEntry('Já tenho uma conta?', 'I already have an account?', '¿Ya tengo una cuenta?', ['Ja tenho uma conta?']),
  textEntry('Usuário', 'User', 'Usuario', ['Usuario']),
  textEntry('Proprietário', 'Owner', 'Propietario', ['Proprietario']),
  textEntry('Salvar Alterações', 'Save Changes', 'Guardar cambios', ['Salvar Alteracoes']),
  textEntry('Excluir conta', 'Delete account', 'Eliminar cuenta'),
  textEntry('Realmente deseja excluir?', 'Do you really want to delete?', '¿Realmente deseas eliminar?'),
  textEntry('Excluir', 'Delete', 'Eliminar'),
  textEntry('Voltar', 'Back', 'Volver'),
  textEntry('Cancelar', 'Cancel', 'Cancelar'),
  textEntry('Confirmar', 'Confirm', 'Confirmar'),
  textEntry('Detalhes', 'Details', 'Detalles'),
  textEntry('Reservar', 'Reserve', 'Reservar'),
  textEntry('Aprovar', 'Approve', 'Aprobar'),
  textEntry('Reprovar', 'Reject', 'Reprobar'),
  textEntry('Ativar', 'Activate', 'Activar'),
  textEntry('Bloquear', 'Block', 'Bloquear'),
  textEntry('Remover', 'Remove', 'Eliminar'),
  textEntry('Selecionar todos', 'Select all', 'Seleccionar todos'),
  textEntry('Selecionar todas', 'Select all', 'Seleccionar todas'),
  textEntry('Nenhuma reserva próxima', 'No upcoming reservations', 'No hay reservas próximas', ['Nenhuma reserva proxima']),
  textEntry('Nenhuma observação informada.', 'No note provided.', 'No se informó ninguna observación.', ['Nenhuma observacao informada.']),
  textEntry('Sem ações disponíveis', 'No actions available', 'Sin acciones disponibles', ['Sem acoes disponiveis']),
  textEntry('Horários disponíveis', 'Available times', 'Horarios disponibles', ['Horarios disponiveis']),
  textEntry('Horários de Funcionamento', 'Operating Hours', 'Horarios de funcionamiento', ['Horarios de Funcionamento']),
  textEntry('Horário', 'Time', 'Horario', ['Horario']),
  textEntry('Preço geral', 'Base price', 'Precio general', ['Preco geral']),
  textEntry('Preço do horário', 'Time price', 'Precio del horario', ['Preco do horario']),
  textEntry('Validação documental', 'Document validation', 'Validación documental', ['Validacao documental']),
  textEntry('Obrigatória antes da liberação do espaço esportivo', 'Required before the sports space is released', 'Obligatoria antes de liberar el espacio deportivo', ['Obrigatoria antes da liberacao do espaco esportivo']),
  textEntry('Sua documentação será analisada pela equipe administrativa antes da liberação do espaço esportivo.', 'Your documentation will be reviewed by the administrative team before the sports space is released.', 'Tu documentación será analizada por el equipo administrativo antes de liberar el espacio deportivo.'),
  textEntry('Tipo de proprietário *', 'Owner type *', 'Tipo de propietario *', ['Tipo de proprietario *']),
  textEntry('Documento pessoal', 'Personal document', 'Documento personal'),
  textEntry('Comprovante de endereço', 'Proof of address', 'Comprobante de domicilio', ['Comprovante de endereco']),
  textEntry('Posse/propriedade', 'Possession/ownership', 'Posesión/propiedad'),
  textEntry('Autorização de gerenciamento', 'Management authorization', 'Autorización de gestión', ['Autorizacao de gerenciamento']),
  textEntry('Documento já aprovado', 'Document already approved', 'Documento ya aprobado', ['Documento ja aprovado']),
  textEntry('Informações Básicas', 'Basic Information', 'Información básica', ['Informacoes Basicas']),
  textEntry('Localização', 'Location', 'Ubicación', ['Localizacao']),
  textEntry('Endereço completo *', 'Full address *', 'Dirección completa *', ['Endereco completo *']),
  textEntry('Descrição', 'Description', 'Descripción', ['Descricao']),
  textEntry('Fotos do Campo', 'Field photos', 'Fotos del campo'),
  textEntry('Comodidades', 'Amenities', 'Comodidades'),
  textEntry('Nenhuma foto selecionada', 'No photo selected', 'Ninguna foto seleccionada'),
  textEntry('Confirmar cadastro', 'Confirm registration', 'Confirmar registro'),
  textEntry('Reprovar documentação', 'Reject documentation', 'Reprobar documentación', ['Reprovar documentacao']),
  textEntry('Motivo da reprovação', 'Rejection reason', 'Motivo del rechazo', ['Motivo da reprovacao']),
  textEntry('Confirmar reprovação', 'Confirm rejection', 'Confirmar rechazo', ['Confirmar reprovacao']),
  textEntry('Reprovando...', 'Rejecting...', 'Reprobando...'),
  textEntry('Nenhuma documentação enviada', 'No documentation submitted', 'No se envió documentación', ['Nenhuma documentacao enviada']),
  textEntry('Reservas recentes', 'Recent reservations', 'Reservas recientes'),
  textEntry('Visão geral', 'Overview', 'Vista general', ['Visao geral']),
  textEntry('Acompanhamento', 'Tracking', 'Seguimiento'),
  textEntry('Atendimento', 'Service', 'Atención'),
  textEntry('Fale com a PlayArena', 'Contact PlayArena', 'Habla con PlayArena'),
]

const textNodeRecords = new WeakMap()
const attributeRecords = new WeakMap()
const translatableAttributes = ['aria-label', 'placeholder', 'title']
const ignoredTranslationSelector = 'script, style, noscript, [data-no-translate]'
let documentTranslationFrame = null

const uiTextLookup = new Map()

function normalizeUiKey(value) {
  return correctPortugueseText(String(value || ''))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

uiTextEntries.forEach((entry) => {
  const values = [entry['pt-BR'], entry['en-US'], entry['es-ES'], ...entry.variants]
  values.forEach((value) => {
    uiTextLookup.set(normalizeUiKey(value), entry)
  })
})

const sortedUiTextEntries = [...uiTextEntries].sort((a, b) => b['pt-BR'].length - a['pt-BR'].length)

function withOriginalWhitespace(original, translated) {
  const leading = String(original).match(/^\s*/)?.[0] || ''
  const trailing = String(original).match(/\s*$/)?.[0] || ''
  return `${leading}${translated}${trailing}`
}

export function correctPortugueseText(value) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return value
  }

  return portugueseCorrections.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}

function correctSpanishText(value) {
  if (typeof value !== 'string') {
    return value
  }

  return value
    .replace(/\bvisualizacion\b/g, 'visualización')
    .replace(/\bRegion\b/g, 'Región')
    .replace(/\bmas\b/g, 'más')
    .replace(/\bcomo\b/g, 'cómo')
    .replace(/\bConfiguracion\b/g, 'Configuración')
}

function replaceKnownPhrases(value, language) {
  return sortedUiTextEntries.reduce((text, entry) => {
    const target = entry[language]
    const sources = [entry['pt-BR'], ...entry.variants]

    return sources.reduce((current, source) => current.split(source).join(target), text)
  }, value)
}

export function translateUiText(value, settings = getAppSettings()) {
  if (typeof value !== 'string' || !value.trim()) {
    return value
  }

  const language = settings.language || defaultAppSettings.language
  const corrected = correctPortugueseText(value.trim())
  const exactEntry = uiTextLookup.get(normalizeUiKey(value)) || uiTextLookup.get(normalizeUiKey(corrected))

  if (language === 'pt-BR') {
    return withOriginalWhitespace(value, exactEntry?.['pt-BR'] || corrected)
  }

  if (exactEntry) {
    return withOriginalWhitespace(value, exactEntry[language])
  }

  return withOriginalWhitespace(value, replaceKnownPhrases(corrected, language))
}

function shouldTranslateTextNode(node) {
  const parent = node.parentElement
  return Boolean(parent && node.nodeValue.trim() && !parent.closest(ignoredTranslationSelector))
}

function translateTextNode(node, settings) {
  const record = textNodeRecords.get(node)
  const current = node.nodeValue
  const original = record && current === record.translated ? record.original : current
  const translated = translateUiText(original, settings)

  textNodeRecords.set(node, { original, translated })

  if (current !== translated) {
    node.nodeValue = translated
  }
}

function translateElementAttributes(element, settings) {
  const records = attributeRecords.get(element) || {}
  let nextRecords = records

  translatableAttributes.forEach((attribute) => {
    if (!element.hasAttribute(attribute)) {
      return
    }

    const current = element.getAttribute(attribute)
    const record = records[attribute]
    const original = record && current === record.translated ? record.original : current
    const translated = translateUiText(original, settings)

    if (nextRecords === records) {
      nextRecords = { ...records }
    }

    nextRecords[attribute] = { original, translated }

    if (current !== translated) {
      element.setAttribute(attribute, translated)
    }
  })

  attributeRecords.set(element, nextRecords)
}

export function applyDocumentTranslations(settings = getAppSettings()) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.body

  if (!root) {
    return
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return shouldTranslateTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })

  const nodes = []
  let currentNode = walker.nextNode()

  while (currentNode) {
    nodes.push(currentNode)
    currentNode = walker.nextNode()
  }

  nodes.forEach((node) => translateTextNode(node, settings))
  root.querySelectorAll(translatableAttributes.map((attribute) => `[${attribute}]`).join(','))
    .forEach((element) => {
      if (!element.closest(ignoredTranslationSelector)) {
        translateElementAttributes(element, settings)
      }
    })
}

export function startDocumentTranslator(getSettings = getAppSettings) {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {}
  }

  function scheduleTranslation() {
    if (documentTranslationFrame) {
      return
    }

    documentTranslationFrame = window.requestAnimationFrame(() => {
      documentTranslationFrame = null
      applyDocumentTranslations(getSettings())
    })
  }

  const observer = new MutationObserver(scheduleTranslation)
  observer.observe(document.body, {
    attributeFilter: translatableAttributes,
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  })
  scheduleTranslation()

  return () => {
    observer.disconnect()

    if (documentTranslationFrame) {
      window.cancelAnimationFrame(documentTranslationFrame)
      documentTranslationFrame = null
    }
  }
}

function parseSavedSettings(value) {
  if (!value) {
    return defaultAppSettings
  }

  try {
    const parsed = JSON.parse(value)

    return {
      ...defaultAppSettings,
      ...parsed,
      accessibility: {
        ...defaultAppSettings.accessibility,
        ...(parsed.accessibility || {}),
      },
    }
  } catch {
    return defaultAppSettings
  }
}

export function getAppSettings() {
  if (typeof window === 'undefined') {
    return defaultAppSettings
  }

  return parseSavedSettings(window.localStorage.getItem(settingsStorageKey))
}

export function saveAppSettings(settings) {
  if (typeof window === 'undefined') {
    return settings
  }

  const nextSettings = {
    ...defaultAppSettings,
    ...settings,
    accessibility: {
      ...defaultAppSettings.accessibility,
      ...(settings.accessibility || {}),
    },
  }

  window.localStorage.setItem(settingsStorageKey, JSON.stringify(nextSettings))
  applyAccessibilitySettings(nextSettings)
  window.dispatchEvent(new CustomEvent(settingsChangedEvent, { detail: nextSettings }))
  return nextSettings
}

export function subscribeAppSettings(callback) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  function listener(event) {
    callback(event.detail || getAppSettings())
  }

  window.addEventListener(settingsChangedEvent, listener)
  window.addEventListener('storage', listener)

  return () => {
    window.removeEventListener(settingsChangedEvent, listener)
    window.removeEventListener('storage', listener)
  }
}

export function applyAccessibilitySettings(settings = getAppSettings()) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('playarena-large-text', settings.accessibility.largerText)
  document.documentElement.classList.toggle('playarena-high-contrast', settings.accessibility.highContrast)
  document.documentElement.classList.toggle('playarena-reduced-motion', settings.accessibility.reducedMotion)
  document.documentElement.lang = settings.language || defaultAppSettings.language
}

export function translate(key, settings = getAppSettings()) {
  const language = settings.language || defaultAppSettings.language
  const rawValue = translations[language]?.[key] || translations[defaultAppSettings.language][key] || key

  if (language === 'pt-BR') {
    return correctPortugueseText(rawValue)
  }

  if (language === 'es-ES') {
    return correctSpanishText(rawValue)
  }

  return rawValue
}

export function translateNavLabel(navId, fallback, settings = getAppSettings()) {
  const translationKey = navTranslationKeys[navId]
  return translationKey ? translate(translationKey, settings) : fallback
}

export function formatAppCurrency(value, settings = getAppSettings()) {
  const currency = currencyOptions.find((option) => option.value === settings.currency) || currencyOptions[0]
  const language = languageOptions.find((option) => option.value === settings.language) || languageOptions[0]
  const convertedValue = Number(value || 0) * currency.rateFromBRL

  return convertedValue.toLocaleString(language.locale, {
    style: 'currency',
    currency: currency.value,
  })
}
