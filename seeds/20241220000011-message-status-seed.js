'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('message_status', [
      {
        slug: 'sent',
        description: 'Mensaje enviado',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'delivered',
        description: 'Mensaje entregado',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'read',
        description: 'Mensaje leído',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'failed',
        description: 'Mensaje fallido',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'pending',
        description: 'Mensaje pendiente',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('message_status', null, {});
  }
};
