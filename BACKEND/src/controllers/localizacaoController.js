const localizacaoService = require('../services/localizacaoService');

async function lookupCep(request, response) {
  const localizacao = await localizacaoService.lookupCep(request.params.cep);
  response.json({ localizacao });
}

async function geocodeAddress(request, response) {
  const localizacao = await localizacaoService.resolveCourtLocation(request.query);
  response.json({ localizacao });
}

module.exports = {
  geocodeAddress,
  lookupCep,
};
