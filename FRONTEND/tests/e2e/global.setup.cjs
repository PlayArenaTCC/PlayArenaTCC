const path = require('path');

const backendDir = path.resolve(__dirname, '..', '..', '..', 'backend');
require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') });

const bcrypt = require(path.join(backendDir, 'node_modules', 'bcrypt'));
const { Op } = require(path.join(backendDir, 'node_modules', 'sequelize'));
const {
  CadastroPendente,
  CredencialBanida,
  DocumentacaoLocal,
  HorarioDisponivel,
  Notificacao,
  Proprietario,
  Quadra,
  RecuperacaoSenha,
  Reserva,
  Usuario,
  sequelize,
} = require(path.join(backendDir, 'src', 'models'));

const TEST_PASSWORD = 'User1234@';
const TEST_COURT_NAME = 'Playwright Arena Visual';

const accounts = {
  user: {
    email: 'playwright.user@playarena.com',
    cpf: buildCpf('245119870'),
    nome: 'Playwright Usuario Visual',
    telefone: '44 999991111',
  },
  targetUser: {
    email: 'playwright.target@playarena.com',
    cpf: buildCpf('245119871'),
    nome: 'Playwright Alvo Admin',
    telefone: '44 999991112',
  },
  owner: {
    email: 'playwright.owner@playarena.com',
    cpf_cnpj: buildCpf('245119872'),
    nome_responsavel: 'Playwright Proprietario Visual',
    nome_empresa: 'Playwright Arena Testes',
    telefone: '44 999992222',
    status_aprovacao: 'aprovado',
  },
  pendingOwner: {
    email: 'playwright.pending.owner@playarena.com',
    cpf_cnpj: buildCpf('245119873'),
    nome_responsavel: 'Playwright Proprietario Pendente',
    nome_empresa: 'Playwright Arena Pendente',
    telefone: '44 999992223',
    status_aprovacao: 'pendente',
  },
};

function cpfDigit(baseDigits) {
  const factor = baseDigits.length + 1;
  const sum = baseDigits
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (factor - index), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

function buildCpf(base) {
  const firstNine = String(base).replace(/\D/g, '').padStart(9, '0').slice(0, 9);
  const firstDigit = cpfDigit(firstNine);
  const secondDigit = cpfDigit(`${firstNine}${firstDigit}`);
  return `${firstNine}${firstDigit}${secondDigit}`;
}

async function upsert(Model, where, values) {
  const existing = await Model.findOne({ where });

  if (existing) {
    await existing.update(values);
    return existing.reload();
  }

  return Model.create({ ...where, ...values });
}

function documentationKey() {
  return 'playwright-arena-visual|rua-dos-testes-100|centro|campo-mourao|pr';
}

async function seedSchedules(quadra) {
  await HorarioDisponivel.destroy({ where: { quadra_id: quadra.id } });

  const rows = [];
  for (let day = 0; day <= 6; day += 1) {
    rows.push(
      { quadra_id: quadra.id, dia_semana: day, data: null, hora_inicio: '18:00', hora_fim: '19:00', valor: 120, valor_especial: false, disponivel: true },
      { quadra_id: quadra.id, dia_semana: day, data: null, hora_inicio: '19:00', hora_fim: '20:00', valor: 120, valor_especial: false, disponivel: true },
      { quadra_id: quadra.id, dia_semana: day, data: null, hora_inicio: '20:00', hora_fim: '21:00', valor: 120, valor_especial: false, disponivel: true },
    );
  }

  await HorarioDisponivel.bulkCreate(rows);
}

async function globalSetup() {
  await sequelize.authenticate();

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const trackedEmails = Object.values(accounts).map((account) => account.email);
  const trackedDocuments = Object.values(accounts).map((account) => account.cpf || account.cpf_cnpj);

  await CredencialBanida.destroy({
    where: {
      [Op.or]: [
        { email: { [Op.in]: trackedEmails } },
        { cpf: { [Op.in]: trackedDocuments } },
      ],
    },
  });
  await CadastroPendente.destroy({ where: { email_verificacao: { [Op.in]: trackedEmails } } });
  await RecuperacaoSenha.destroy({ where: { email: { [Op.in]: trackedEmails } } });

  const user = await upsert(Usuario, { email: accounts.user.email }, {
    nome: accounts.user.nome,
    cpf: accounts.user.cpf,
    senha_hash: passwordHash,
    telefone: accounts.user.telefone,
    status: 'ativo',
    bloqueada_inicio_em: null,
    bloqueada_fim_em: null,
    motivo_bloqueio: null,
  });
  const targetUser = await upsert(Usuario, { email: accounts.targetUser.email }, {
    nome: accounts.targetUser.nome,
    cpf: accounts.targetUser.cpf,
    senha_hash: passwordHash,
    telefone: accounts.targetUser.telefone,
    status: 'ativo',
    bloqueada_inicio_em: null,
    bloqueada_fim_em: null,
    motivo_bloqueio: null,
  });
  const owner = await upsert(Proprietario, { email: accounts.owner.email }, {
    nome_responsavel: accounts.owner.nome_responsavel,
    nome_empresa: accounts.owner.nome_empresa,
    cpf_cnpj: accounts.owner.cpf_cnpj,
    senha_hash: passwordHash,
    telefone: accounts.owner.telefone,
    status_aprovacao: accounts.owner.status_aprovacao,
    ativo: true,
    bloqueada_inicio_em: null,
    bloqueada_fim_em: null,
    motivo_bloqueio: null,
  });
  await upsert(Proprietario, { email: accounts.pendingOwner.email }, {
    nome_responsavel: accounts.pendingOwner.nome_responsavel,
    nome_empresa: accounts.pendingOwner.nome_empresa,
    cpf_cnpj: accounts.pendingOwner.cpf_cnpj,
    senha_hash: passwordHash,
    telefone: accounts.pendingOwner.telefone,
    status_aprovacao: accounts.pendingOwner.status_aprovacao,
    ativo: true,
    bloqueada_inicio_em: null,
    bloqueada_fim_em: null,
    motivo_bloqueio: null,
  });

  const existingCourt = await Quadra.findOne({
    where: {
      proprietario_id: owner.id,
      nome: TEST_COURT_NAME,
    },
  });
  const cleanupReservationWhere = [
    { usuario_id: user.id },
    { usuario_id: targetUser.id },
  ];

  if (existingCourt) {
    cleanupReservationWhere.push({ quadra_id: existingCourt.id });
    await Notificacao.destroy({
      where: {
        [Op.or]: [
          { userId: { [Op.in]: [user.id, targetUser.id] } },
          { recipientId: owner.id },
          { quadraId: existingCourt.id },
        ],
      },
    });
    await Reserva.destroy({ where: { [Op.or]: cleanupReservationWhere } });
  } else {
    await Notificacao.destroy({
      where: {
        [Op.or]: [
          { userId: { [Op.in]: [user.id, targetUser.id] } },
          { recipientId: owner.id },
        ],
      },
    });
    await Reserva.destroy({ where: { [Op.or]: cleanupReservationWhere } });
  }

  const documentacao = await upsert(DocumentacaoLocal, {
    proprietario_id: owner.id,
    endereco_key: documentationKey(),
  }, {
    tipo_proprietario: 'dono_local',
    endereco: 'Rua dos Testes, 100',
    bairro: 'Centro',
    cidade: 'Campo Mourao',
    estado: 'PR',
    cep: '87300-000',
    documentos: {
      documento_pessoal: '/uploads/documentos/playwright-documento-pessoal.pdf',
      cpf: '/uploads/documentos/playwright-cpf.pdf',
      comprovante_endereco: '/uploads/documentos/playwright-endereco.pdf',
      comprovante_posse: '/uploads/documentos/playwright-posse.pdf',
    },
    status: 'aprovado',
    enviado_em: new Date(),
    responsavel_id: owner.id,
    administrador_id: null,
    analisado_em: new Date(),
    motivo_reprovacao: null,
  });

  const courtValues = {
    proprietario_id: owner.id,
    documentacao_local_id: documentacao.id,
    nome: TEST_COURT_NAME,
    descricao: 'Quadra criada automaticamente para testes visuais com Playwright.',
    modalidade: 'futsal',
    modalidades: ['futsal', 'society'],
    tipo_espaco: 'Quadra',
    endereco: 'Rua dos Testes',
    numero: '100',
    bairro: 'Centro',
    cidade: 'Campo Mourao',
    estado: 'PR',
    cep: '87300-000',
    latitude: -24.0432,
    longitude: -52.3789,
    localizacao_confirmada: true,
    preco_hora: 120,
    preco_original: null,
    imagem_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',
    fotos: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80'],
    horarios_funcionamento: [
      { dias: [0, 1, 2, 3, 4, 5, 6], hora_inicio: '18:00', hora_fim: '21:00' },
    ],
    amenities: ['Estacionamento', 'Iluminacao', 'Vestiario'],
    ativa: true,
    desativada_inicio_em: null,
    desativada_fim_em: null,
    motivo_desativacao: null,
  };
  const quadra = existingCourt
    ? await existingCourt.update(courtValues).then(() => existingCourt.reload())
    : await Quadra.create(courtValues);

  await seedSchedules(quadra);
  await sequelize.close();
}

module.exports = globalSetup;
