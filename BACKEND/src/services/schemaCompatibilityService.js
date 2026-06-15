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

async function ensureAdminProfilePhotoSchemaCompatibility() {
  const [tables] = await sequelize.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'administradores'
  `);

  if (!tables.length) {
    return;
  }

  const [columns] = await sequelize.query(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'administradores'
      and column_name = 'foto_perfil_url'
  `);

  if (!columns.length) {
    await sequelize.query('alter table administradores add column foto_perfil_url varchar(255)');
  }
}

module.exports = {
  ensureAdminProfilePhotoSchemaCompatibility,
  ensureNotificationSchemaCompatibility,
};
