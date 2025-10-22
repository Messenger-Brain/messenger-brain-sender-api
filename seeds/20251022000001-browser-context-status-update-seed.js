'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero, eliminar los registros existentes si los hay
    await queryInterface.bulkDelete('browser_context_status', null, {});

    // Insertar los nuevos estados
    await queryInterface.bulkInsert('browser_context_status', [
      {
        slug: 'available',
        description: 'Contexto de navegador disponible para uso',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'busy',
        description: 'Contexto de navegador ocupado procesando',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'disconnected',
        description: 'Contexto de navegador desconectado',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'error',
        description: 'Contexto de navegador con error',
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

