const mediaService = require('../services/mediaService');

async function getMedia(request, response) {
  const media = await mediaService.getMediaAsset(request.params.id);
  const data = Buffer.isBuffer(media.dados) ? media.dados : Buffer.from(media.dados);

  response.set('Content-Type', media.mime_type);
  response.set('Content-Length', String(data.length));
  response.set('Cache-Control', 'public, max-age=31536000, immutable');
  response.send(data);
}

module.exports = {
  getMedia,
};
