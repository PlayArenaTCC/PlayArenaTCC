const { Op } = require('sequelize');

const { Quadra, sequelize } = require('./models');
const { resolveCourtLocation } = require('./services/localizacaoService');

function extractCep(value) {
  return String(value || '').match(/\b\d{5}-?\d{3}\b/)?.[0] || '';
}

function extractNumber(value) {
  return String(value || '').match(/,\s*(\d+[A-Za-z0-9/-]*)\b/)?.[1] || '';
}

async function backfillCourtCoordinates() {
  const courts = await Quadra.findAll({
    where: {
      [Op.or]: [
        { latitude: null },
        { longitude: null },
      ],
    },
    order: [['created_at', 'ASC']],
  });
  let updated = 0;
  let skipped = 0;

  for (const court of courts) {
    const cep = court.cep || extractCep(court.endereco);
    const numero = court.numero || extractNumber(court.endereco);

    if (!cep || !numero) {
      skipped += 1;
      console.log(`Ignorada: ${court.nome} (CEP ou numero ausente).`);
      continue;
    }

    try {
      const location = await resolveCourtLocation({
        cep,
        numero,
        endereco: court.endereco,
        bairro: court.bairro,
        cidade: court.cidade,
        estado: court.estado,
      });

      await court.update({
        endereco: location.endereco,
        numero: location.numero,
        bairro: location.bairro || null,
        cidade: location.cidade,
        estado: location.estado,
        cep: location.cep,
        latitude: location.latitude,
        longitude: location.longitude,
        localizacao_confirmada: false,
      });
      updated += 1;
      console.log(`Atualizada: ${court.nome}.`);
    } catch (error) {
      skipped += 1;
      console.log(`Ignorada: ${court.nome} (${error.message}).`);
    }
  }

  console.log(`Backfill concluido. Atualizadas: ${updated}. Ignoradas: ${skipped}.`);
}

backfillCourtCoordinates()
  .catch((error) => {
    console.error('Falha ao preencher coordenadas:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
