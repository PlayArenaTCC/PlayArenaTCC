export const demoQuadras = [
  {
    id: 'demo-quadra-integrado',
    nome: 'Quadra Colégio Integrado',
    descricao: 'Quadra coberta com piso esportivo, iluminação noturna e arquibancada lateral.',
    modalidade: 'futsal',
    endereco: 'Rua das Palmeiras, 1200',
    bairro: 'Centro',
    cidade: 'Campo Mourão',
    estado: 'PR',
    preco_hora: 90,
    imagem_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    total_reviews: 28,
    amenities: ['Coberta', 'Iluminação', 'Vestiário', 'Estacionamento'],
    proprietario: { nome_empresa: 'Arena Integrada', telefone: '(44) 99999-2000' },
  },
  {
    id: 'demo-quadra-unespar',
    nome: 'Unespar Quadra',
    descricao: 'Espaço poliesportivo para jogos coletivos e treinos semanais.',
    modalidade: 'poliesportiva',
    endereco: 'Av. Comendador Norberto Marcondes, 733',
    bairro: 'Jardim Cidade Nova',
    cidade: 'Campo Mourão',
    estado: 'PR',
    preco_hora: 75,
    imagem_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',
    rating: 4.7,
    total_reviews: 16,
    amenities: ['Arquibancada', 'Bebedouro', 'Coberta'],
    proprietario: { nome_empresa: 'Unespar Esportes', telefone: '(44) 99999-2100' },
  },
  {
    id: 'demo-quadra-society',
    nome: 'Arena Society Campo Mourão',
    descricao: 'Campo society com grama sintética, estacionamento e vestiários.',
    modalidade: 'society',
    endereco: 'Rua Harrison José Borges, 455',
    bairro: 'Centro',
    cidade: 'Campo Mourão',
    estado: 'PR',
    preco_hora: 120,
    imagem_url: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    total_reviews: 21,
    amenities: ['Grama sintética', 'Churrasqueira', 'Estacionamento'],
    proprietario: { nome_empresa: 'Arena Society', telefone: '(44) 99999-2200' },
  },
]

export const defaultHorarios = [
  { id: 'demo-h1', dia_semana: 1, hora_inicio: '18:00', hora_fim: '19:00', valor: 90 },
  { id: 'demo-h2', dia_semana: 1, hora_inicio: '19:00', hora_fim: '20:00', valor: 90 },
  { id: 'demo-h3', dia_semana: 3, hora_inicio: '19:00', hora_fim: '20:00', valor: 90 },
  { id: 'demo-h4', dia_semana: 5, hora_inicio: '20:00', hora_fim: '21:00', valor: 90 },
  { id: 'demo-h5', dia_semana: 6, hora_inicio: '09:00', hora_fim: '10:00', valor: 90 },
]

export const fallbackCourtImage = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80'

export const roleLabels = {
  usuario: 'Usuário',
  proprietario: 'Proprietário',
  admin: 'Administrador',
}

export const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const sportLabels = {
  futebol: 'Futebol',
  futsal: 'Futsal',
  volei: 'Vôlei',
  basquete: 'Basquete',
  tenis: 'Tênis',
  beach_tennis: 'Beach Tennis',
  padel: 'Padel',
  poliesportiva: 'Poliesportiva',
  society: 'Society',
}
