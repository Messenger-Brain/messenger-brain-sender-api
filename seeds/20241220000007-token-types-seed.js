'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('token_types', [
      {
        slug: 'personal_token',
        description: 'Token personal para API externa',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        slug: 'refresh_token',
        description: 'Token de renovación JWT',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('token_types', null, {});
  }
};
