const bcrypt = require('bcrypt');
const {
  Administrador,
  HorarioDisponivel,
  Proprietario,
  Quadra,
  Usuario,
  sequelize,
} = require('./models');

const senhaDemo = '123456';

async function findOrCreateByEmail(Model, email, defaults) {
  const [record] = await Model.findOrCreate({
    where: { email },
    defaults,
  });

  return record;
}

async function seedDemo() {
  await sequelize.authenticate();
  await sequelize.sync();

  const senha_hash = await bcrypt.hash(senhaDemo, 10);

  const usuario = await findOrCreateByEmail(Usuario, 'usuario@playarena.com', {
    nome: 'Joao Silva',
    cpf: '12345678909',
    email: 'usuario@playarena.com',
    senha_hash,
    telefone: '(44) 99999-1000',
  });

  const proprietario = await findOrCreateByEmail(Proprietario, 'proprietario@playarena.com', {
    nome_responsavel: 'Amanda Pereira',
    nome_empresa: 'Arena Integrada',
    cpf_cnpj: '12345678000190',
    email: 'proprietario@playarena.com',
    senha_hash,
    telefone: '(44) 99999-2000',
    status_aprovacao: 'aprovado',
  });

  await findOrCreateByEmail(Administrador, 'admin@playarena.com', {
    nome: 'Admin PlayArena',
    email: 'admin@playarena.com',
    senha_hash,
    nivel_acesso: 'super_admin',
  });

  const quadras = [
    {
      nome: 'Quadra Colegio Integrado',
      descricao: 'Quadra coberta com piso esportivo, iluminacao noturna e arquibancada lateral.',
      modalidade: 'futsal',
      endereco: 'Rua das Palmeiras, 1200',
      bairro: 'Centro',
      cidade: 'Campo Mourão',
      estado: 'PR',
      preco_hora: 90,
      imagem_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',
    },
    {
      nome: 'Unespar Quadra',
      descricao: 'Espaço poliesportivo para jogos coletivos e treinos semanais.',
      modalidade: 'poliesportiva',
      endereco: 'Av. Comendador Norberto Marcondes, 733',
      bairro: 'Jardim Cidade Nova',
      cidade: 'Campo Mourão',
      estado: 'PR',
      preco_hora: 75,
      imagem_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',
    },
    {
      nome: 'Arena Society Campo Mourão',
      descricao: 'Campo society com grama sintetica, estacionamento e vestiarios.',
      modalidade: 'society',
      endereco: 'Rua Harrison José Borges, 455',
      bairro: 'Centro',
      cidade: 'Campo Mourão',
      estado: 'PR',
      preco_hora: 120,
      imagem_url: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=900&q=80',
    },
  ];

  for (const court of quadras) {
    const [quadra] = await Quadra.findOrCreate({
      where: {
        proprietario_id: proprietario.id,
        nome: court.nome,
      },
      defaults: {
        ...court,
        proprietario_id: proprietario.id,
      },
    });

    const horarios = [
      { dia_semana: 1, hora_inicio: '18:00', hora_fim: '19:00' },
      { dia_semana: 1, hora_inicio: '19:00', hora_fim: '20:00' },
      { dia_semana: 3, hora_inicio: '19:00', hora_fim: '20:00' },
      { dia_semana: 5, hora_inicio: '20:00', hora_fim: '21:00' },
      { dia_semana: 6, hora_inicio: '09:00', hora_fim: '10:00' },
    ];

    for (const horario of horarios) {
      await HorarioDisponivel.findOrCreate({
        where: {
          quadra_id: quadra.id,
          dia_semana: horario.dia_semana,
          hora_inicio: horario.hora_inicio,
          hora_fim: horario.hora_fim,
        },
        defaults: {
          ...horario,
          quadra_id: quadra.id,
          valor: court.preco_hora,
        },
      });
    }
  }

  console.log('Dados demo criados/atualizados.');
  console.log(`Usuário: ${usuario.email} / ${senhaDemo}`);
  console.log(`Proprietário: ${proprietario.email} / ${senhaDemo}`);
  console.log(`Admin: admin@playarena.com / ${senhaDemo}`);
}

seedDemo()
  .catch((error) => {
    console.error('Falha ao criar dados demo:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
