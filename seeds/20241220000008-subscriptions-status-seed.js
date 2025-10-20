'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('subscriptions_status', [
      {
        slug: 'active',
        description: 'Suscripción activa',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'inactive',
        description: 'Suscripción inactiva',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'suspended',
        description: 'Suscripción suspendida',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'expired',
        description: 'Suscripción expirada',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('subscriptions_status', null, {});
  }
};
