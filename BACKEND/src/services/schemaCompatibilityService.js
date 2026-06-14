const { sequelize } = require('../models');

async function ensureNotificationSchemaCompatibility() {
  const [columns] = await sequelize.query(`
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'user_id'
  `);

  if (columns[0]?.is_nullable === 'NO') {
    await sequelize.query('alter table notificacoes alter column user_id drop not null');
  }
}

module.exports = {
  ensureNotificationSchemaCompatibility,
};
