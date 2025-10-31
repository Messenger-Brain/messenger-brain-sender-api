'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('fetch_contacts_jobs_status', [
      {
        slug: 'pending',
        description: 'Trabajo de contactos pendiente',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'running',
        description: 'Trabajo de contactos ejecutándose',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'paused',
        description: 'Trabajo de contactos pausado',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'completed',
        description: 'Trabajo de contactos completado',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'failed',
        description: 'Trabajo de contactos fallido',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'cancelled',
        description: 'Trabajo de contactos cancelado',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('fetch_contacts_jobs_status', null, {});
  }
};
