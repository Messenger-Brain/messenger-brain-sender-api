'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('user_subscriptions_status', [
      {
        slug: 'active',
        description: 'Suscripción de usuario activa',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'inactive',
        description: 'Suscripción de usuario inactiva',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'pending',
        description: 'Suscripción de usuario pendiente',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'cancelled',
        description: 'Suscripción de usuario cancelada',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_subscriptions_status', null, {});
  }
};
