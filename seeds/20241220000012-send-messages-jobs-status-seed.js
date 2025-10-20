'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('send_messages_jobs_status', [
      {
        slug: 'pending',
        description: 'Trabajo de envío pendiente',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'running',
        description: 'Trabajo de envío ejecutándose',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'paused',
        description: 'Trabajo de envío pausado',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'completed',
        description: 'Trabajo de envío completado',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'failed',
        description: 'Trabajo de envío fallido',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'cancelled',
        description: 'Trabajo de envío cancelado',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('send_messages_jobs_status', null, {});
  }
};
