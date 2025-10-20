'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('browser_context_status', [
      {
        slug: 'active',
        description: 'Contexto de navegador activo',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'inactive',
        description: 'Contexto de navegador inactivo',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'error',
        description: 'Error en contexto de navegador',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'closed',
        description: 'Contexto de navegador cerrado',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('browser_context_status', null, {});
  }
};
